const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'rnp_driving_exam_secret_2024';

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { names, email, password, phone, national_id, date_of_birth } = req.body;
  if (!names || !email || !password) {
    return res.status(400).json({ message: 'Uzuza amakuru yose asabwa / Please fill all required fields' });
  }
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ message: 'Imeli isanzwe ikoreshwa / Email already registered' });

    const hashed = bcrypt.hashSync(password, 10);
    const regCode = 'REG' + Math.floor(100000 + Math.random() * 900000);
    const result = db.prepare(
      'INSERT INTO users (names, email, password, phone, national_id, date_of_birth, role, registration_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(names, email, hashed, phone || '', national_id || '', date_of_birth || '', 'user', regCode, 'active');

    const userId = result.lastInsertRowid;
    const token = jwt.sign({ id: userId, email, names, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: userId, names, email, phone: phone||'', national_id: national_id||'', date_of_birth: date_of_birth||'', role: 'user', registration_code: regCode } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ikosa rya server / Server error: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Andika imeli n\'ijambobanga' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(400).json({ message: 'Imeli cyangwa ijambobanga ntibihura / Invalid credentials' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Imeli cyangwa ijambobanga ntibihura / Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, names: user.names, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      token,
      user: { id: user.id, names: user.names, email: user.email, phone: user.phone, national_id: user.national_id, date_of_birth: user.date_of_birth, role: user.role || 'user', created_at: user.created_at }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, names, email, phone, national_id, registration_code, date_of_birth, role, status, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
