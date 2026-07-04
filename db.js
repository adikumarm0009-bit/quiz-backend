// db.js
// Sets up a local SQLite database file (quiz.db) with two tables:
//   users  -> stores signup accounts (passwords are hashed, never stored in plain text)
//   scores -> stores every quiz result submitted, used to build the leaderboard

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'quiz.db'));

db.pragma('journal_mode = WAL'); // better performance for concurrent reads/writes

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    level TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_scores_leaderboard ON scores (subject, level, score);
`);

module.exports = db;
