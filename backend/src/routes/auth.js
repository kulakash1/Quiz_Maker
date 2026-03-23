const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

const USERS_FILE = path.join(__dirname, '../../users/users.json');

// Admin credentials (hardcoded)
const ADMIN_ID = 'akash';
const ADMIN_PASSWORD = '123';

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

// POST /api/auth/admin/login
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  if (username !== ADMIN_ID || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const token = generateToken({ id: 'admin', username: ADMIN_ID, role: 'admin' });
  return res.json({ token, user: { id: 'admin', username: ADMIN_ID, role: 'admin' } });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const users = readUsers();
  const exists = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (exists) return res.status(409).json({ error: 'Username already taken' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    username,
    email: email || '',
    password: hashedPassword,
    role: 'user',
    createdAt: new Date().toISOString(),
    quizHistory: [],
  };

  users.push(newUser);
  writeUsers(users);

  const token = generateToken({ id: newUser.id, username, role: 'user' });
  return res.status(201).json({
    token,
    user: { id: newUser.id, username, email: newUser.email, role: 'user' },
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const users = readUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken({ id: user.id, username: user.username, role: user.role });
  return res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  });
});

module.exports = router;
