const express = require('express');
const { db, publicStudent } = require('../db/init');
const phase2 = require('../content/phase2');
const phase3 = require('../content/phase3');

const router = express.Router();

function requireTeacher(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/, '');
  if (!token.startsWith('teacher:')) return res.status(401).json({ error: '교사 권한이 필요합니다' });
  req.class_code = token.split(':')[1];
  next();
}

function getIo(req) {
  return req.app.get('io');
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
  const counts = db.prepare(`
    SELECT r.post_id, COUNT(*) AS count
    FROM activity2_comment_revisions r JOIN students s ON s.id = r.student_id
    WHERE s.class_code = ?
    GROUP BY r.post_id
  `).all(classCode);
  return {
    step: row?.activity2_step || 1,
    total: phase2.length,
    revealed: parseJson(row?.activity2_revealed, {}),
    counts: Object.fromEntries(counts.map((item) => [item.post_id, item.count])),
  };
}

function activity2PostByStep(step) {
  return phase2[Math.max(0, Math.min(phase2.length - 1, step - 1))];
}

function phase3State(classCode) {
  const row = db.prepare('SELECT activity3_stage, activity3_intro_step, activity3_hunt_index, activity3_revealed, activity3_team_count FROM teachers WHERE class_code = ?').get(classCode);
  return {
    stage: row?.activity3_stage || 'intro',
    intro_step: row?.activity3_intro_step || 0,
    hunt_index: row?.activity3_hunt_index || 0,
    revealed: Boolean(row?.activity3_revealed),
    team_count: row?.activity3_team_count || 2,
  };
}

function phase3Posts(teamCount) {
  return phase3.slice(0, Math.max(2, Math.min(6, teamCount)));
}

function parseSelection(value) {
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function phase3Payload(classCode) {
  const state = phase3State(classCode);
  const posts = phase3Posts(state.team_count);
  const students = db.prepare('SELECT id, student_number, name, team FROM students WHERE class_code = ? ORDER BY CAST(student_number AS INTEGER), student_number').all(classCode);
  const missionRows = db.prepare("SELECT student_id, team, post_id FROM phase3_comments WHERE comment_type = 'mission' AND student_id IN (SELECT id FROM students WHERE class_code = ?)").all(classCode);
  const readyRows = db.prepare('SELECT student_id, team FROM phase3_team_ready WHERE student_id IN (SELECT id FROM students WHERE class_code = ?)').all(classCode);
  const normalRows = db.prepare("SELECT student_id, COUNT(DISTINCT post_id) AS count FROM phase3_comments WHERE comment_type = 'normal' AND student_id IN (SELECT id FROM students WHERE class_code = ?) GROUP BY student_id").all(classCode);
  const selectionRows = db.prepare('SELECT student_id, post_id FROM phase3_selections WHERE student_id IN (SELECT id FROM students WHERE class_code = ?)').all(classCode);
  const missionByStudent = new Set(missionRows.map((row) => row.student_id));
  const readyByStudent = new Set(readyRows.map((row) => row.student_id));
  const normalCounts = Object.fromEntries(normalRows.map((row) => [row.student_id, row.count]));
  const selectionByStudent = new Set(selectionRows.filter((row) => row.post_id === posts[state.hunt_index]?.team).map((row) => row.student_id));
  const team_status = posts.map((post) => {
    const members = students.filter((student) => student.team === post.team);
    return {
      team: post.team,
      title: post.title,
      members: members.length,
      commented: members.filter((student) => missionByStudent.has(student.id)).length,
      ready: members.filter((student) => readyByStudent.has(student.id)).length,
      complete: members.length > 0 && members.every((student) => readyByStudent.has(student.id)),
    };
  });
  const comment_progress = students.map((student) => ({
    id: student.id,
    student_number: student.student_number,
    name: student.name,
    team: student.team,
    count: normalCounts[student.id] || 0,
    required: Math.max(0, posts.length - 1),
  }));
  const hunt_post = posts[state.hunt_index] || posts[0];
  const hunt_comments = hunt_post ? db.prepare(`
    SELECT p.id, p.post_id, p.team, p.nickname, p.comment_type, p.content, s.student_number, s.name
    FROM phase3_comments p JOIN students s ON s.id = p.student_id
    WHERE s.class_code = ? AND p.post_id = ?
    ORDER BY p.created_at ASC
  `).all(classCode, hunt_post.team) : [];
  const hunt_status = students.map((student) => ({
    id: student.id,
    student_number: student.student_number,
    name: student.name,
    team: student.team,
    done: selectionByStudent.has(student.id),
  }));
  return { state, posts, students, team_status, comment_progress, hunt_post, hunt_comments, hunt_status };
}

router.use(requireTeacher);

router.post('/upload-roster', (req, res) => {
  const { rows = [], replace = true } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: '명단 데이터가 비어 있습니다' });
  const insert = db.prepare(`
    INSERT INTO students (class_code, student_number, name, team, session_token, is_active)
    VALUES (?, ?, ?, NULL, NULL, FALSE)
    ON CONFLICT(class_code, student_number) DO UPDATE SET
      name = excluded.name,
      session_token = NULL,
      is_active = FALSE
  `);
  const tx = db.transaction(() => {
    if (replace) {
      const ids = db.prepare('SELECT id FROM students WHERE class_code = ?').all(req.class_code).map((row) => row.id);
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        db.prepare(`DELETE FROM activity1_sns_likes WHERE student_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM activity1_sns_likes WHERE post_id IN (SELECT id FROM activity1_sns_posts WHERE student_id IN (${placeholders}))`).run(...ids);
        db.prepare(`DELETE FROM activity1_sns_posts WHERE student_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM activity1_answers WHERE student_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM phase1_responses WHERE student_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM phase2_classifications WHERE student_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM phase2_comments WHERE student_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM activity2_comment_revisions WHERE student_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM phase3_comments WHERE student_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM phase3_selections WHERE student_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM phase3_team_ready WHERE student_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM phase3_votes WHERE student_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM phase3_guesses WHERE student_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM phase3_reflections WHERE student_id IN (${placeholders})`).run(...ids);
      }
      db.prepare('DELETE FROM students WHERE class_code = ?').run(req.class_code);
    }
    rows.forEach((row) => {
      const studentNumber = String(row['번호'] || row.student_number || row.number || '').trim();
      const name = String(row['이름'] || row.name || '').trim();
      if (studentNumber && name) insert.run(req.class_code, studentNumber, name);
    });
  });
  tx();
  res.json({ ok: true, students: db.prepare('SELECT * FROM students WHERE class_code = ? ORDER BY CAST(student_number AS INTEGER), student_number').all(req.class_code).map(publicStudent) });
});

