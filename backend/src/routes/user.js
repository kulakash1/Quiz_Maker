const express = require('express');
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const USERS_FILE = path.join(__dirname, '../../users/users.json');

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// GET /api/user/profile
router.get('/profile', authMiddleware, (req, res) => {
  const users = readUsers();
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _pw, ...safe } = user;
  res.json(safe);
});

// POST /api/user/history  — Save a quiz result to user history
router.post('/history', authMiddleware, (req, res) => {
  const { subject, topic, subtopic, score, total, maxScore, correct, wrong, date } = req.body;

  const users = readUsers();
  const userIdx = users.findIndex((u) => u.id === req.user.id);
  if (userIdx === -1) return res.status(404).json({ error: 'User not found' });

  const entry = {
    subject,
    topic,
    subtopic,
    score,
    total,
    maxScore,
    correct,
    wrong,
    date: date || new Date().toISOString().slice(0, 10),
  };

  if (!users[userIdx].quizHistory) users[userIdx].quizHistory = [];
  users[userIdx].quizHistory.push(entry);
  writeUsers(users);

  res.json({ message: 'History saved', entry });
});

// GET /api/user/history
router.get('/history', authMiddleware, (req, res) => {
  const users = readUsers();
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.quizHistory || []);
});

module.exports = router;
