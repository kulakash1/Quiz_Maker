import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { QuizResult, QuizQuestion, QuizAnswer, QuizMode } from '../types';
import api from '../api';

interface LocationState {
  result: QuizResult;
  questions: QuizQuestion[];
  answers?: QuizAnswer[];
  quizMode?: QuizMode;
}

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  useEffect(() => {
    if (!state) { navigate('/dashboard', { replace: true }); return; }

    // Save history
    const { result } = state;
    const hierarchy: any = {};
    try {
      const h = JSON.parse(localStorage.getItem('quiz_hierarchy_cache') || '[]');
      const subj = h.find((s: any) => s.slug === result.subject);
      const topic = subj?.topics?.find((t: any) => t.slug === result.topic);
      const subtopic = topic?.subtopics?.find((st: any) => st.slug === result.subtopic);
      hierarchy.subject = subj?.name || result.subject;
      hierarchy.topic = topic?.name || result.topic;
      hierarchy.subtopic = subtopic?.name || result.subtopic;
    } catch {}

    api.post('/user/history', {
      subject: hierarchy.subject || result.subject,
      topic: hierarchy.topic || result.topic,
      subtopic: hierarchy.subtopic || result.subtopic,
      score: result.score,
      total: result.total,
      maxScore: result.maxScore,
      correct: result.correct,
      wrong: result.wrong,
      date: new Date().toISOString().slice(0, 10),
    }).catch(() => {});
  }, []); // eslint-disable-line

  if (!state) return null;
  const { result, questions, answers = [], quizMode = 'mcq' } = state;
  const pct = Math.round((result.score / (result.maxScore || 1)) * 100);

  const grade = pct >= 80 ? { label: 'Excellent!', emoji: '🏆', color: 'text-yellow-600' }
    : pct >= 60 ? { label: 'Good Job!', emoji: '🎉', color: 'text-green-600' }
    : pct >= 40 ? { label: 'Keep Practicing!', emoji: '📚', color: 'text-blue-600' }
    : { label: 'Needs Improvement', emoji: '💪', color: 'text-red-600' };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-6">
          <div className="text-6xl mb-3">{grade.emoji}</div>
          <h1 className={`text-2xl font-bold mb-1 ${grade.color}`}>{grade.label}</h1>
          <div className="text-5xl font-extrabold text-gray-800 mt-3">{result.score}</div>
          <p className="text-gray-500 text-sm">out of {result.maxScore} marks</p>

          <div className="flex justify-center mt-4">
            <div className="w-36 h-36 relative">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke={pct >= 60 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3" strokeDasharray={`${pct}, 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-800">{pct}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-green-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-green-700">{result.correct}</div>
              <div className="text-xs text-green-600">Correct</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-red-600">{result.wrong}</div>
              <div className="text-xs text-red-500">Wrong</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-gray-600">{result.unattempted}</div>
              <div className="text-xs text-gray-500">Skipped</div>
            </div>
          </div>
        </div>

        {/* Detailed Review */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Question Review</h2>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const res = result.result.find((r) => r.questionId === q.id);
              const userAnswer = answers.find((a) => a.questionId === q.id)?.selectedOption;
              return (
                <div key={q.id} className={`border rounded-xl p-4 ${
                  res?.correct ? 'border-green-200 bg-green-50'
                  : res?.skipped ? 'border-gray-200 bg-gray-50'
                  : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 text-sm font-bold flex-shrink-0 ${
                      res?.correct ? 'text-green-600' : res?.skipped ? 'text-gray-400' : 'text-red-500'
                    }`}>
                      {res?.correct ? '✓' : res?.skipped ? '–' : '✗'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{i + 1}. {q.question}</p>
                      {quizMode === 'qa' && userAnswer && !res?.skipped && (
                        <p className="text-xs mt-1">
                          <span className="text-gray-500">Your answer: </span>
                          <span className={res?.correct ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold line-through'}>
                            {userAnswer as string}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Correct Answer: <span className="font-semibold text-green-700">{res?.correctAnswer}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Link to="/quiz/select" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
            Try Another Quiz
          </Link>
          <Link to="/dashboard" className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-xl font-medium transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