router.post('/update-student', (req, res) => {
  const studentId = Number(req.body.student_id);
  const studentNumber = String(req.body.student_number || '').trim();
  const name = String(req.body.name || '').trim();
  if (!studentId || !studentNumber || !name) return res.status(400).json({ error: '번호와 이름을 입력해주세요' });
  const duplicate = db.prepare('SELECT id FROM students WHERE class_code = ? AND student_number = ? AND id != ?').get(req.class_code, studentNumber, studentId);
  if (duplicate) return res.status(409).json({ error: '이미 같은 번호가 있습니다' });
  const team = req.body.team ? String(req.body.team) : null;
  if (team && !['A', 'B', 'C', 'D', 'E', 'F'].includes(team)) return res.status(400).json({ error: '모둠을 확인해주세요' });
  db.prepare('UPDATE students SET student_number = ?, name = ?, team = COALESCE(?, team) WHERE id = ? AND class_code = ?').run(studentNumber, name, team, studentId, req.class_code);
  const students = db.prepare('SELECT * FROM students WHERE class_code = ? ORDER BY CAST(student_number AS INTEGER), student_number').all(req.class_code).map(publicStudent);
  res.json({ ok: true, students });
});

router.post('/set-phase', (req, res) => {
  const phase = Number(req.body.phase);
  if (!Number.isInteger(phase) || phase < 0 || phase > 3) return res.status(400).json({ error: '활동 번호는 0~3 사이여야 합니다' });
  db.prepare('UPDATE teachers SET current_phase = ? WHERE class_code = ?').run(phase, req.class_code);
  getIo(req).emit('phase_changed', { phase });
  res.json({ ok: true, phase });
});

router.post('/toggle-phase', (req, res) => {
  const phase = Number(req.body.phase);
  const open = Boolean(req.body.open);
  if (![1, 2, 3].includes(phase)) return res.status(400).json({ error: '활동 번호는 1~3 중 하나여야 합니다' });
  db.prepare(`UPDATE teachers SET phase${phase}_open = ?, current_phase = ? WHERE class_code = ?`).run(open ? 1 : 0, open ? phase : 0, req.class_code);
  const teacher = db.prepare('SELECT current_phase, phase1_open, phase2_open, phase3_open, board_open, revealed FROM teachers WHERE class_code = ?').get(req.class_code);
  const state = {
    phase: teacher.current_phase,
    open_phases: {
      1: Boolean(teacher.phase1_open),
      2: Boolean(teacher.phase2_open),
      3: Boolean(teacher.phase3_open),
    },
    board_open: Boolean(teacher.board_open),
    revealed: Boolean(teacher.revealed),
  };
  getIo(req).emit('phase_status_changed', state);
  res.json({ ok: true, state });
});

