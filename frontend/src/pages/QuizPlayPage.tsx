import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QuizSession, QuizAnswer, QuizMode } from '../types';
import { formatTime, saveQuizState, loadQuizState, clearQuizState } from '../utils';
import api from '../api';
import Alert from '../components/common/Alert';

interface SavedState {
  sessionToken: string;
  questions: QuizSession['questions'];
  config: QuizSession['config'];
  answers: QuizAnswer[];
  currentIdx: number;
  timeLeft: number;
  quizMode: QuizMode;
}

export default function QuizPlayPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const incomingState = location.state as QuizSession | null;

  const [initialized, setInitialized] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [questions, setQuestions] = useState(incomingState?.questions || []);
  const [quizConfig, setQuizConfig] = useState(
    incomingState?.config || { timer: 30, marksPerQuestion: 1, negativeMarks: 0.25, numOptions: 4 }
  );
  const [quizMode, setQuizMode] = useState<QuizMode>(incomingState?.quizMode || 'mcq');
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(incomingState?.config.timer || 30);
  // Q&A mode: typed text in current input field
  const [typedAnswer, setTypedAnswer] = useState('');
  // Q&A: shows green flash when correct answer typed
  const [qaCorrectFlash, setQaCorrectFlash] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Correct answers for Q&A real-time validation (never persisted to localStorage)
  const qaCorrectAnswersRef = useRef<string[]>([]);

  // Initialize
  useEffect(() => {
    if (incomingState?.sessionToken) {
      // Fresh quiz start — always use incoming state (never restore stale localStorage)
      setSessionToken(incomingState.sessionToken);
      setQuestions(incomingState.questions);
      setQuizConfig(incomingState.config);
      setQuizMode(incomingState.quizMode || 'mcq');
      setAnswers(incomingState.questions.map((q) => ({ questionId: q.id, selectedOption: null, flagged: false })));
      setTimeLeft(incomingState.config.timer);
      if (incomingState.correctAnswers) {
        qaCorrectAnswersRef.current = incomingState.correctAnswers;
      }
      setInitialized(true);
    } else {
      // No incoming state — try restoring from localStorage (page refresh mid-quiz)
      const saved = loadQuizState<SavedState>();
      if (saved && saved.sessionToken) {
        setSessionToken(saved.sessionToken);
        setQuestions(saved.questions);
        setQuizConfig(saved.config);
        setAnswers(saved.answers);
        setCurrentIdx(saved.currentIdx);
        setTimeLeft(saved.timeLeft);
        setQuizMode(saved.quizMode || 'mcq');
        setInitialized(true);
      } else {
        navigate('/quiz/select', { replace: true });
      }
    }
  }, []); // eslint-disable-line

  // Persist on every meaningful change
  useEffect(() => {
    if (initialized && sessionToken) {
      saveQuizState({ sessionToken, questions, config: quizConfig, answers, currentIdx, timeLeft, quizMode });
    }
  }, [answers, currentIdx, timeLeft, initialized]); // eslint-disable-line

  // Reset Q&A input when question changes
  useEffect(() => {
    if (!initialized || questions.length === 0) return;
    setQaCorrectFlash(false);
    setTypedAnswer('');
    if (quizMode === 'qa') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [currentIdx, initialized]); // eslint-disable-line

  // Q&A: auto-advance when typedAnswer matches the correct answer
  useEffect(() => {
    if (!initialized || quizMode !== 'qa' || !typedAnswer.trim()) return;
    const correctAns = qaCorrectAnswersRef.current[currentIdx];
    if (!correctAns) return;
    if (typedAnswer.trim().toLowerCase() !== correctAns.trim().toLowerCase()) return;

    setQaCorrectFlash(true);
    const t = setTimeout(() => {
      setQaCorrectFlash(false);
      setTypedAnswer('');
      setCurrentIdx((prev) => (prev + 1 < questions.length ? prev + 1 : prev));
    }, 700);
    return () => clearTimeout(t);
  }, [typedAnswer]); // eslint-disable-line — currentIdx & questions captured fresh each render

  const handleSubmit = useCallback(
    async (finalAnswers = answers) => {
      if (submitting) return;
      setSubmitting(true);
      clearQuizState();
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        const res = await api.post('/quiz/submit', { sessionToken, answers: finalAnswers });
        navigate('/quiz/result', {
          state: { result: res.data, questions, answers: finalAnswers, quizMode },
        });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to submit quiz.');
        setSubmitting(false);
      }
    },
    [answers, sessionToken, questions, navigate, submitting, quizMode] // eslint-disable-line
  );

  // Timer per question
  useEffect(() => {
    if (!initialized) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(quizConfig.timer);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto advance or submit
          setCurrentIdx((idx) => {
            if (idx + 1 < questions.length) {
              return idx + 1;
            } else {
              // Submit
              setAnswers((ans) => {
                handleSubmit(ans);
                return ans;
              });
              return idx;
            }
          });
          return quizConfig.timer;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIdx, initialized]); // eslint-disable-line

  if (!initialized || questions.length === 0) return null;

  const q = questions[currentIdx];
  const currentAnswer = answers.find((a) => a.questionId === q.id);
  const timerPct = (timeLeft / quizConfig.timer) * 100;
  const answeredCount = answers.filter((a) => a.selectedOption !== null).length;
  const flaggedCount = answers.filter((a) => a.flagged).length;
  const isFlagged = currentAnswer?.flagged ?? false;

  // MCQ: click option
  const selectOption = (text: string) => {
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === q.id ? { ...a, selectedOption: text } : a))
    );
  };

  // Q&A: just update the typed text — auto-advance is handled by the useEffect above
  const handleTypeAnswer = (text: string) => {
    setTypedAnswer(text);
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionId === q.id ? { ...a, selectedOption: text.trim() === '' ? null : text } : a
      )
    );
  };

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < questions.length) setCurrentIdx(idx);
  };

  // Toggle marked-for-review on current question
  const toggleFlag = () => {
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === q.id ? { ...a, flagged: !a.flagged } : a))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 font-medium">
              Q <span className="text-indigo-700 font-bold">{currentIdx + 1}</span>/{questions.length}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              quizMode === 'mcq' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {quizMode === 'mcq' ? '🔘 MCQ' : '✍️ Q&A'}
            </span>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2">
            <div className="w-28 bg-gray-200 rounded-full h-2 hidden sm:block">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 20 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
            <span className={`font-mono text-sm font-bold w-10 text-right ${
              timeLeft <= 10 ? 'text-red-600' : 'text-gray-700'
            }`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
        {/* Main */}
        <div className="flex-1">
          {error && <Alert message={error} type="error" />}

          <div className={`bg-white rounded-2xl shadow-sm border p-6 mb-4 transition-all ${
            isFlagged ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100'
          }`}>
            {/* Question header row: number + flag button */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">
                Question {currentIdx + 1}
              </p>
              <button
                onClick={toggleFlag}
                title={isFlagged ? 'Remove review mark' : 'Mark for review'}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  isFlagged
                    ? 'bg-amber-50 border-amber-400 text-amber-700 font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600'
                }`}
              >
                {isFlagged ? '🚩 Marked for Review' : '🏳️ Mark for Review'}
              </button>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-6 leading-relaxed">
              {q.question}
            </h2>

            {/* ── MCQ options ──────────────────────────────────────────────── */}
            {quizMode === 'mcq' && (
              <div className="space-y-3">
                {q.options.map((opt, i) => {
                  const isSelected = currentAnswer?.selectedOption === opt.text;
                  return (
                    <button
                      key={i}
                      onClick={() => selectOption(opt.text)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium
                        ${isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0
                          ${isSelected
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : 'border-gray-300 text-gray-500'
                          }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Q&A text input ────────────────────────────────────────────── */}
            {quizMode === 'qa' && (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={typedAnswer}
                    onChange={(e) => handleTypeAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    autoComplete="off"
                    className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all pr-10
                      ${qaCorrectFlash
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : typedAnswer.trim()
                        ? 'border-purple-400 bg-purple-50 text-gray-800 focus:ring-2 focus:ring-purple-400'
                        : 'border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-300'
                      }`}
                  />
                  {qaCorrectFlash && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 font-bold animate-bounce">
                      ✓
                    </span>
                  )}
                </div>
                {qaCorrectFlash ? (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2 font-medium">
                    ✅ Correct! Moving to next question...
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">
                    ℹ️ Type your answer — you'll advance automatically when correct. Use <strong>Next →</strong> to skip.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => goTo(currentIdx - 1)}
              disabled={currentIdx === 0}
              className="px-5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              ← Previous
            </button>
            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => goTo(currentIdx + 1)}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Finish Quiz ✓'}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar: Question Palette */}
        <div className="w-52 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-20">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Question Palette</h3>
            <p className="text-xs text-gray-400 mb-3">
              {answeredCount}/{questions.length} answered
              {flaggedCount > 0 && <span className="ml-2 text-amber-600">· {flaggedCount} flagged</span>}
            </p>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {questions.map((_, i) => {
                const ans = answers.find((a) => a.questionId === questions[i].id);
                const isAnswered = ans?.selectedOption !== null && ans?.selectedOption !== undefined;
                const isCurr = i === currentIdx;
                const isFlag = ans?.flagged;
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all
                      ${isCurr
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                        : isFlag
                        ? 'bg-amber-100 text-amber-700 border border-amber-400'
                        : isAnswered
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                      }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1 text-xs text-gray-500 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-indigo-600 inline-block" /> Current
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" /> Answered
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-400 inline-block" /> For Review
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block" /> Not visited
              </div>
            </div>
            <button
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
