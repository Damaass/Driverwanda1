const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const adminMiddleware = require('../middleware/admin');
const { randomInt } = require('crypto');
const path = require('path');

const router = express.Router();
router.use(adminMiddleware);

const getCount = (sql, params = []) => db.prepare(sql).get(...params)?.count || 0;
const getSetting = (key, def) => db.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value || def;

function generateRegistrationCode() {
  return 'REG' + randomInt(100000, 999999).toString();
}

const validAnswer = v => ['a', 'b', 'c', 'd'].includes(String(v || '').toLowerCase());

function questionPayload(body) {
  body = body || {};
  const correct_answer = String(body.correct_answer || '').toLowerCase();
  return {
    question_rw: body.question_rw || '',
    question_en: body.question_en || '',
    option_a_rw: body.option_a_rw || '',
    option_b_rw: body.option_b_rw || '',
    option_c_rw: body.option_c_rw || '',
    option_d_rw: body.option_d_rw || '',
    option_a_en: body.option_a_en || '',
    option_b_en: body.option_b_en || '',
    option_c_en: body.option_c_en || '',
    option_d_en: body.option_d_en || '',
    option_a_fr: body.option_a_fr || '',
    option_b_fr: body.option_b_fr || '',
    option_c_fr: body.option_c_fr || '',
    option_d_fr: body.option_d_fr || '',
    question_fr: body.question_fr || '',
    correct_answer,
    category: body.category || 'general',
    language: body.language || 'rw',
    image_path: body.image_path || ''
  };
}

function validateQuestion(body, partial = false) {
  const q = questionPayload(body);
  if (!partial && !q.question_rw) return { ok: false, message: 'Kinyarwanda question is required' };
  if (!q.option_a_rw || !q.option_b_rw || !q.option_c_rw || !q.option_d_rw) return { ok: false, message: 'All four options are required' };
  if (!validAnswer(q.correct_answer)) return { ok: false, message: 'Correct answer must be a, b, c, or d' };
  return { ok: true, q };
}

function ensureOneAdminRemaining(excludingUserId = null) {
  const sql = excludingUserId ? 'SELECT COUNT(*) as count FROM users WHERE role = ? AND id != ?' : 'SELECT COUNT(*) as count FROM users WHERE role = ?';
  return getCount(sql, excludingUserId ? ['admin', excludingUserId] : ['admin']) > 0;
}

