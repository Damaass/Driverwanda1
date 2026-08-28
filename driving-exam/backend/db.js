const pg = require('pg');
const path = require('path');
const fs = require('fs');

// Determine which database to use
const isDev = !process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;

let pool;
let db;

// =========== PostgreSQL (Production) ===========
if (isProduction && process.env.DATABASE_URL) {
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Wrapper for PostgreSQL to match better-sqlite3 API
  db = {
    prepare: (sql) => ({
      run: (...params) => {
        const client = pool.connect();
        // Note: For Vercel, use pool.query directly
        return {
          exec: async () => {
            const result = await pool.query(sql, params);
            return result;
          }
        };
      },
      get: async (...params) => {
        const result = await pool.query(sql, params);
        return result.rows[0] || null;
      },
      all: async (...params) => {
        const result = await pool.query(sql, params);
        return result.rows || [];
      }
    }),
    exec: async (sql) => {
      await pool.query(sql);
    }
  };
} else {
  // =========== SQLite (Local Development) ===========
  const Database = require('better-sqlite3');
  const dbPath = path.join(__dirname, 'exam.db');
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
}

// Initialize tables
async function initializeTables() {
  try {
    if (isProduction && process.env.DATABASE_URL) {
      // PostgreSQL initialization
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          names TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          phone TEXT DEFAULT '',
          national_id TEXT DEFAULT '',
          date_of_birth TEXT DEFAULT '',
          role TEXT DEFAULT 'user' NOT NULL,
          registration_code TEXT DEFAULT '',
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
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
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          end_time TIMESTAMP,
          score INTEGER DEFAULT 0,
          total_questions INTEGER DEFAULT 20,
          passed INTEGER DEFAULT 0,
          answers TEXT DEFAULT '{}',
          language TEXT DEFAULT 'rw',
          time_taken INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER NOT NULL REFERENCES users(id),
          type TEXT NOT NULL,
          enabled INTEGER DEFAULT 1
        );
      `);
      
      console.log('✓ PostgreSQL tables initialized');
    } else {
      // SQLite initialization
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

      // Add missing columns if needed
      const userColumns = db.prepare('PRAGMA table_info(users)').all();
      if (!userColumns.some(c => c.name === 'role')) {
        db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' NOT NULL");
      }
      if (!userColumns.some(c => c.name === 'registration_code')) {
        db.exec("ALTER TABLE users ADD COLUMN registration_code TEXT DEFAULT ''");
      }
      if (!userColumns.some(c => c.name === 'status')) {
        db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
      }

      const qCols = db.prepare('PRAGMA table_info(questions)').all();
      if (!qCols.some(c => c.name === 'language')) {
        db.exec("ALTER TABLE questions ADD COLUMN language TEXT DEFAULT 'rw'");
      }
      if (!qCols.some(c => c.name === 'image_path')) {
        db.exec("ALTER TABLE questions ADD COLUMN image_path TEXT DEFAULT ''");
      }

      const examCols = db.prepare('PRAGMA table_info(exam_sessions)').all();
      if (!examCols.some(c => c.name === 'language')) {
        db.exec("ALTER TABLE exam_sessions ADD COLUMN language TEXT DEFAULT 'rw'");
      }
      if (!examCols.some(c => c.name === 'time_taken')) {
        db.exec("ALTER TABLE exam_sessions ADD COLUMN time_taken INTEGER DEFAULT 0");
      }

      // Initialize settings
      const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get().count;
      if (settingsCount === 0) {
        db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('pass_mark', '12');
        db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('exam_duration', '18');
        db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('questions_per_exam', '20');
        db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('enabled_languages', 'rw,en,fr');
      }

      console.log('✓ SQLite tables initialized');
    }
  } catch (err) {
    console.error('✗ Error initializing tables:', err.message);
    throw new Error('Table initialization failed: ' + err.message);
  }
}

// Initialize on startup
if (!isProduction || process.env.DATABASE_URL) {
  initializeTables().catch(err => {
    console.error('CRITICAL: Database setup failed:', err.message);
    process.exit(1);
  });
}

module.exports = { db, pool, isProduction, isDev };
