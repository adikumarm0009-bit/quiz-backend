// routes/scores.js
// POST /api/scores       -> save a quiz result (requires login)
// GET  /api/leaderboard  -> public, returns top scores (optionally filtered by subject/level)

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const VALID_SUBJECTS = ['history', 'science', 'gk', 'bollywood'];
const VALID_LEVELS = ['easy', 'medium', 'hard'];

// POST /api/scores  (protected - must be logged in)
router.post('/scores', requireAuth, (req, res) => {
  const { subject, level, score, total } = req.body;

  if (!VALID_SUBJECTS.includes(subject)) {
    return res.status(400).json({ error: 'Invalid subject' });
  }
  if (!VALID_LEVELS.includes(level)) {
    return res.status(400).json({ error: 'Invalid level' });
  }
  if (typeof score !== 'number' || typeof total !== 'number' || score < 0 || score > total) {
    return res.status(400).json({ error: 'Invalid score/total' });
  }

  try {
    db.prepare(
      'INSERT INTO scores (user_id, name, subject, level, score, total) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, req.user.name, subject, level, score, total);

    res.status(201).json({ message: 'Score saved' });
  } catch (err) {
    console.error('Save score error:', err);
    res.status(500).json({ error: 'Could not save score' });
  }
});

// GET /api/leaderboard?subject=history&level=easy&limit=10  (public)
router.get('/leaderboard', (req, res) => {
  const { subject, level } = req.query;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  let query = `
    SELECT name, subject, level, score, total, created_at
    FROM scores
  `;
  const conditions = [];
  const params = [];

  if (subject && VALID_SUBJECTS.includes(subject)) {
    conditions.push('subject = ?');
    params.push(subject);
  }
  if (level && VALID_LEVELS.includes(level)) {
    conditions.push('level = ?');
    params.push(level);
  }
  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Rank by accuracy (score/total) first, then raw score
  query += ' ORDER BY (CAST(score AS FLOAT) / total) DESC, score DESC LIMIT ?';
  params.push(limit);

  try {
    const rows = db.prepare(query).all(...params);
    res.json({ leaderboard: rows });
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    res.status(500).json({ error: 'Could not fetch leaderboard' });
  }
});

module.exports = router;
