import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Subject, QuizMode } from '../types';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import { clearQuizState } from '../utils';

export default function QuizSelectPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [quizMode, setQuizMode] = useState<QuizMode>('mcq');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    api.get('/quiz/hierarchy')
      .then((r) => {
        setSubjects(r.data);
        return api.get('/quiz/config');
      })
      .then((r) => {
        setNumQuestions(r.data.numberOfQuestions);
        setTimePerQuestion(r.data.timerPerQuestion);
      })
      .catch(() => setError('Failed to load quiz options.'))
      .finally(() => setLoading(false));
  }, []);

  const currentTopics = subjects.find((s) => s.slug === selectedSubject)?.topics || [];
  const currentSubtopics = currentTopics.find((t) => t.slug === selectedTopic)?.subtopics || [];

  const handleSubjectChange = (v: string) => {
    setSelectedSubject(v);
    setSelectedTopic('');
    setSelectedSubtopic('');
  };

  const handleTopicChange = (v: string) => {
    setSelectedTopic(v);
    setSelectedSubtopic('');
  };

  const handleStart = async () => {
    if (!selectedSubject || !selectedTopic || !selectedSubtopic) {
      setStartError('Please select Subject, Topic, and Subtopic.');
      return;
    }
    setStartError('');
    setStarting(true);
    clearQuizState(); // ensure no stale quiz persists from a previous session
    try {
      const res = await api.post('/quiz/start', {
        subjectSlug: selectedSubject,
        topicSlug: selectedTopic,
        subtopicSlug: selectedSubtopic,
        numberOfQuestions: numQuestions,
        timePerQuestion,
        quizMode,
      });
      navigate('/quiz/play', { state: res.data });
    } catch (err: any) {
      setStartError(err.response?.data?.error || 'Failed to start quiz. Try again.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🚀</div>
          <h1 className="text-2xl font-bold text-gray-800">Select Your Quiz</h1>
          <p className="text-gray-500 text-sm mt-1">Choose a subject, topic, and subtopic</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          {error && <Alert message={error} type="error" />}
          {startError && <Alert message={startError} type="error" />}

          {subjects.length === 0 ? (
            <Alert message="No subjects available yet. Please check back later." type="info" />
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  disabled={!selectedSubject}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">-- Select Topic --</option>
                  {currentTopics.map((t) => (
                    <option key={t.slug} value={t.slug}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtopic</label>
                <select
                  value={selectedSubtopic}
                  onChange={(e) => setSelectedSubtopic(e.target.value)}
                  disabled={!selectedTopic}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">-- Select Subtopic --</option>
                  {currentSubtopics.map((st) => (
                    <option key={st.slug} value={st.slug}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. of Questions</label>
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[5, 10, 15, 20, 25, 30].map((n) => (
                      <option key={n} value={n}>{n} Questions</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time / Question</label>
                  <select
                    value={timePerQuestion}
                    onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[15, 20, 30, 45, 60, 90].map((n) => (
                      <option key={n} value={n}>{n}s</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quiz Mode Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setQuizMode('mcq')}
                    className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium
                      ${quizMode === 'mcq'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-200 hover:bg-gray-50'
                      }`}
                  >
                    <span className="text-xl">🔘</span>
                    <span>MCQ</span>
                    <span className="text-xs font-normal text-gray-400">Multiple choice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizMode('qa')}
                    className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium
                      ${quizMode === 'qa'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-600 hover:border-purple-200 hover:bg-gray-50'
                      }`}
                  >
                    <span className="text-xl">✍️</span>
                    <span>Q &amp; A</span>
                    <span className="text-xs font-normal text-gray-400">Type your answer</span>
                  </button>
                </div>
                {quizMode === 'qa' && (
                  <p className="mt-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-1.5">
                    You will type your answers. Matching is case-insensitive.
                  </p>
                )}
              </div>

              <button
                onClick={handleStart}
                disabled={starting || !selectedSubtopic}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {starting ? 'Starting Quiz...' : '🚀 Start Quiz'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
