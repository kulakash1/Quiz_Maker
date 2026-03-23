/**
 * Generate multiple-choice options for a question.
 *
 * @param {string} correctAnswer  - The correct answer for this question.
 * @param {string[]} allAnswers   - All answers from every question in the pool.
 * @param {number} totalOptions   - How many options to show (default 4).
 * @returns {{ text: string; isCorrect: boolean }[]}
 */
function generateOptions(correctAnswer, allAnswers, totalOptions = 4) {
  // Collect unique wrong answers (case-insensitive dedup vs correct)
  const pool = [
    ...new Set(
      allAnswers.filter(
        (a) => a.trim().toLowerCase() !== correctAnswer.trim().toLowerCase()
      )
    ),
  ];

  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const distractors = pool.slice(0, totalOptions - 1);

  const options = [
    { text: correctAnswer, isCorrect: true },
    ...distractors.map((d) => ({ text: d, isCorrect: false })),
  ];

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}

/**
 * Shuffle an array in place (Fisher-Yates).
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = { generateOptions, shuffle };
