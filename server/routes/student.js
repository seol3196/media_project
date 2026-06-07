const express = require('express');
const { db, publicStudent } = require('../db/init');
const phase1 = require('../content/phase1');
const phase2 = require('../content/phase2');
const phase3 = require('../content/phase3');

const router = express.Router();

function requireStudent(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/, '');
  const student = db.prepare('SELECT * FROM students WHERE session_token = ?').get(token);
  if (!student) return res.status(401).json({ error: '학생 로그인이 필요합니다' });
  req.student = student;
  next();
}

function getIo(req) {
  return req.app.get('io');
}

function voteCounts() {
  const rows = db.prepare('SELECT vote, COUNT(*) AS count FROM phase3_votes GROUP BY vote').all();
  return { trust: 0, suspicious: 0, unsure: 0, ...Object.fromEntries(rows.map((row) => [row.vote, row.count])) };
}

function phaseState(classCode) {
  const row = db.prepare('SELECT current_phase, phase1_open, phase2_open, phase3_open, board_open, revealed FROM teachers WHERE class_code = ?').get(classCode);
  return {
    phase: row?.current_phase ?? 0,
    open_phases: {
      1: Boolean(row?.phase1_open),
      2: Boolean(row?.phase2_open),
      3: Boolean(row?.phase3_open),
    },
    board_open: Boolean(row?.board_open),
    revealed: Boolean(row?.revealed),
  };
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function activity1State(classCode) {
  const row = db.prepare('SELECT activity1_step, activity1_revealed FROM teachers WHERE class_code = ?').get(classCode);
  const counts = db.prepare(`
    SELECT a.question, COUNT(*) AS count
    FROM activity1_answers a JOIN students s ON s.id = a.student_id
    WHERE s.class_code = ?
    GROUP BY a.question
  `).all(classCode);
  const postCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM activity1_sns_posts p JOIN students s ON s.id = p.student_id
    WHERE s.class_code = ?
  `).get(classCode)?.count || 0;
  return {
    step: row?.activity1_step || 1,
    revealed: parseJson(row?.activity1_revealed, {}),
    counts: { 1: 0, 2: 0, 3: 0, 4: postCount, ...Object.fromEntries(counts.map((item) => [item.question, item.count])) },
  };
}

function activity2State(classCode) {
  const row = db.prepare('SELECT activity2_step, activity2_revealed FROM teachers WHERE class_code = ?').get(classCode);
  return { step: row?.activity2_step || 1, total: phase2.length, revealed: parseJson(row?.activity2_revealed, {}) };
}

function activity2PostByStep(step) {
  return phase2[Math.max(0, Math.min(phase2.length - 1, step - 1))];
}

router.use(requireStudent);

router.get('/profile', (req, res) => {
  res.json({ student: publicStudent(req.student), state: phaseState(req.student.class_code) });
});

router.get('/phase1/content', (req, res) => {
  res.json({ cards: phase1 });
});

router.get('/activity1/state', (req, res) => {
  const state = activity1State(req.student.class_code);
  const answers = db.prepare('SELECT question, payload FROM activity1_answers WHERE student_id = ?').all(req.student.id);
  res.json({
    state,
    answers: Object.fromEntries(answers.map((row) => [row.question, parseJson(row.payload, {})])),
    cards: phase1,
  });
});

router.post('/activity1/answer', (req, res) => {
  const question = Number(req.body.question);
  const payload = req.body.payload || {};
  const state = activity1State(req.student.class_code);
  if (![1, 2, 3].includes(question)) return res.status(400).json({ error: '문제 번호를 확인해주세요' });
  if (question !== state.step) return res.status(409).json({ error: '아직 이 문제를 풀 수 없습니다' });
  db.prepare(`
    INSERT INTO activity1_answers (student_id, question, payload, submitted_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id, question) DO UPDATE SET
      payload = excluded.payload,
      submitted_at = CURRENT_TIMESTAMP
  `).run(req.student.id, question, JSON.stringify(payload));
  getIo(req).emit('activity1_state_changed', activity1State(req.student.class_code));
  if (question === 3) getIo(req).emit('activity1_padlet_updated');
  res.json({ ok: true, answer: payload });
});

router.post('/activity1/sns-post', (req, res) => {
  const state = activity1State(req.student.class_code);
  if (state.step !== 4) return res.status(409).json({ error: '아직 SNS 글을 올릴 수 없습니다' });
  const photoId = req.body.photo_id ? String(req.body.photo_id) : '';
  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ error: '게시글 내용을 입력해주세요' });
  if (content.length > 160) return res.status(400).json({ error: '게시글은 160자 이내로 작성해주세요' });
  db.prepare(`
    INSERT INTO activity1_sns_posts (student_id, photo_id, content, created_at, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id) DO UPDATE SET
      photo_id = excluded.photo_id,
      content = excluded.content,
      updated_at = CURRENT_TIMESTAMP
  `).run(req.student.id, photoId, content);
  getIo(req).emit('activity1_state_changed', activity1State(req.student.class_code));
  getIo(req).emit('activity1_sns_updated');
  res.json({ ok: true });
});

router.get('/activity1/sns-posts', (req, res) => {
  const posts = db.prepare(`
    SELECT p.id, p.photo_id, p.content, p.created_at, p.updated_at, s.student_number, s.name,
      COUNT(l.id) AS like_count,
      EXISTS(SELECT 1 FROM activity1_sns_likes mine WHERE mine.post_id = p.id AND mine.student_id = ?) AS liked_by_me
    FROM activity1_sns_posts p
    JOIN students s ON s.id = p.student_id
    LEFT JOIN activity1_sns_likes l ON l.post_id = p.id
    WHERE s.class_code = ?
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `).all(req.student.id, req.student.class_code);
  const myPost = db.prepare('SELECT id, photo_id, content FROM activity1_sns_posts WHERE student_id = ?').get(req.student.id);
  res.json({ posts: posts.map((post) => ({ ...post, liked_by_me: Boolean(post.liked_by_me) })), has_posted: Boolean(myPost), my_post: myPost || null });
});

router.post('/activity1/sns-posts/:postId/like', (req, res) => {
  const postId = Number(req.params.postId);
  const post = db.prepare(`
    SELECT p.id
    FROM activity1_sns_posts p JOIN students s ON s.id = p.student_id
    WHERE p.id = ? AND s.class_code = ?
  `).get(postId, req.student.class_code);
  if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없습니다' });
  const liked = db.prepare('SELECT id FROM activity1_sns_likes WHERE post_id = ? AND student_id = ?').get(postId, req.student.id);
  if (liked) {
    db.prepare('DELETE FROM activity1_sns_likes WHERE id = ?').run(liked.id);
  } else {
    db.prepare('INSERT INTO activity1_sns_likes (post_id, student_id) VALUES (?, ?)').run(postId, req.student.id);
  }
  getIo(req).emit('activity1_sns_updated');
  res.json({ ok: true, liked: !liked });
});

router.delete('/activity1/answer/:question', (req, res) => {
  const question = Number(req.params.question);
  if (question !== 3) return res.status(400).json({ error: '회수는 3번 답변에서만 가능합니다' });
  db.prepare('DELETE FROM activity1_answers WHERE student_id = ? AND question = ?').run(req.student.id, question);
  getIo(req).emit('activity1_state_changed', activity1State(req.student.class_code));
  getIo(req).emit('activity1_padlet_updated');
  res.json({ ok: true });
});

router.post('/phase1/submit', (req, res) => {
  const { delivery_methods = {}, feature_matches = {}, most_accurate, most_emotional, free_text } = req.body;
  if (!most_accurate || !most_emotional) return res.status(400).json({ error: '필수 문항을 선택해주세요' });
  db.prepare('INSERT INTO phase1_responses (student_id, delivery_methods, feature_matches, most_accurate, most_emotional, free_text) VALUES (?, ?, ?, ?, ?, ?)').run(
    req.student.id,
    JSON.stringify(delivery_methods),
    JSON.stringify(feature_matches),
    most_accurate,
    most_emotional,
    free_text || '',
  );
  res.json({ ok: true });
});

router.get('/activity2/state', (req, res) => {
  const state = activity2State(req.student.class_code);
  const post = activity2PostByStep(state.step);
  const revision = db.prepare('SELECT * FROM activity2_comment_revisions WHERE student_id = ? AND post_id = ?').get(req.student.id, post.id);
  res.json({ state, post, revision: revision || null, submitted: Boolean(revision), is_revealed: Boolean(state.revealed?.[post.id]) });
});

router.post('/activity2/revision', (req, res) => {
  const state = activity2State(req.student.class_code);
  const post = activity2PostByStep(state.step);
  const postId = String(req.body.post_id || '');
  const revisedText = String(req.body.revised_text || '').trim();
  const badComment = post.discussionComments.find((comment) => comment.needsRevision);
  if (!state.revealed?.[post.id]) return res.status(409).json({ error: '아직 수정할 댓글이 공개되지 않았습니다' });
  if (postId !== post.id) return res.status(409).json({ error: '아직 이 게시물을 수정할 수 없습니다' });
  if (!revisedText) return res.status(400).json({ error: '수정한 댓글을 입력해주세요' });
  if (revisedText.length > 220) return res.status(400).json({ error: '수정 댓글은 220자 이내로 작성해주세요' });
  db.prepare(`
    INSERT INTO activity2_comment_revisions (student_id, post_id, original_comment_id, revised_text, submitted_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id, post_id) DO UPDATE SET
      original_comment_id = excluded.original_comment_id,
      revised_text = excluded.revised_text,
      submitted_at = CURRENT_TIMESTAMP
  `).run(req.student.id, post.id, badComment.id, revisedText);
  getIo(req).emit('activity2_revisions_updated', { post_id: post.id });
  getIo(req).emit('activity2_state_changed', activity2State(req.student.class_code));
  res.json({ ok: true });
});

router.get('/activity2/revisions', (req, res) => {
  const requestedPostId = String(req.query.post_id || '');
  const state = activity2State(req.student.class_code);
  const post = requestedPostId ? phase2.find((item) => item.id === requestedPostId) : activity2PostByStep(state.step);
  if (!post) return res.status(404).json({ error: '게시물을 찾을 수 없습니다' });
  const own = db.prepare('SELECT id FROM activity2_comment_revisions WHERE student_id = ? AND post_id = ?').get(req.student.id, post.id);
  if (!own) return res.status(403).json({ error: '먼저 내 수정 댓글을 제출해주세요' });
  const revisions = db.prepare(`
    SELECT r.id, r.revised_text, r.submitted_at, s.student_number, s.name
    FROM activity2_comment_revisions r JOIN students s ON s.id = r.student_id
    WHERE s.class_code = ? AND r.post_id = ?
    ORDER BY r.submitted_at DESC
  `).all(req.student.class_code, post.id);
  res.json({ post, revisions });
});

router.get('/phase2/article', (req, res) => {
  const comments = db.prepare(`
    SELECT p.id, p.content, p.created_at, s.name, s.student_number
    FROM phase2_comments p JOIN students s ON s.id = p.student_id
    WHERE s.class_code = ?
    ORDER BY p.created_at DESC
  `).all(req.student.class_code);
  res.json({ ...phase2, liveComments: comments });
});

router.post('/phase2/classify', (req, res) => {
  const { classifications = [] } = req.body;
  const insert = db.prepare('INSERT OR REPLACE INTO phase2_classifications (student_id, comment_id, label, reason) VALUES (?, ?, ?, ?)');
  const tx = db.transaction(() => {
    classifications.forEach((item) => {
      if (item.comment_id && ['good', 'bad'].includes(item.label)) {
        insert.run(req.student.id, item.comment_id, item.label, item.reason || '');
      }
    });
  });
  tx();
  res.json({ ok: true });
});

router.post('/phase2/comment', (req, res) => {
  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ error: '댓글 내용을 입력해주세요' });
  const info = db.prepare('INSERT INTO phase2_comments (student_id, content) VALUES (?, ?)').run(req.student.id, content);
  const comment = db.prepare(`
    SELECT p.id, p.content, p.created_at, s.name, s.student_number
    FROM phase2_comments p JOIN students s ON s.id = p.student_id
    WHERE p.id = ?
  `).get(info.lastInsertRowid);
  getIo(req).emit('new_comment', { phase: 2, comment });
  res.json({ comment });
});

router.get('/phase3/article', (req, res) => {
  const team = req.student.team || 'A';
  res.json({ team, content: phase3[team], state: phaseState(req.student.class_code) });
});

router.get('/phase3/journalist', (req, res) => {
  const team = req.student.team || 'A';
  res.json({ journalist: phase3[team].journalist });
});

router.post('/phase3/comment', (req, res) => {
  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ error: '댓글 내용을 입력해주세요' });
  const team = req.student.team || 'A';
  const info = db.prepare('INSERT INTO phase3_comments (student_id, team, content) VALUES (?, ?, ?)').run(req.student.id, team, content);
  const comment = db.prepare('SELECT id, team, content, is_revealed, created_at FROM phase3_comments WHERE id = ?').get(info.lastInsertRowid);
  getIo(req).emit('new_comment', { phase: 3, comment });
  res.json({ comment });
});

router.get('/phase3/board', (req, res) => {
  const state = phaseState(req.student.class_code);
  const ownTeam = req.student.team || 'A';
  const targetTeam = state.board_open ? (ownTeam === 'A' ? 'B' : 'A') : ownTeam;
  const comments = db.prepare(`
    SELECT p.id, p.team, p.content, p.is_revealed, p.created_at, s.name, s.student_number
    FROM phase3_comments p JOIN students s ON s.id = p.student_id
    WHERE s.class_code = ? AND p.team = ?
    ORDER BY p.created_at DESC
  `).all(req.student.class_code, targetTeam);
  const guesses = db.prepare(`
    SELECT p.id, p.guess_text, p.is_correct, p.created_at, s.name, s.student_number
    FROM phase3_guesses p JOIN students s ON s.id = p.student_id
    WHERE s.class_code = ?
    ORDER BY p.created_at DESC
  `).all(req.student.class_code);
  res.json({ state, targetTeam, article: phase3[targetTeam], comments, votes: voteCounts(), guesses });
});

router.post('/phase3/vote', (req, res) => {
  const { vote } = req.body;
  if (!['trust', 'suspicious', 'unsure'].includes(vote)) return res.status(400).json({ error: '투표 항목을 선택해주세요' });
  db.prepare('INSERT OR REPLACE INTO phase3_votes (student_id, vote) VALUES (?, ?)').run(req.student.id, vote);
  const votes = voteCounts();
  getIo(req).emit('vote_updated', votes);
  res.json({ votes });
});

router.post('/phase3/guess', (req, res) => {
  const guessText = String(req.body.guess_text || '').trim();
  if (!guessText) return res.status(400).json({ error: '추리 내용을 입력해주세요' });
  const info = db.prepare('INSERT INTO phase3_guesses (student_id, guess_text) VALUES (?, ?)').run(req.student.id, guessText);
  const guess = db.prepare(`
    SELECT p.id, p.guess_text, p.is_correct, p.created_at, s.name, s.student_number
    FROM phase3_guesses p JOIN students s ON s.id = p.student_id
    WHERE p.id = ?
  `).get(info.lastInsertRowid);
  getIo(req).emit('guess_submitted', guess);
  res.json({ guess });
});

router.post('/phase3/reflection', (req, res) => {
  const { answer1 = '', answer2 = '', answer3 = '' } = req.body;
  db.prepare('INSERT INTO phase3_reflections (student_id, answer1, answer2, answer3) VALUES (?, ?, ?, ?)').run(req.student.id, answer1, answer2, answer3);
  res.json({ ok: true });
});

module.exports = router;
