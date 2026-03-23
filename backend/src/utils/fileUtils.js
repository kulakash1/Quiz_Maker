const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const HIERARCHY_FILE = path.join(DATA_DIR, 'hierarchy.json');

function readHierarchy() {
  try {
    return JSON.parse(fs.readFileSync(HIERARCHY_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeHierarchy(data) {
  fs.writeFileSync(HIERARCHY_FILE, JSON.stringify(data, null, 2));
}

function getQuestionsFilePath(subject, topic, subtopic) {
  return path.join(DATA_DIR, subject, topic, subtopic, 'questions.json');
}

function ensureQuestionsFile(subject, topic, subtopic) {
  const dir = path.join(DATA_DIR, subject, topic, subtopic);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const file = path.join(dir, 'questions.json');
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ questions: [] }, null, 2));
  }
  return file;
}

function readQuestions(subject, topic, subtopic) {
  const file = getQuestionsFilePath(subject, topic, subtopic);
  if (!fs.existsSync(file)) return { questions: [] };
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return { questions: [] };
  }
}

function writeQuestions(subject, topic, subtopic, data) {
  const file = ensureQuestionsFile(subject, topic, subtopic);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function slugify(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

module.exports = {
  readHierarchy,
  writeHierarchy,
  getQuestionsFilePath,
  ensureQuestionsFile,
  readQuestions,
  writeQuestions,
  slugify,
  DATA_DIR,
};
