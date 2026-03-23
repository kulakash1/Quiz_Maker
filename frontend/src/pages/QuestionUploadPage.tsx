import React, { useEffect, useState } from 'react';
import api from '../api';
import { Subject, RawQuestion } from '../types';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import QuestionPreview from '../components/admin/QuestionPreview';

export default function QuestionUploadPage() {
  const [hierarchy, setHierarchy] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<RawQuestion[] | null>(null);
  const [parseError, setParseError] = useState('');
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [existingQuestions, setExistingQuestions] = useState<RawQuestion[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [mode, setMode] = useState<'upload' | 'preview'>('upload');

  useEffect(() => {
    api.get('/admin/hierarchy').then((r) => setHierarchy(r.data)).catch(() => {});
  }, []);

  const currentTopics = hierarchy.find((s) => s.slug === selectedSubject)?.topics || [];
  const currentSubtopics = currentTopics.find((t) => t.slug === selectedTopic)?.subtopics || [];

  const handleSubjectChange = (v: string) => {
    setSelectedSubject(v);
    setSelectedTopic('');
    setSelectedSubtopic('');
    setExistingQuestions([]);
    setParsedQuestions(null);
  };

  const handleTopicChange = (v: string) => {
    setSelectedTopic(v);
    setSelectedSubtopic('');
    setExistingQuestions([]);
    setParsedQuestions(null);
  };

  const handleSubtopicChange = async (v: string) => {
    setSelectedSubtopic(v);
    setParsedQuestions(null);
    if (!v) return;
    setLoadingExisting(true);
    try {
      const r = await api.get(`/admin/questions/${selectedSubject}/${selectedTopic}/${v}`);
      setExistingQuestions(r.data.questions || []);
    } catch {
      setExistingQuestions([]);
    } finally {
      setLoadingExisting(false);
    }
  };

  const parseJSON = () => {
    setParseError('');
    try {
      const data = JSON.parse(jsonInput);
      if (!data.questions || !Array.isArray(data.questions)) {
        setParseError('JSON must have a "questions" array');
        return;
      }
      const validated: RawQuestion[] = data.questions.map((q: any, i: number) => {
        if (!q.question || !q.answer) throw new Error(`Question at index ${i} is missing "question" or "answer"`);
        return { question: String(q.question).trim(), answer: String(q.answer).trim() };
      });
      setParsedQuestions(validated);
      setMode('preview');
    } catch (err: any) {
      setParseError(err.message || 'Invalid JSON');
    }
  };

  const handleSave = async (questions: RawQuestion[]) => {
    if (!selectedSubject || !selectedTopic || !selectedSubtopic) {
      setFeedback({ msg: 'Please select a subtopic first', type: 'error' });
      return;
    }
    try {
      await api.post(`/admin/questions/${selectedSubject}/${selectedTopic}/${selectedSubtopic}`, { questions });
      setExistingQuestions(questions);
      setParsedQuestions(null);
      setJsonInput('');
      setMode('upload');
      setFeedback({ msg: `${questions.length} questions saved successfully!`, type: 'success' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ msg: err.response?.data?.error || 'Failed to save', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Upload Questions 📤</h1>
        <p className="text-gray-500 text-sm mb-6">Upload questions in JSON format and preview before saving</p>

        {feedback && <Alert message={feedback.msg} type={feedback.type} />}

        {/* Target Selection */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h3 className="font-semibold text-gray-700 mb-3">Target Location</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <select value={selectedSubject} onChange={(e) => handleSubjectChange(e.target.value)}
              className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select Subject</option>
              {hierarchy.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
            <select value={selectedTopic} onChange={(e) => handleTopicChange(e.target.value)}
              disabled={!selectedSubject}
              className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
              <option value="">Select Topic</option>
              {currentTopics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
            <select value={selectedSubtopic} onChange={(e) => handleSubtopicChange(e.target.value)}
              disabled={!selectedTopic}
              className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
              <option value="">Select Subtopic</option>
              {currentSubtopics.map((st) => <option key={st.slug} value={st.slug}>{st.name}</option>)}
            </select>
          </div>
        </div>

        {selectedSubtopic && (
          <>
            {/* Existing Questions */}
            {loadingExisting ? <Spinner /> : existingQuestions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">Existing Questions ({existingQuestions.length})</h3>
                </div>
                <QuestionPreview
                  questions={existingQuestions}
                  onSave={handleSave}
                  readOnly={false}
                />
              </div>
            )}

            {/* Upload Panel — shown in upload mode or when no preview yet */}
            {mode === 'upload' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                <h3 className="font-semibold text-gray-700 mb-3">Paste New Questions JSON</h3>
                <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs text-gray-500 font-mono">
                  {`{ "questions": [ { "question": "...", "answer": "..." }, ... ] }`}
                </div>
                {parseError && <Alert message={parseError} type="error" />}
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={10}
                  placeholder={'{\n  "questions": [\n    { "question": "What is 2+2?", "answer": "4" }\n  ]\n}'}
                  className="w-full border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
                <button
                  onClick={parseJSON}
                  disabled={!jsonInput.trim()}
                  className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Parse & Preview →
                </button>
              </div>
            )}

            {/* Preview Panel */}
            {mode === 'preview' && parsedQuestions && (
              <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">Preview ({parsedQuestions.length} questions)</h3>
                  <button onClick={() => { setParsedQuestions(null); setMode('upload'); }}
                    className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1 rounded-lg">
                    ← Back to Upload
                  </button>
                </div>
                <QuestionPreview
                  questions={parsedQuestions}
                  onSave={handleSave}
                  readOnly={false}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