router.get('/activity1/state', (req, res) => {
  res.json(activity1State(req.class_code));
});

router.post('/activity1/next', (req, res) => {
  const current = activity1State(req.class_code).step;
  const nextStep = Math.min(4, current + 1);
  db.prepare('UPDATE teachers SET activity1_step = ? WHERE class_code = ?').run(nextStep, req.class_code);
  const state = activity1State(req.class_code);
  getIo(req).emit('activity1_state_changed', state);
  res.json(state);
});

router.post('/activity1/previous', (req, res) => {
  const current = activity1State(req.class_code).step;
  const previousStep = Math.max(1, current - 1);
  db.prepare('UPDATE teachers SET activity1_step = ? WHERE class_code = ?').run(previousStep, req.class_code);
  const state = activity1State(req.class_code);
  getIo(req).emit('activity1_state_changed', state);
  res.json(state);
});

router.post('/activity1/reveal', (req, res) => {
  const question = String(req.body.question || '');
  const key = String(req.body.key || '');
  if (!['1', '2'].includes(question) || !key) return res.status(400).json({ error: '공개할 정답을 선택해주세요' });
  const state = activity1State(req.class_code);
  const revealed = { ...state.revealed, [question]: Array.from(new Set([...(state.revealed[question] || []), key])) };
  db.prepare('UPDATE teachers SET activity1_revealed = ? WHERE class_code = ?').run(JSON.stringify(revealed), req.class_code);
  const nextState = activity1State(req.class_code);
  getIo(req).emit('activity1_state_changed', nextState);
  res.json(nextState);
});

router.post('/activity1/reset', (req, res) => {
  db.prepare("UPDATE teachers SET activity1_step = 1, activity1_revealed = '{}' WHERE class_code = ?").run(req.class_code);
  const state = activity1State(req.class_code);
  getIo(req).emit('activity1_state_changed', state);
  res.json(state);
});

router.get('/activity1/answers', (req, res) => {
  const question = Number(req.query.question || 3);
  const answers = db.prepare(`
    SELECT a.*, s.student_number, s.name
    FROM activity1_answers a JOIN students s ON s.id = a.student_id
    WHERE s.class_code = ? AND a.question = ?
    ORDER BY a.submitted_at DESC
  `).all(req.class_code, question).map((row) => ({ ...row, payload: parseJson(row.payload, {}) }));
  res.json({ answers });
});

router.get('/activity1/sns-posts', (req, res) => {
  const posts = db.prepare(`
    SELECT p.id, p.photo_id, p.content, p.created_at, p.updated_at, s.student_number, s.name,
      COUNT(l.id) AS like_count
    FROM activity1_sns_posts p
    JOIN students s ON s.id = p.student_id
    LEFT JOIN activity1_sns_likes l ON l.post_id = p.id
    WHERE s.class_code = ?
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `).all(req.class_code);
  res.json({ posts });
});

router.get('/activity2/state', (req, res) => {
  const state = activity2State(req.class_code);
  res.json({ state, post: activity2PostByStep(state.step), posts: phase2 });
});

router.post('/activity2/next', (req, res) => {
  const current = activity2State(req.class_code).step;
  const nextStep = Math.min(phase2.length, current + 1);
  db.prepare('UPDATE teachers SET activity2_step = ? WHERE class_code = ?').run(nextStep, req.class_code);
  const state = activity2State(req.class_code);
  getIo(req).emit('activity2_state_changed', state);
  res.json({ state, post: activity2PostByStep(state.step), posts: phase2 });
});

router.post('/activity2/previous', (req, res) => {
  const current = activity2State(req.class_code).step;
  const previousStep = Math.max(1, current - 1);
  db.prepare('UPDATE teachers SET activity2_step = ? WHERE class_code = ?').run(previousStep, req.class_code);
  const state = activity2State(req.class_code);
  getIo(req).emit('activity2_state_changed', state);
  res.json({ state, post: activity2PostByStep(state.step), posts: phase2 });
});

