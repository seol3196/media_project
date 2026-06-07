const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'media.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_code TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  current_phase INTEGER DEFAULT 0,
  phase1_open BOOLEAN DEFAULT FALSE,
  phase2_open BOOLEAN DEFAULT FALSE,
  phase3_open BOOLEAN DEFAULT FALSE,
  activity1_step INTEGER DEFAULT 1,
  activity1_revealed TEXT DEFAULT '{}',
  activity2_step INTEGER DEFAULT 1,
  activity2_revealed TEXT DEFAULT '{}',
  activity3_stage TEXT DEFAULT 'intro',
  activity3_intro_step INTEGER DEFAULT 0,
  activity3_hunt_index INTEGER DEFAULT 0,
  activity3_revealed BOOLEAN DEFAULT FALSE,
  activity3_team_count INTEGER DEFAULT 2,
  board_open BOOLEAN DEFAULT FALSE,
  revealed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_code TEXT NOT NULL,
  student_number TEXT NOT NULL,
  name TEXT NOT NULL,
  team TEXT CHECK(team IN ('A','B')),
  session_token TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  UNIQUE(class_code, student_number)
);

CREATE TABLE IF NOT EXISTS phase1_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  delivery_methods TEXT,
  feature_matches TEXT,
  most_accurate TEXT NOT NULL,
  most_emotional TEXT NOT NULL,
  free_text TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS activity1_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  question INTEGER NOT NULL CHECK(question IN (1,2,3)),
  payload TEXT NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, question),
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS activity1_sns_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL UNIQUE,
  photo_id TEXT,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS activity1_sns_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, student_id),
  FOREIGN KEY(post_id) REFERENCES activity1_sns_posts(id),
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS activity2_comment_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  post_id TEXT NOT NULL,
  original_comment_id TEXT NOT NULL,
  revised_text TEXT NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, post_id),
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS phase2_classifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  comment_id TEXT NOT NULL,
  label TEXT CHECK(label IN ('good','bad')),
  reason TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, comment_id),
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS phase2_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS phase3_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  team TEXT NOT NULL,
  post_id TEXT,
  nickname TEXT,
  comment_type TEXT DEFAULT 'mission',
  content TEXT NOT NULL,
  is_revealed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS phase3_selections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  post_id TEXT NOT NULL,
  selected_comment_ids TEXT NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, post_id),
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS phase3_team_ready (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  team TEXT NOT NULL,
  ready_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id),
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS phase3_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  vote TEXT CHECK(vote IN ('trust','suspicious','unsure')),
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id),
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS phase3_guesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  guess_text TEXT NOT NULL,
  is_correct BOOLEAN,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS phase3_reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  answer1 TEXT,
  answer2 TEXT,
  answer3 TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES students(id)
);
`);

const studentsSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'students'").get()?.sql || '';
if (studentsSchema.includes("CHECK(team IN ('A','B'))")) {
  db.pragma('foreign_keys = OFF');
  db.exec(`
    CREATE TABLE students_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_code TEXT NOT NULL,
      student_number TEXT NOT NULL,
      name TEXT NOT NULL,
      team TEXT CHECK(team IN ('A','B','C','D','E','F')),
      session_token TEXT,
      is_active BOOLEAN DEFAULT FALSE,
      UNIQUE(class_code, student_number)
    );
    INSERT INTO students_new (id, class_code, student_number, name, team, session_token, is_active)
    SELECT id, class_code, student_number, name, team, session_token, is_active FROM students;
    DROP TABLE students;
    ALTER TABLE students_new RENAME TO students;
  `);
  db.pragma('foreign_keys = ON');
}

for (const column of ['phase1_open', 'phase2_open', 'phase3_open']) {
  try {
    db.prepare(`ALTER TABLE teachers ADD COLUMN ${column} BOOLEAN DEFAULT FALSE`).run();
  } catch (error) {
    if (!String(error.message).includes('duplicate column name')) throw error;
  }
}

const teacherColumnDefaults = {
  created_at: 'DATETIME',
  activity1_step: 'INTEGER DEFAULT 1',
  activity1_revealed: "TEXT DEFAULT '{}'",
  activity2_step: 'INTEGER DEFAULT 1',
  activity2_revealed: "TEXT DEFAULT '{}'",
  activity3_stage: "TEXT DEFAULT 'intro'",
  activity3_intro_step: 'INTEGER DEFAULT 0',
  activity3_hunt_index: 'INTEGER DEFAULT 0',
  activity3_revealed: 'BOOLEAN DEFAULT FALSE',
  activity3_team_count: 'INTEGER DEFAULT 2',
};

for (const [column, definition] of Object.entries(teacherColumnDefaults)) {
  try {
    db.prepare(`ALTER TABLE teachers ADD COLUMN ${column} ${definition}`).run();
  } catch (error) {
    if (!String(error.message).includes('duplicate column name')) throw error;
  }
}

db.prepare("UPDATE teachers SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)").run();

for (const column of ['delivery_methods', 'feature_matches']) {
  try {
    db.prepare(`ALTER TABLE phase1_responses ADD COLUMN ${column} TEXT`).run();
  } catch (error) {
    if (!String(error.message).includes('duplicate column name')) throw error;
  }
}

const phase3CommentColumnDefaults = {
  post_id: 'TEXT',
  nickname: 'TEXT',
  comment_type: "TEXT DEFAULT 'mission'",
};

for (const [column, definition] of Object.entries(phase3CommentColumnDefaults)) {
  try {
    db.prepare(`ALTER TABLE phase3_comments ADD COLUMN ${column} ${definition}`).run();
  } catch (error) {
    if (!String(error.message).includes('duplicate column name')) throw error;
  }
}

db.prepare('INSERT OR IGNORE INTO teachers (class_code, password) VALUES (?, ?)').run('6-2', '1234');

function publicStudent(row) {
  if (!row) return null;
  const { session_token, ...rest } = row;
  return { ...rest, is_active: Boolean(rest.is_active) };
}

module.exports = { db, publicStudent };
