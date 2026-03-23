const express = require('express');
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');
const { readHierarchy, readQuestions, DATA_DIR } = require('../utils/fileUtils');
const { generateOptions, shuffle } = require('../utils/quizUtils');

const router = express.Router();

const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return { timerPerQuestion: 30, marksPerQuestion: 1, negativeMarks: 0.25, numberOfQuestions: 10, numberOfOptions: 4 };
  }
}

// GET /api/quiz/hierarchy  — public (needed for quiz selection dropdowns)
router.get('/hierarchy', (_req, res) => {
  res.json(readHierarchy());
});

// GET /api/quiz/config  — public
router.get('/config', (_req, res) => {
  res.json(readConfig());
});

// POST /api/quiz/start
// Body: { subjectSlug, topicSlug, subtopicSlug, numberOfQuestions?, timePerQuestion?, quizMode? }
router.post('/start', authMiddleware, (req, res) => {
  const { subjectSlug, topicSlug, subtopicSlug, numberOfQuestions, timePerQuestion, quizMode } = req.body;

  if (!subjectSlug || !topicSlug || !subtopicSlug) {
    return res.status(400).json({ error: 'subjectSlug, topicSlug and subtopicSlug required' });
  }

  const mode = quizMode === 'qa' ? 'qa' : 'mcq';

  const config = readConfig();
  const numQ = parseInt(numberOfQuestions, 10) || config.numberOfQuestions;
  const timer = parseInt(timePerQuestion, 10) || config.timerPerQuestion;
  const numOptions = config.numberOfOptions;

  const data = readQuestions(subjectSlug, topicSlug, subtopicSlug);

  if (!data.questions || data.questions.length === 0) {
    return res.status(404).json({ error: 'No questions found for this subtopic' });
  }

  // Shuffle and pick questions
  const shuffledQuestions = shuffle(data.questions).slice(0, numQ);
  const allAnswers = data.questions.map((q) => q.answer);

  // Build quiz questions — MCQ gets auto-generated options, Q&A gets none
  const quizQuestions = shuffledQuestions.map((q, idx) => ({
    id: idx,
    question: q.question,
    options: mode === 'mcq' ? generateOptions(q.answer, allAnswers, numOptions) : [],
    // correctAnswer is NOT sent to client — validation done server-side
  }));

  // Store correct answers in a session token (we encode into JWT payload)
  const correctAnswers = shuffledQuestions.map((q) => q.answer);

  const { generateToken } = require('../middleware/auth');
  const sessionToken = generateToken({
    type: 'quiz_session',
    subjectSlug,
    topicSlug,
    subtopicSlug,
    correctAnswers,
    marksPerQuestion: config.marksPerQuestion,
    negativeMarks: config.negativeMarks,
    timer,
    quizMode: mode,
  });

  res.json({
    sessionToken,
    questions: quizQuestions,
    quizMode: mode,
    // Send correct answers to client only for Q&A mode (needed for real-time keystroke validation)
    correctAnswers: mode === 'qa' ? correctAnswers : undefined,
    config: { timer, marksPerQuestion: config.marksPerQuestion, negativeMarks: config.negativeMarks, numOptions },
  });
});

// POST /api/quiz/submit
// Body: { sessionToken, answers: [{ questionId, selectedOption }] }
router.post('/submit', authMiddleware, (req, res) => {
  const { sessionToken, answers } = req.body;
  if (!sessionToken || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'sessionToken and answers required' });
  }

  const { verifyToken } = require('../middleware/auth');
  let session;
  try {
    session = verifyToken(sessionToken);
  } catch {
    return res.status(400).json({ error: 'Invalid or expired quiz session' });
  }

  if (session.type !== 'quiz_session') {
    return res.status(400).json({ error: 'Invalid session token type' });
  }

  const { correctAnswers, marksPerQuestion, negativeMarks } = session;

  let correct = 0;
  let wrong = 0;
  let unattempted = 0;

  const result = answers.map((a) => {
    const correctAns = correctAnswers[a.questionId];
    if (a.selectedOption === null || a.selectedOption === undefined) {
      unattempted++;
      return { questionId: a.questionId, correct: false, skipped: true, correctAnswer: correctAns };
    }
    const isCorrect =
      String(a.selectedOption).trim().toLowerCase() === String(correctAns).trim().toLowerCase();
    if (isCorrect) correct++;
    else wrong++;
    return { questionId: a.questionId, correct: isCorrect, skipped: false, correctAnswer: correctAns };
  });

  const score = correct * marksPerQuestion - wrong * negativeMarks;

  res.json({
    score: Math.max(0, parseFloat(score.toFixed(2))),
    correct,
    wrong,
    unattempted,
    total: correctAnswers.length,
    maxScore: correctAnswers.length * marksPerQuestion,
    result,
    subject: session.subjectSlug,
    topic: session.topicSlug,
    subtopic: session.subtopicSlug,
  });
});

module.exports = router;
