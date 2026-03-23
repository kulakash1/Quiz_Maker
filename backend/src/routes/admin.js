const express = require('express');
const fs = require('fs');
const path = require('path');
const { adminMiddleware } = require('../middleware/auth');
const { readHierarchy, writeHierarchy, readQuestions, writeQuestions, slugify, DATA_DIR } = require('../utils/fileUtils');

const router = express.Router();

const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return {
      timerPerQuestion: 30,
      marksPerQuestion: 1,
      negativeMarks: 0.25,
      numberOfQuestions: 10,
      numberOfOptions: 4,
    };
  }
}

function writeConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

// ─── Hierarchy ────────────────────────────────────────────────────────────────

// GET /api/admin/hierarchy
router.get('/hierarchy', adminMiddleware, (_req, res) => {
  res.json(readHierarchy());
});

// POST /api/admin/subject
router.post('/subject', adminMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Subject name required' });

  const hierarchy = readHierarchy();
  const slug = slugify(name);

  if (hierarchy.find((s) => s.slug === slug)) {
    return res.status(409).json({ error: 'Subject already exists' });
  }

  hierarchy.push({ name: name.trim(), slug, topics: [] });
  writeHierarchy(hierarchy);
  res.status(201).json({ message: 'Subject created', slug });
});

// POST /api/admin/topic
router.post('/topic', adminMiddleware, (req, res) => {
  const { subjectSlug, name } = req.body;
  if (!subjectSlug || !name) return res.status(400).json({ error: 'subjectSlug and name required' });

  const hierarchy = readHierarchy();
  const subject = hierarchy.find((s) => s.slug === subjectSlug);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const slug = slugify(name);
  if (subject.topics.find((t) => t.slug === slug)) {
    return res.status(409).json({ error: 'Topic already exists' });
  }

  subject.topics.push({ name: name.trim(), slug, subtopics: [] });
  writeHierarchy(hierarchy);
  res.status(201).json({ message: 'Topic created', slug });
});

// POST /api/admin/subtopic
router.post('/subtopic', adminMiddleware, (req, res) => {
  const { subjectSlug, topicSlug, name } = req.body;
  if (!subjectSlug || !topicSlug || !name) {
    return res.status(400).json({ error: 'subjectSlug, topicSlug and name required' });
  }

  const hierarchy = readHierarchy();
  const subject = hierarchy.find((s) => s.slug === subjectSlug);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const topic = subject.topics.find((t) => t.slug === topicSlug);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });

  const slug = slugify(name);
  if (topic.subtopics.find((st) => st.slug === slug)) {
    return res.status(409).json({ error: 'Subtopic already exists' });
  }

  topic.subtopics.push({ name: name.trim(), slug });
  writeHierarchy(hierarchy);

  // Create the questions.json file immediately
  const { ensureQuestionsFile } = require('../utils/fileUtils');
  ensureQuestionsFile(subjectSlug, topicSlug, slug);

  res.status(201).json({ message: 'Subtopic created', slug });
});

// DELETE /api/admin/subject/:slug
router.delete('/subject/:slug', adminMiddleware, (req, res) => {
  const { slug } = req.params;
  let hierarchy = readHierarchy();
  const idx = hierarchy.findIndex((s) => s.slug === slug);
  if (idx === -1) return res.status(404).json({ error: 'Subject not found' });
  hierarchy.splice(idx, 1);
  writeHierarchy(hierarchy);
  res.json({ message: 'Subject deleted' });
});

// DELETE /api/admin/topic/:subjectSlug/:topicSlug
router.delete('/topic/:subjectSlug/:topicSlug', adminMiddleware, (req, res) => {
  const { subjectSlug, topicSlug } = req.params;
  const hierarchy = readHierarchy();
  const subject = hierarchy.find((s) => s.slug === subjectSlug);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  const idx = subject.topics.findIndex((t) => t.slug === topicSlug);
  if (idx === -1) return res.status(404).json({ error: 'Topic not found' });
  subject.topics.splice(idx, 1);
  writeHierarchy(hierarchy);
  res.json({ message: 'Topic deleted' });
});

// DELETE /api/admin/subtopic/:subjectSlug/:topicSlug/:subtopicSlug
router.delete('/subtopic/:subjectSlug/:topicSlug/:subtopicSlug', adminMiddleware, (req, res) => {
  const { subjectSlug, topicSlug, subtopicSlug } = req.params;
  const hierarchy = readHierarchy();
  const subject = hierarchy.find((s) => s.slug === subjectSlug);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  const topic = subject.topics.find((t) => t.slug === topicSlug);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  const idx = topic.subtopics.findIndex((st) => st.slug === subtopicSlug);
  if (idx === -1) return res.status(404).json({ error: 'Subtopic not found' });
  topic.subtopics.splice(idx, 1);
  writeHierarchy(hierarchy);
  res.json({ message: 'Subtopic deleted' });
});

