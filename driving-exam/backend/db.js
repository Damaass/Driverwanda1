// Uses Node.js built-in sqlite module (available since Node 22.5+)
// No external dependencies needed!
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'exam.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    names TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT DEFAULT '',
    national_id TEXT DEFAULT '',
    date_of_birth TEXT DEFAULT '',
    role TEXT DEFAULT 'user' NOT NULL,
    registration_code TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_rw TEXT NOT NULL,
    question_en TEXT DEFAULT '',
    option_a_rw TEXT NOT NULL,
    option_b_rw TEXT NOT NULL,
    option_c_rw TEXT NOT NULL,
    option_d_rw TEXT NOT NULL,
    option_a_en TEXT DEFAULT '',
    option_b_en TEXT DEFAULT '',
    option_c_en TEXT DEFAULT '',
    option_d_en TEXT DEFAULT '',
    option_a_fr TEXT DEFAULT '',
    option_b_fr TEXT DEFAULT '',
    option_c_fr TEXT DEFAULT '',
    option_d_fr TEXT DEFAULT '',
    question_fr TEXT DEFAULT '',
    correct_answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    language TEXT DEFAULT 'rw',
    image_path TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS exam_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_time TEXT DEFAULT (datetime('now')),
    end_time TEXT DEFAULT '',
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 20,
    passed INTEGER DEFAULT 0,
    answers TEXT DEFAULT '{}',
    language TEXT DEFAULT 'rw',
    time_taken INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    FOREIGN KEY (admin_id) REFERENCES users(id)
  );
`);

const userColumns = db.prepare('PRAGMA table_info(users)').all();
if (!userColumns.some(c => c.name === 'role')) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' NOT NULL");
}
const usersCols = db.prepare('PRAGMA table_info(users)').all();
if (!usersCols.some(c => c.name === 'registration_code')) {
  db.exec("ALTER TABLE users ADD COLUMN registration_code TEXT DEFAULT ''");
}
if (!usersCols.some(c => c.name === 'status')) {
  db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
}

const qCols = db.prepare('PRAGMA table_info(questions)').all();
if (!qCols.some(c => c.name === 'language')) {
  db.exec("ALTER TABLE questions ADD COLUMN language TEXT DEFAULT 'rw'");
}
if (!qCols.some(c => c.name === 'image_path')) {
  db.exec("ALTER TABLE questions ADD COLUMN image_path TEXT DEFAULT ''");
}
if (!qCols.some(c => c.name === 'question_fr')) {
  db.exec("ALTER TABLE questions ADD COLUMN question_fr TEXT DEFAULT ''");
}
if (!qCols.some(c => c.name === 'option_a_fr')) {
  db.exec("ALTER TABLE questions ADD COLUMN option_a_fr TEXT DEFAULT ''");
}
if (!qCols.some(c => c.name === 'option_b_fr')) {
  db.exec("ALTER TABLE questions ADD COLUMN option_b_fr TEXT DEFAULT ''");
}
if (!qCols.some(c => c.name === 'option_c_fr')) {
  db.exec("ALTER TABLE questions ADD COLUMN option_c_fr TEXT DEFAULT ''");
}
if (!qCols.some(c => c.name === 'option_d_fr')) {
  db.exec("ALTER TABLE questions ADD COLUMN option_d_fr TEXT DEFAULT ''");
}

const examCols = db.prepare('PRAGMA table_info(exam_sessions)').all();
if (!examCols.some(c => c.name === 'language')) {
  db.exec("ALTER TABLE exam_sessions ADD COLUMN language TEXT DEFAULT 'rw'");
}
if (!examCols.some(c => c.name === 'time_taken')) {
  db.exec("ALTER TABLE exam_sessions ADD COLUMN time_taken INTEGER DEFAULT 0");
}

const settingsCount = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='settings'").get().count;
if (settingsCount === 0) {
  db.exec("CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT)");
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('pass_mark', '12');
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('exam_duration', '18');
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('questions_per_exam', '20');
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('enabled_languages', 'rw,en,fr');
}

module.exports = db;
