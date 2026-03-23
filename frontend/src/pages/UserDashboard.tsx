import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { QuizHistoryEntry } from '../types';
import { formatDate } from '../utils';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';

export default function UserDashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/user/history')
      .then((r) => setHistory(r.data))
      .catch(() => setError('Failed to load quiz history.'))
      .finally(() => setLoading(false));
  }, []);

  const totalAttempted = history.length;
  const avgScore = totalAttempted
    ? (history.reduce((acc, h) => acc + (h.score / (h.maxScore || 1)) * 100, 0) / totalAttempted).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
          <h1 className="text-2xl font-bold">Welcome back, {user?.username}! 👋</h1>
          <p className="text-indigo-200 mt-1">Ready for your next quiz?</p>
          <div className="flex gap-6 mt-4">
            <div className="bg-white/20 rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold">{totalAttempted}</div>
              <div className="text-xs text-indigo-100">Quizzes Taken</div>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold">{avgScore}%</div>
              <div className="text-xs text-indigo-100">Avg Score</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Link
            to="/quiz/select"
            className="bg-white border-2 border-indigo-200 hover:border-indigo-500 rounded-xl p-5 text-center transition-all group"
          >
            <div className="text-4xl mb-2">🚀</div>
            <h3 className="font-semibold text-gray-800 group-hover:text-indigo-700">Start Quiz</h3>
            <p className="text-gray-500 text-sm mt-1">Begin a new quiz session</p>
          </Link>
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-800">Progress</h3>
            <p className="text-gray-500 text-sm mt-1">{totalAttempted} quiz attempts</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="font-semibold text-gray-800">Best Score</h3>
            <p className="text-gray-500 text-sm mt-1">
              {history.length > 0
                ? `${Math.max(...history.map((h) => Math.round((h.score / (h.maxScore || 1)) * 100)))}%`
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Quiz History</h2>
          {loading ? (
            <Spinner />
          ) : error ? (
            <Alert message={error} type="error" />
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">📝</div>
              <p>No quizzes attempted yet. <Link to="/quiz/select" className="text-indigo-600 hover:underline">Start one now!</Link></p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 pr-4">Subject</th>
                    <th className="pb-2 pr-4">Topic</th>
                    <th className="pb-2 pr-4">Subtopic</th>
                    <th className="pb-2 pr-4 text-right">Score</th>
                    <th className="pb-2 pr-4 text-right">%</th>
                    <th className="pb-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((h, i) => {
                    const pct = Math.round((h.score / (h.maxScore || 1)) * 100);
                    return (
                      <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2.5 pr-4 font-medium text-gray-700">{h.subject}</td>
                        <td className="py-2.5 pr-4 text-gray-600">{h.topic}</td>
                        <td className="py-2.5 pr-4 text-gray-600">{h.subtopic}</td>
                        <td className="py-2.5 pr-4 text-right font-semibold">
                          {h.score}/{h.maxScore}
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pct >= 70 ? 'bg-green-100 text-green-700' : pct >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-gray-400">{formatDate(h.date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
