require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutesImport = require('./routes/auth');
const adminRoutesImport = require('./routes/admin');
const quizRoutesImport = require('./routes/quiz');
const userRoutesImport = require('./routes/user');

const authRoutes = authRoutesImport?.default || authRoutesImport;
const adminRoutes = adminRoutesImport?.default || adminRoutesImport;
const quizRoutes = quizRoutesImport?.default || quizRoutesImport;
const userRoutes = userRoutesImport?.default || userRoutesImport;

if (typeof authRoutes !== 'function' || typeof adminRoutes !== 'function' || typeof quizRoutes !== 'function' || typeof userRoutes !== 'function') {
  throw new Error('One or more route handlers are not functions. Check route exports and module format.');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure required directories exist
const dirs = [
  path.join(__dirname, '../data'),
  path.join(__dirname, '../users'),
];
dirs.forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Ensure users.json exists
const usersFile = path.join(__dirname, '../users/users.json');
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([], null, 2));

// Ensure config.json exists
const configFile = path.join(__dirname, '../data/config.json');
if (!fs.existsSync(configFile)) {
  fs.writeFileSync(
    configFile,
    JSON.stringify(
      {
        timerPerQuestion: 30,
        marksPerQuestion: 1,
        negativeMarks: 0.25,
        numberOfQuestions: 10,
        numberOfOptions: 4,
      },
      null,
      2
    )
  );
}

// Ensure hierarchy.json exists
const hierarchyFile = path.join(__dirname, '../data/hierarchy.json');
if (!fs.existsSync(hierarchyFile)) fs.writeFileSync(hierarchyFile, JSON.stringify([], null, 2));

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/user', userRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Quiz Maker API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