router.post('/activity2/reveal', (req, res) => {
  const state = activity2State(req.class_code);
  const post = activity2PostByStep(state.step);
  const revealed = { ...state.revealed, [post.id]: true };
  db.prepare('UPDATE teachers SET activity2_revealed = ? WHERE class_code = ?').run(JSON.stringify(revealed), req.class_code);
  const nextState = activity2State(req.class_code);
  getIo(req).emit('activity2_state_changed', nextState);
  res.json({ state: nextState, post, posts: phase2 });
});

router.get('/activity2/revisions', (req, res) => {
  const requestedPostId = String(req.query.post_id || '');
  const state = activity2State(req.class_code);
  const post = requestedPostId ? phase2.find((item) => item.id === requestedPostId) : activity2PostByStep(state.step);
  if (!post) return res.status(404).json({ error: '게시물을 찾을 수 없습니다' });
  const revisions = db.prepare(`
    SELECT r.id, r.revised_text, r.submitted_at, s.student_number, s.name
    FROM activity2_comment_revisions r JOIN students s ON s.id = r.student_id
    WHERE s.class_code = ? AND r.post_id = ?
    ORDER BY r.submitted_at DESC
  `).all(req.class_code, post.id);
  res.json({ post, revisions });
});

router.post('/assign-teams', (req, res) => {
  const students = db.prepare('SELECT id, student_number FROM students WHERE class_code = ? ORDER BY CAST(student_number AS INTEGER), student_number').all(req.class_code);
  const update = db.prepare('UPDATE students SET team = ? WHERE id = ?');
  const tx = db.transaction(() => {
    students.forEach((student, index) => update.run(index % 2 === 0 ? 'A' : 'B', student.id));
  });
  tx();
  res.json({ ok: true, students: db.prepare('SELECT * FROM students WHERE class_code = ? ORDER BY CAST(student_number AS INTEGER), student_number').all(req.class_code).map(publicStudent) });
});

router.post('/activity3/team-count', (req, res) => {
  const count = Math.max(2, Math.min(6, Number(req.body.count) || 2));
  const teams = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, count);
  const students = db.prepare('SELECT id FROM students WHERE class_code = ? ORDER BY CAST(student_number AS INTEGER), student_number').all(req.class_code);
  const tx = db.transaction(() => {
    db.prepare('UPDATE teachers SET activity3_team_count = ? WHERE class_code = ?').run(count, req.class_code);
    students.forEach((student, index) => db.prepare('UPDATE students SET team = ? WHERE id = ?').run(teams[index % teams.length], student.id));
  });
  tx();
  getIo(req).emit('activity3_updated');
  res.json({ ok: true, ...phase3Payload(req.class_code) });
});

router.get('/activity3/state', (req, res) => {
  res.json(phase3Payload(req.class_code));
});

router.post('/activity3/intro', (req, res) => {
  const direction = String(req.body.direction || 'next');
  const current = phase3State(req.class_code).intro_step;
  const introStep = direction === 'previous' ? Math.max(0, current - 1) : Math.min(3, current + 1);
  db.prepare('UPDATE teachers SET activity3_stage = ?, activity3_intro_step = ? WHERE class_code = ?').run('intro', introStep, req.class_code);
  getIo(req).emit('activity3_updated');
  res.json(phase3Payload(req.class_code));
});

router.post('/activity3/stage', (req, res) => {
  const stage = String(req.body.stage || '');
  if (!['intro', 'manipulation', 'comment', 'hunt', 'results'].includes(stage)) return res.status(400).json({ error: '활동 단계를 확인해주세요' });
  db.prepare('UPDATE teachers SET activity3_stage = ? WHERE class_code = ?').run(stage, req.class_code);
  getIo(req).emit('activity3_updated');
  res.json(phase3Payload(req.class_code));
});

router.post('/activity3/hunt-move', (req, res) => {
  const direction = String(req.body.direction || 'next');
  const state = phase3State(req.class_code);
  const nextIndex = direction === 'previous' ? Math.max(0, state.hunt_index - 1) : Math.min(state.team_count - 1, state.hunt_index + 1);
  db.prepare('UPDATE teachers SET activity3_stage = ?, activity3_hunt_index = ? WHERE class_code = ?').run('hunt', nextIndex, req.class_code);
  getIo(req).emit('activity3_updated');
  res.json(phase3Payload(req.class_code));
});

router.post('/activity3/reveal', (req, res) => {
  db.prepare('UPDATE teachers SET activity3_revealed = TRUE, activity3_stage = ? WHERE class_code = ?').run('results', req.class_code);
  getIo(req).emit('activity3_updated');
  res.json(phase3Payload(req.class_code));
});