router.get('/overview', (req, res) => {
  try {
    const questions = getCount('SELECT COUNT(*) as count FROM questions');
    const users = getCount('SELECT COUNT(*) as count FROM users');
    const userCount = getCount("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    const adminCount = getCount("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const exams = getCount('SELECT COUNT(*) as count FROM exam_sessions');
    const passed = getCount('SELECT COUNT(*) as count FROM exam_sessions WHERE passed = 1');
    const failed = exams - passed;
    const passRate = exams ? Math.round((passed / exams) * 100) : 0;
    const avgScore = db.prepare('SELECT ROUND(AVG(score), 2) as value FROM exam_sessions').get().value || 0;
    const topScore = db.prepare('SELECT MAX(score) as value FROM exam_sessions').get().value || 0;
    const activeUsers = getCount('SELECT COUNT(DISTINCT user_id) as count FROM exam_sessions');
    const recentExams = db.prepare(`
      SELECT es.id, es.score, es.total_questions, es.passed, es.start_time, es.end_time,
             u.id as user_id, u.names, u.email
      FROM exam_sessions es
      JOIN users u ON u.id = es.user_id
      ORDER BY es.start_time DESC
      LIMIT 10
    `).all();

    res.json({
      questions, users, userCount, adminCount, exams, passed, failed, passRate,
      avgScore, topScore, activeUsers, recentExams
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.names, u.email, u.phone, u.national_id, u.registration_code, u.date_of_birth, u.role, u.status, u.created_at,
             COUNT(es.id) as exams_taken,
             COALESCE(SUM(CASE WHEN es.passed = 1 THEN 1 ELSE 0 END), 0) as passed_exams,
             COALESCE(SUM(CASE WHEN es.passed = 0 THEN 1 ELSE 0 END), 0) as failed_exams,
             COALESCE(ROUND(AVG(es.score), 2), 0) as avg_score,
             COALESCE(MAX(es.score), 0) as best_score,
             MAX(es.start_time) as last_exam_date
      FROM users u
      LEFT JOIN exam_sessions es ON es.user_id = u.id
      GROUP BY u.id
      ORDER BY u.role ASC, u.created_at DESC
    `).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/users/:id', (req, res) => {
  try {
    const user = db.prepare(`
      SELECT u.id, u.names, u.email, u.phone, u.national_id, u.date_of_birth, u.role, u.created_at,
             COUNT(es.id) as exams_taken,
             COALESCE(SUM(CASE WHEN es.passed = 1 THEN 1 ELSE 0 END), 0) as passed_exams,
             COALESCE(SUM(CASE WHEN es.passed = 0 THEN 1 ELSE 0 END), 0) as failed_exams,
             COALESCE(ROUND(AVG(es.score), 2), 0) as avg_score,
             COALESCE(MAX(es.score), 0) as best_score
      FROM users u
      LEFT JOIN exam_sessions es ON es.user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id
    `).get(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/users/:id/exams', (req, res) => {
  try {
    const exists = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
    if (!exists) return res.status(404).json({ message: 'User not found' });

    const exams = db.prepare(`
      SELECT es.*,
             (SELECT COUNT(*) FROM exam_sessions WHERE user_id = es.user_id) as user_total_exams
      FROM exam_sessions es
      WHERE es.user_id = ?
      ORDER BY es.start_time DESC
      LIMIT 100
    `).all(req.params.id);
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.put('/users/:id', (req, res) => {
  try {
    const current = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ message: 'User not found' });

    const { names, email, phone, national_id, date_of_birth, role } = req.body;
    const nextRole = role === 'admin' ? 'admin' : 'user';
    if (current.id === req.user.id && nextRole !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }
    if (current.role !== nextRole && nextRole === 'admin' && !ensureOneAdminRemaining(current.id)) {
      return res.status(400).json({ message: 'At least one admin account must remain' });
    }

    db.prepare(`
      UPDATE users
      SET names = COALESCE(?, names), email = COALESCE(?, email), phone = COALESCE(?, phone),
          national_id = COALESCE(?, national_id), date_of_birth = COALESCE(?, date_of_birth), role = ?
      WHERE id = ?
    `).run(
      names || null, email || null, phone || null,
      national_id || null, date_of_birth || null, nextRole, req.params.id
    );
    res.json({ message: 'User updated' });
  } catch (err) {
    if (err.message.toLowerCase().includes('unique')) return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/users/:id/reset-password', (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const hashed = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.params.id);
    res.json({ message: 'Password reset' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.delete('/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ message: 'You cannot delete your own account' });
    if (user.role === 'admin' && !ensureOneAdminRemaining(user.id)) {
      return res.status(400).json({ message: 'At least one admin account must remain' });
    }
    db.prepare('DELETE FROM exam_sessions WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/questions', (req, res) => {
  try {
    const questions = db.prepare('SELECT * FROM questions ORDER BY id DESC').all();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/questions', (req, res) => {
  const validation = validateQuestion(req.body);
  if (!validation.ok) return res.status(400).json({ message: validation.message });

  try {
    const result = db.prepare(`
      INSERT INTO questions (question_rw, question_en, option_a_rw, option_b_rw, option_c_rw, option_d_rw,
        option_a_en, option_b_en, option_c_en, option_d_en, option_a_fr, option_b_fr, option_c_fr, option_d_fr,
        question_fr, correct_answer, category, language, image_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      validation.q.question_rw, validation.q.question_en,
      validation.q.option_a_rw, validation.q.option_b_rw, validation.q.option_c_rw, validation.q.option_d_rw,
      validation.q.option_a_en, validation.q.option_b_en, validation.q.option_c_en, validation.q.option_d_en,
      validation.q.option_a_fr, validation.q.option_b_fr, validation.q.option_c_fr, validation.q.option_d_fr,
      validation.q.question_fr, validation.q.correct_answer, validation.q.category, validation.q.language, validation.q.image_path
    );
    res.json({ id: result.lastInsertRowid, message: 'Question added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.put('/questions/:id', (req, res) => {
  const validation = validateQuestion(req.body, true);
  if (!validation.ok) return res.status(400).json({ message: validation.message });

  try {
    const existing = db.prepare('SELECT id FROM questions WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Question not found' });

    db.prepare(`
      UPDATE questions
      SET question_rw = COALESCE(?, question_rw), question_en = COALESCE(?, question_en),
          option_a_rw = COALESCE(?, option_a_rw), option_b_rw = COALESCE(?, option_b_rw),
          option_c_rw = COALESCE(?, option_c_rw), option_d_rw = COALESCE(?, option_d_rw),
          option_a_en = COALESCE(?, option_a_en), option_b_en = COALESCE(?, option_b_en),
          option_c_en = COALESCE(?, option_c_en), option_d_en = COALESCE(?, option_d_en),
          option_a_fr = COALESCE(?, option_a_fr), option_b_fr = COALESCE(?, option_b_fr),
          option_c_fr = COALESCE(?, option_c_fr), option_d_fr = COALESCE(?, option_d_fr),
          question_fr = COALESCE(?, question_fr), correct_answer = ?, category = COALESCE(?, category),
          language = COALESCE(?, language), image_path = COALESCE(?, image_path)
      WHERE id = ?
    `).run(
      validation.q.question_rw || null, validation.q.question_en || null,
      validation.q.option_a_rw || null, validation.q.option_b_rw || null,
      validation.q.option_c_rw || null, validation.q.option_d_rw || null,
      validation.q.option_a_en || null, validation.q.option_b_en || null,
      validation.q.option_c_en || null, validation.q.option_d_en || null,
      validation.q.option_a_fr || null, validation.q.option_b_fr || null,
      validation.q.option_c_fr || null, validation.q.option_d_fr || null,
      validation.q.question_fr || null, validation.q.correct_answer, validation.q.category || null,
      validation.q.language || null, validation.q.image_path || null, req.params.id
    );
    res.json({ message: 'Question updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.delete('/questions/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/exams', (req, res) => {
  try {
    const exams = db.prepare(`
      SELECT es.*, u.id as user_id, u.names, u.email
      FROM exam_sessions es
      JOIN users u ON u.id = es.user_id
      ORDER BY es.start_time DESC
      LIMIT 200
    `).all();
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.delete('/exams/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM exam_sessions WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/system', (req, res) => {
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
    const counts = {};
    for (const table of tables) {
      counts[table.name] = getCount(`SELECT COUNT(*) as count FROM "${table.name}"`);
    }
    res.json({
      nodeVersion: process.version,
      platform: process.platform,
      uptimeSeconds: Math.round(process.uptime()),
      databasePath: db.prepare('PRAGMA database_list').get().file,
      tables,
      counts
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/system/clear-exams', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM exam_sessions').run();
    res.json({ deleted: result.changes, message: 'Exam history cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/system/clear-users', (req, res) => {
  try {
    const adminCountBefore = getCount("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    if (adminCountBefore < 1) return res.status(400).json({ message: 'Cannot clear users: no admin remains' });
    db.prepare('DELETE FROM exam_sessions').run();
    const result = db.prepare("DELETE FROM users WHERE role != 'admin'").run();
    res.json({ deleted: result.changes, message: 'Client users cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/users', (req, res) => {
  try {
    const { names, email, phone, national_id, date_of_birth, password } = req.body;
    if (!names || !email || !password) {
      return res.status(400).json({ message: 'Names, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    
    const hashed = bcrypt.hashSync(password, 10);
    const regCode = generateRegistrationCode();
    const result = db.prepare(`
      INSERT INTO users (names, email, password, phone, national_id, date_of_birth, registration_code, status, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'user')
    `).run(names, email, hashed, phone || '', national_id || '', date_of_birth || '', regCode);
    
    res.json({ id: result.lastInsertRowid, registration_code: regCode, message: 'User created' });
  } catch (err) {
    if (err.message.toLowerCase().includes('unique')) return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.put('/users/:id/status', (req, res) => {
  try {
    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot change admin status' });
    
    const { status } = req.body;
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();
    const result = {};
    settings.forEach(s => result[s.key] = s.value);
    res.json({
      pass_mark: parseInt(result.pass_mark || '12'),
      exam_duration: parseInt(result.exam_duration || '18'),
      questions_per_exam: parseInt(result.questions_per_exam || '20'),
      enabled_languages: (result.enabled_languages || 'rw,en,fr').split(',')
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.put('/settings', (req, res) => {
  try {
    const { pass_mark, exam_duration, questions_per_exam, enabled_languages } = req.body;
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    if (pass_mark !== undefined) upsert.run('pass_mark', String(pass_mark));
    if (exam_duration !== undefined) upsert.run('exam_duration', String(exam_duration));
    if (questions_per_exam !== undefined) upsert.run('questions_per_exam', String(questions_per_exam));
    if (enabled_languages !== undefined) upsert.run('enabled_languages', enabled_languages.join(','));
    res.json({ message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/questions/bulk', (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions)) return res.status(400).json({ message: 'Questions array required' });
    
    const validQuestions = [];
    for (const q of questions) {
      const validation = validateQuestion(q);
      if (!validation.ok) continue;
      validQuestions.push(validation.q);
    }
    
    const insert = db.prepare(`
      INSERT INTO questions (question_rw, question_en, option_a_rw, option_b_rw, option_c_rw, option_d_rw,
        option_a_en, option_b_en, option_c_en, option_d_en, option_a_fr, option_b_fr, option_c_fr, option_d_fr,
        question_fr, correct_answer, category, language, image_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const q of validQuestions) {
      insert.run(
        q.question_rw, q.question_en, q.option_a_rw, q.option_b_rw, q.option_c_rw, q.option_d_rw,
        q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en, q.option_a_fr, q.option_b_fr, q.option_c_fr, q.option_d_fr,
        q.question_fr, q.correct_answer, q.category, q.language, q.image_path
      );
    }
    
    res.json({ inserted: validQuestions.length, message: 'Questions imported' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/statistics', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const examsToday = getCount("SELECT COUNT(*) as count FROM exam_sessions WHERE date(start_time) = ?", [today]);
    const examsWeek = getCount("SELECT COUNT(*) as count FROM exam_sessions WHERE date(start_time) >= ?", [weekAgo]);
    const examsMonth = getCount("SELECT COUNT(*) as count FROM exam_sessions WHERE date(start_time) >= ?", [monthAgo]);
    const newUsersToday = getCount("SELECT COUNT(*) as count FROM users WHERE date(created_at) = ?", [today]);
    const newUsersWeek = getCount("SELECT COUNT(*) as count FROM users WHERE date(created_at) >= ?", [weekAgo]);
    const newUsersMonth = getCount("SELECT COUNT(*) as count FROM users WHERE date(created_at) >= ?", [monthAgo]);
    
    const passRateToday = todayPassRate(today);
    const avgScore = db.prepare('SELECT ROUND(AVG(score), 2) as value FROM exam_sessions').get().value || 0;
    
    const examsByLanguage = db.prepare(`
      SELECT language, COUNT(*) as count, 
             SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed,
             ROUND(AVG(score), 2) as avg_score
      FROM exam_sessions GROUP BY language
    `).all();
    
    const examsByDay = db.prepare(`
      SELECT date(start_time) as day, COUNT(*) as count 
      FROM exam_sessions 
      WHERE start_time >= ? 
      GROUP BY date(start_time) 
      ORDER BY day
    `).all(monthAgo);
    
    const failedQuestions = db.prepare(`
      SELECT q.id, q.question_rw, q.question_en, q.question_fr, 
             COUNT(a.id) as total_attempts,
             SUM(CASE WHEN a.correct = 0 THEN 1 ELSE 0 END) as failed_count
      FROM questions q
      LEFT JOIN (
        SELECT json_each.value as question_id, exam_sessions.id
        FROM exam_sessions, json_each(exam_sessions.answers)
      ) a ON a.question_id = q.id
      GROUP BY q.id
      HAVING failed_count > 0
      ORDER BY (CAST(failed_count AS REAL) / total_attempts) DESC
      LIMIT 10
    `).all();
    
    const failedPct = failedQuestions.map(q => ({
      ...q,
      fail_rate: Math.round((q.failed_count / q.total_attempts) * 100)
    }));
    
    res.json({
      examsToday, examsWeek, examsMonth,
      newUsersToday, newUsersWeek, newUsersMonth,
      passRateToday, avgScore, examsByLanguage, examsByDay, failedQuestions: failedPct
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

function todayPassRate(date) {
  const result = db.prepare(`
    SELECT ROUND(AVG(CASE WHEN passed = 1 THEN 100.0 ELSE 0 END), 0) as rate
    FROM exam_sessions WHERE date(start_time) = ?
  `).get(date);
  return result?.rate || 0;
}

router.get('/notifications', (req, res) => {
  try {
    const notifs = db.prepare(`
      SELECT n.*, u.email as admin_email 
      FROM notifications n 
      JOIN users u ON u.id = n.admin_id
    `).all();
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/notifications', (req, res) => {
  try {
    const { type, enabled } = req.body;
    const existing = db.prepare('SELECT id FROM notifications WHERE admin_id = ? AND type = ?')
      .get(req.user.id, type);
    if (existing) {
      db.prepare('UPDATE notifications SET enabled = ? WHERE id = ?')
        .run(enabled ? 1 : 0, existing.id);
    } else {
      db.prepare('INSERT INTO notifications (admin_id, type, enabled) VALUES (?, ?, ?)')
        .run(req.user.id, type, enabled ? 1 : 0);
    }
    res.json({ message: 'Notification preference saved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/reports', (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    let sql = `
      SELECT es.*, u.names, u.email 
      FROM exam_sessions es 
      JOIN users u ON u.id = es.user_id
    `;
    const params = [];
    if (start_date) {
      sql += ' WHERE date(es.start_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += params.length ? ' AND' : ' WHERE';
      sql += ' date(es.start_time) <= ?';
      params.push(end_date);
    }
    sql += ' ORDER BY es.start_time DESC';
    
    const exams = db.prepare(sql).all(...params);
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/active-exams', (req, res) => {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM exam_sessions WHERE end_time IS NULL OR end_time = ""').get().count;
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/questions/pdf-extract', (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ message: 'No PDF file uploaded' });
  }
  const file = req.files.file;
  const pdfPath = file.tempFilePath || file.path || file.name;
  const { spawn } = require('child_process');
  const scriptPath = path.join(__dirname, '..', 'scripts', 'extract_questions.py');
  
  const python = spawn('python', [scriptPath, pdfPath]);
  let output = '';
  let errors = '';
  
  python.stdout.on('data', data => output += data.toString());
  python.stderr.on('data', data => errors += data.toString());
  
  python.on('close', code => {
    if (code !== 0) {
      return res.status(500).json({ message: 'PDF extraction failed: ' + (errors || 'Unknown error') });
    }
    try {
      const questions = JSON.parse(output);
      res.json(questions);
    } catch (parseErr) {
      res.status(500).json({ message: 'Failed to parse extraction result' });
    }
  });
});

module.exports = router;
