const express = require('express');
const crypto = require('crypto');
const { db } = require('../db/init');

const router = express.Router();

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/, '');
  if (!token.startsWith('admin:')) return res.status(401).json({ error: '관리자 권한이 필요합니다' });
  next();
}

function createClassCode() {
  return `class-${crypto.randomBytes(3).toString('hex')}`;
}

router.use(requireAdmin);

router.get('/classes', (req, res) => {
  const classes = db.prepare(`
    SELECT t.class_code, t.created_at,
      COUNT(s.id) AS student_count
    FROM teachers t
    LEFT JOIN students s ON s.class_code = t.class_code
    GROUP BY t.id
    ORDER BY t.id DESC
  `).all();
  res.json({ classes });
});

router.post('/classes', (req, res) => {
  const requestedCode = String(req.body.class_code || '').trim();
  let classCode = requestedCode || createClassCode();
  while (db.prepare('SELECT 1 FROM teachers WHERE class_code = ?').get(classCode)) {
    if (requestedCode) return res.status(409).json({ error: '이미 사용 중인 반 코드입니다' });
    classCode = createClassCode();
  }
  db.prepare('INSERT INTO teachers (class_code, password) VALUES (?, ?)').run(classCode, '');
  const created = db.prepare('SELECT class_code, created_at FROM teachers WHERE class_code = ?').get(classCode);
  res.json({ class: { ...created, student_count: 0 } });
});

module.exports = router;
