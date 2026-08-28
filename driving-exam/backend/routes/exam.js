const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/exam/questions - 20 random questions
router.get('/questions', authMiddleware, (req, res) => {
  try {
    const questions = db.prepare('SELECT * FROM questions ORDER BY RANDOM() LIMIT 20').all();
    if (questions.length < 20) {
      return res.status(400).json({ message: `Ibibazo ntibihagije: ${questions.length}/20 / Not enough questions: ${questions.length}/20` });
    }
    const sanitized = questions.map(q => ({
      id: q.id,
      question_rw: q.question_rw,
      question_en: q.question_en || q.question_rw,
      option_a_rw: q.option_a_rw, option_b_rw: q.option_b_rw,
      option_c_rw: q.option_c_rw, option_d_rw: q.option_d_rw,
      option_a_en: q.option_a_en || q.option_a_rw,
      option_b_en: q.option_b_en || q.option_b_rw,
      option_c_en: q.option_c_en || q.option_c_rw,
      option_d_en: q.option_d_en || q.option_d_rw,
      category: q.category,
      correct_answer: q.correct_answer
    }));
    res.json(sanitized);
  } catch (err) {
    console.error('Questions error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// GET /api/exam/training - all questions for study (no timer)
router.get('/training', authMiddleware, (req, res) => {
  try {
    const questions = db.prepare('SELECT * FROM questions ORDER BY id').all();
    if (questions.length === 0) {
      return res.status(400).json({ message: `Ibibazo ntibihagije muri database / No questions in database` });
    }
    const sanitized = questions.map(q => ({
      id: q.id,
      question_rw: q.question_rw,
      question_en: q.question_en || q.question_rw,
      option_a_rw: q.option_a_rw, option_b_rw: q.option_b_rw,
      option_c_rw: q.option_c_rw, option_d_rw: q.option_d_rw,
      option_a_en: q.option_a_en || q.option_a_rw,
      option_b_en: q.option_b_en || q.option_b_rw,
      option_c_en: q.option_c_en || q.option_c_rw,
      option_d_en: q.option_d_en || q.option_d_rw,
      category: q.category,
      correct_answer: q.correct_answer
    }));
    res.json(sanitized);
  } catch (err) {
    console.error('Training error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// POST /api/exam/submit
router.post('/submit', authMiddleware, (req, res) => {
  const { answers, startTime, questionIds } = req.body;
  if (!answers || !questionIds || !Array.isArray(questionIds)) {
    return res.status(400).json({ message: 'Missing answers or questionIds' });
  }
  try {
    const placeholders = questionIds.map(() => '?').join(',');
    const questions = db.prepare(`SELECT * FROM questions WHERE id IN (${placeholders})`).all(...questionIds);

    let score = 0;
    const results = questions.map(q => {
      const selected = answers[q.id] || answers[String(q.id)];
      const isCorrect = selected === q.correct_answer;
      if (isCorrect) score++;
      return {
        id: q.id,
        question_rw: q.question_rw, question_en: q.question_en || q.question_rw,
        option_a_rw: q.option_a_rw, option_b_rw: q.option_b_rw,
        option_c_rw: q.option_c_rw, option_d_rw: q.option_d_rw,
        option_a_en: q.option_a_en || q.option_a_rw,
        option_b_en: q.option_b_en || q.option_b_rw,
        option_c_en: q.option_c_en || q.option_c_rw,
        option_d_en: q.option_d_en || q.option_d_rw,
        correct_answer: q.correct_answer,
        selected_answer: selected || null,
        is_correct: isCorrect
      };
    });

    const passed = score >= 12;
    const endTime = new Date().toISOString();
    db.prepare(
      'INSERT INTO exam_sessions (user_id, start_time, end_time, score, total_questions, passed, answers) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, startTime || endTime, endTime, score, 20, passed ? 1 : 0, JSON.stringify(answers));

    res.json({ score, total: 20, passed, results });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// GET /api/exam/history
router.get('/history', authMiddleware, (req, res) => {
  try {
    const sessions = db.prepare(
      'SELECT id, start_time, end_time, score, total_questions, passed FROM exam_sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT 10'
    ).all(req.user.id);
    res.json(sessions);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
