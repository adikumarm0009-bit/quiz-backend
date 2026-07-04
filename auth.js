// routes/auth.js
// Handles account creation (signup) and login.
// Passwords are hashed with bcrypt before being stored - the plain password is never saved.

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../db');

const router = express.Router();

// Limit repeated login/signup attempts to slow down brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: 'Too many attempts, please try again later' }
});

const SALT_ROUNDS = 10;

function validateInput(name, password) {
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 30) {
    return 'Name must be between 2 and 30 characters';
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

// POST /api/auth/signup
router.post('/signup', authLimiter, async (req, res) => {
  const { name, password } = req.body;
  const validationError = validateInput(name, password);
  if (validationError) return res.status(400).json({ error: validationError });

  const cleanName = name.trim();

  try {
    const existing = db.prepare('SELECT id FROM users WHERE name = ?').get(cleanName);
    if (existing) {
      return res.status(409).json({ error: 'This name is already registered, try logging in' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const info = db
      .prepare('INSERT INTO users (name, password_hash) VALUES (?, ?)')
      .run(cleanName, passwordHash);

    const token = jwt.sign(
      { id: info.lastInsertRowid, name: cleanName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: info.lastInsertRowid, name: cleanName } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Something went wrong, please try again' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  const cleanName = name.trim();

  try {
    const user = db.prepare('SELECT * FROM users WHERE name = ?').get(cleanName);
    if (!user) {
      return res.status(401).json({ error: 'Account not found, please sign up first' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, name: user.name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong, please try again' });
  }
});

module.exports = router;
