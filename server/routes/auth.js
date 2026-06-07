const express = require('express');
const crypto = require('crypto');
const { db, publicStudent } = require('../db/init');

const router = express.Router();

function token() {
  return crypto.randomBytes(24).toString('hex');
}

router.post('/teacher-login', (req, res) => {
  const { class_code } = req.body;
  const teacher = db.prepare('SELECT * FROM teachers WHERE class_code = ?').get(class_code);
  if (!teacher) {
    return res.status(401).json({ error: '반 코드를 확인해주세요' });
  }
  const sessionToken = `teacher:${teacher.class_code}:${token()}`;
  res.json({ token: sessionToken, user: { role: 'teacher', class_code: teacher.class_code } });
});

router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username !== 'admin' || password !== 'se2519925!') {
    return res.status(401).json({ error: '관리자 정보를 확인해주세요' });
  }
  res.json({ token: `admin:${token()}`, user: { role: 'admin', username: 'admin' } });
});

router.post('/student-login', (req, res) => {
  const { class_code, student_number, name } = req.body;
  const sameNumber = db.prepare('SELECT * FROM students WHERE class_code = ? AND student_number = ?').get(class_code, student_number);
  if (!sameNumber) {
    const anyInClass = db.prepare('SELECT 1 FROM students WHERE class_code = ? LIMIT 1').get(class_code);
    return res.status(404).json({ error: anyInClass ? '명단에 없는 정보입니다. 선생님께 문의하세요' : '명단에 없는 정보입니다. 선생님께 문의하세요' });
  }
  if (sameNumber.name !== name) {
    return res.status(400).json({ error: '이름 또는 번호를 다시 확인해주세요' });
  }
  const sessionToken = token();
  db.prepare('UPDATE students SET session_token = ?, is_active = TRUE WHERE id = ?').run(sessionToken, sameNumber.id);
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(sameNumber.id);
  res.json({ token: sessionToken, user: { role: 'student', student: publicStudent(student) } });
});

router.get('/me', (req, res) => {
  const auth = req.headers.authorization || '';
  const sessionToken = auth.replace(/^Bearer\s+/, '');
  if (sessionToken.startsWith('teacher:')) {
    const class_code = sessionToken.split(':')[1];
    return res.json({ role: 'teacher', class_code });
  }
  if (sessionToken.startsWith('admin:')) {
    return res.json({ role: 'admin', username: 'admin' });
  }
  const student = db.prepare('SELECT * FROM students WHERE session_token = ?').get(sessionToken);
  if (!student) return res.status(401).json({ error: '다시 로그인해주세요' });
  res.json({ role: 'student', student: publicStudent(student) });
});

router.get('/phase', (req, res) => {
  const classCode = req.query.class_code || '6-2';
  const teacher = db.prepare('SELECT current_phase, phase1_open, phase2_open, phase3_open, board_open, revealed FROM teachers WHERE class_code = ?').get(classCode);
  res.json({
    phase: teacher?.current_phase ?? 0,
    open_phases: {
      1: Boolean(teacher?.phase1_open),
      2: Boolean(teacher?.phase2_open),
      3: Boolean(teacher?.phase3_open),
    },
    board_open: Boolean(teacher?.board_open),
    revealed: Boolean(teacher?.revealed),
  });
});

module.exports = router;