// ─── Questions ────────────────────────────────────────────────────────────────

// GET /api/admin/questions/:subjectSlug/:topicSlug/:subtopicSlug
router.get('/questions/:subjectSlug/:topicSlug/:subtopicSlug', adminMiddleware, (req, res) => {
  const { subjectSlug, topicSlug, subtopicSlug } = req.params;
  const data = readQuestions(subjectSlug, topicSlug, subtopicSlug);
  res.json(data);
});

// POST /api/admin/questions/:subjectSlug/:topicSlug/:subtopicSlug
// Body: { questions: [{ question, answer }] }  — replaces existing
router.post('/questions/:subjectSlug/:topicSlug/:subtopicSlug', adminMiddleware, (req, res) => {
  const { subjectSlug, topicSlug, subtopicSlug } = req.params;
  const { questions } = req.body;

  if (!Array.isArray(questions)) {
    return res.status(400).json({ error: 'questions must be an array' });
  }

  const validated = questions.map((q, i) => {
    if (!q.question || !q.answer) {
      throw new Error(`Question at index ${i} is missing question or answer field`);
    }
    return { question: String(q.question).trim(), answer: String(q.answer).trim() };
  });

  writeQuestions(subjectSlug, topicSlug, subtopicSlug, { questions: validated });
  res.json({ message: 'Questions saved', count: validated.length });
});

// PUT /api/admin/questions/:subjectSlug/:topicSlug/:subtopicSlug/:index
router.put('/questions/:subjectSlug/:topicSlug/:subtopicSlug/:index', adminMiddleware, (req, res) => {
  const { subjectSlug, topicSlug, subtopicSlug, index } = req.params;
  const { question, answer } = req.body;
  const idx = parseInt(index, 10);

  const data = readQuestions(subjectSlug, topicSlug, subtopicSlug);
  if (idx < 0 || idx >= data.questions.length) {
    return res.status(404).json({ error: 'Question index out of range' });
  }

  if (question !== undefined) data.questions[idx].question = String(question).trim();
  if (answer !== undefined) data.questions[idx].answer = String(answer).trim();

  writeQuestions(subjectSlug, topicSlug, subtopicSlug, data);
  res.json({ message: 'Question updated', question: data.questions[idx] });
});

// DELETE /api/admin/questions/:subjectSlug/:topicSlug/:subtopicSlug/:index
router.delete('/questions/:subjectSlug/:topicSlug/:subtopicSlug/:index', adminMiddleware, (req, res) => {
  const { subjectSlug, topicSlug, subtopicSlug, index } = req.params;
  const idx = parseInt(index, 10);

  const data = readQuestions(subjectSlug, topicSlug, subtopicSlug);
  if (idx < 0 || idx >= data.questions.length) {
    return res.status(404).json({ error: 'Question index out of range' });
  }

  data.questions.splice(idx, 1);
  writeQuestions(subjectSlug, topicSlug, subtopicSlug, data);
  res.json({ message: 'Question deleted' });
});

// POST /api/admin/questions/:subjectSlug/:topicSlug/:subtopicSlug/add
router.post('/questions/:subjectSlug/:topicSlug/:subtopicSlug/add', adminMiddleware, (req, res) => {
  const { subjectSlug, topicSlug, subtopicSlug } = req.params;
  const { question, answer } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'question and answer required' });

  const data = readQuestions(subjectSlug, topicSlug, subtopicSlug);
  data.questions.push({ question: String(question).trim(), answer: String(answer).trim() });
  writeQuestions(subjectSlug, topicSlug, subtopicSlug, data);
  res.status(201).json({ message: 'Question added', index: data.questions.length - 1 });
});

// ─── Config ───────────────────────────────────────────────────────────────────

// GET /api/admin/config
router.get('/config', adminMiddleware, (_req, res) => {
  res.json(readConfig());
});

// PUT /api/admin/config
router.put('/config', adminMiddleware, (req, res) => {
  const current = readConfig();
  const allowed = ['timerPerQuestion', 'marksPerQuestion', 'negativeMarks', 'numberOfQuestions', 'numberOfOptions'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      current[key] = Number(req.body[key]);
    }
  });
  writeConfig(current);
  res.json({ message: 'Config updated', config: current });
});

module.exports = router;