router.get('/students', (req, res) => {
  const students = db.prepare(`
    SELECT s.*,
      EXISTS(SELECT 1 FROM phase1_responses p WHERE p.student_id = s.id) AS phase1_done,
      EXISTS(SELECT 1 FROM activity2_comment_revisions p WHERE p.student_id = s.id) AS phase2_done,
      EXISTS(SELECT 1 FROM phase3_selections p WHERE p.student_id = s.id) AS phase3_done
    FROM students s
    WHERE s.class_code = ?
    ORDER BY CAST(s.student_number AS INTEGER), s.student_number
  `).all(req.class_code).map(publicStudent);
  res.json({ students });
});

router.post('/reset-session', (req, res) => {
  db.prepare('UPDATE students SET session_token = NULL, is_active = FALSE WHERE id = ? AND class_code = ?').run(req.body.student_id, req.class_code);
  res.json({ ok: true });
});

router.get('/phase1', (req, res) => {
  const responses = db.prepare(`
    SELECT p.*, s.student_number, s.name
    FROM phase1_responses p JOIN students s ON s.id = p.student_id
    WHERE s.class_code = ?
    ORDER BY p.submitted_at DESC
  `).all(req.class_code);
  res.json({ responses });
});

router.get('/phase2', (req, res) => {
  const comments = db.prepare(`
    SELECT p.*, s.student_number, s.name
    FROM phase2_comments p JOIN students s ON s.id = p.student_id
    WHERE s.class_code = ?
    ORDER BY p.created_at DESC
  `).all(req.class_code);
  const classifications = db.prepare(`
    SELECT p.*, s.student_number, s.name
    FROM phase2_classifications p JOIN students s ON s.id = p.student_id
    WHERE s.class_code = ?
  `).all(req.class_code);
  const revisions = db.prepare(`
    SELECT r.*, s.student_number, s.name
    FROM activity2_comment_revisions r JOIN students s ON s.id = r.student_id
    WHERE s.class_code = ?
    ORDER BY r.submitted_at DESC
  `).all(req.class_code);
  res.json({ comments, classifications, revisions });
});

router.get('/phase3', (req, res) => {
  const comments = db.prepare(`
    SELECT p.*, s.student_number, s.name
    FROM phase3_comments p JOIN students s ON s.id = p.student_id
    WHERE s.class_code = ?
    ORDER BY p.created_at DESC
  `).all(req.class_code);
  const votes = db.prepare('SELECT vote, COUNT(*) AS count FROM phase3_votes GROUP BY vote').all();
  const guesses = db.prepare(`
    SELECT p.*, s.student_number, s.name
    FROM phase3_guesses p JOIN students s ON s.id = p.student_id
    WHERE s.class_code = ?
    ORDER BY p.created_at DESC
  `).all(req.class_code);
  const reflections = db.prepare(`
    SELECT p.*, s.student_number, s.name
    FROM phase3_reflections p JOIN students s ON s.id = p.student_id
    WHERE s.class_code = ?
  `).all(req.class_code);
  const selections = db.prepare(`
    SELECT p.*, s.student_number, s.name
    FROM phase3_selections p JOIN students s ON s.id = p.student_id
    WHERE s.class_code = ?
  `).all(req.class_code).map((row) => ({ ...row, selected_comment_ids: parseSelection(row.selected_comment_ids) }));
  res.json({ comments, votes, guesses, reflections, selections });
});

router.post('/open-board', (req, res) => {
  db.prepare('UPDATE teachers SET board_open = TRUE WHERE class_code = ?').run(req.class_code);
  getIo(req).emit('board_opened');
  res.json({ ok: true });
});

router.post('/reveal', (req, res) => {
  db.prepare('UPDATE teachers SET revealed = TRUE WHERE class_code = ?').run(req.class_code);
  db.prepare('UPDATE phase3_comments SET is_revealed = TRUE WHERE student_id IN (SELECT id FROM students WHERE class_code = ?)').run(req.class_code);
  getIo(req).emit('board_revealed');
  res.json({ ok: true });
});

router.post('/mark-correct', (req, res) => {
  db.prepare('UPDATE phase3_guesses SET is_correct = ? WHERE id = ?').run(req.body.is_correct ? 1 : 0, req.body.guess_id);
  getIo(req).emit('guess_checked', { guess_id: req.body.guess_id, is_correct: req.body.is_correct });
  res.json({ ok: true });
});

module.exports = router;
