// server.js
// Entry point for the Aditya Classes Quiz Master backend.
// Run with: npm start   (after npm install and setting up .env)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const scoresRoutes = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

// Allow the frontend (quiz_app.html) to call this API from the browser
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
app.use(cors({
  origin: allowedOrigins.includes('*') ? true : allowedOrigins
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Aditya Classes Quiz backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api', scoresRoutes);

// Catch-all error handler so the server never crashes on an unexpected error
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Quiz backend running on http://localhost:${PORT}`);
});
