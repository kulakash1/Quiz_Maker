import React, { useEffect, useState } from 'react';
import api from '../api';
import { Subject, Topic, Subtopic } from '../types';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';

export default function HierarchyManager() {
  const [hierarchy, setHierarchy] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newTopicSubject, setNewTopicSubject] = useState('');
  const [newSubtopic, setNewSubtopic] = useState('');
  const [newSubtopicSubject, setNewSubtopicSubject] = useState('');
  const [newSubtopicTopic, setNewSubtopicTopic] = useState('');

  const loadHierarchy = async () => {
    try {
      const r = await api.get('/admin/hierarchy');
      setHierarchy(r.data);
    } catch {
      showFeedback('Failed to load hierarchy', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHierarchy(); }, []);

  const showFeedback = (msg: string, type: 'success' | 'error') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const createSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      await api.post('/admin/subject', { name: newSubject.trim() });
      setNewSubject('');
      showFeedback('Subject created!', 'success');
      loadHierarchy();
    } catch (err: any) { showFeedback(err.response?.data?.error || 'Error', 'error'); }
  };

  const createTopic = async () => {
    if (!newTopic.trim() || !newTopicSubject) return;
    try {
      await api.post('/admin/topic', { subjectSlug: newTopicSubject, name: newTopic.trim() });
      setNewTopic('');
      showFeedback('Topic created!', 'success');
      loadHierarchy();
    } catch (err: any) { showFeedback(err.response?.data?.error || 'Error', 'error'); }
  };

  const createSubtopic = async () => {
    if (!newSubtopic.trim() || !newSubtopicSubject || !newSubtopicTopic) return;
    try {
      await api.post('/admin/subtopic', {
        subjectSlug: newSubtopicSubject,
        topicSlug: newSubtopicTopic,
        name: newSubtopic.trim(),
      });
      setNewSubtopic('');
      showFeedback('Subtopic created!', 'success');
      loadHierarchy();
    } catch (err: any) { showFeedback(err.response?.data?.error || 'Error', 'error'); }
  };

  const deleteSubject = async (slug: string) => {
    if (!window.confirm('Delete this subject and all its topics/subtopics?')) return;
    try {
      await api.delete(`/admin/subject/${slug}`);
      showFeedback('Subject deleted', 'success');
      loadHierarchy();
    } catch (err: any) { showFeedback(err.response?.data?.error || 'Error', 'error'); }
  };

  const deleteTopic = async (subSlug: string, topSlug: string) => {
    if (!window.confirm('Delete this topic and its subtopics?')) return;
    try {
      await api.delete(`/admin/topic/${subSlug}/${topSlug}`);
      showFeedback('Topic deleted', 'success');
      loadHierarchy();
    } catch (err: any) { showFeedback(err.response?.data?.error || 'Error', 'error'); }
  };

  const deleteSubtopic = async (subSlug: string, topSlug: string, stSlug: string) => {
    if (!window.confirm('Delete this subtopic?')) return;
    try {
      await api.delete(`/admin/subtopic/${subSlug}/${topSlug}/${stSlug}`);
      showFeedback('Subtopic deleted', 'success');
      loadHierarchy();
    } catch (err: any) { showFeedback(err.response?.data?.error || 'Error', 'error'); }
  };

  const currentTopicsForSubtopic = hierarchy.find((s) => s.slug === newSubtopicSubject)?.topics || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Subject / Topic / Subtopic Manager</h1>
        <p className="text-gray-500 text-sm mb-6">Build the quiz content hierarchy</p>

        {feedback && <Alert message={feedback.msg} type={feedback.type} />}

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* Create Subject */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span>📚</span> New Subject</h2>
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createSubject()}
              placeholder="Subject name"
              className="w-full border rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={createSubject} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-sm font-medium transition-colors">
              + Add Subject
            </button>
          </div>

          {/* Create Topic */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span>📂</span> New Topic</h2>
            <select
              value={newTopicSubject}
              onChange={(e) => setNewTopicSubject(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Subject</option>
              {hierarchy.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createTopic()}
              placeholder="Topic name"
              className="w-full border rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={createTopic} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl text-sm font-medium transition-colors">
              + Add Topic
            </button>
          </div>

          {/* Create Subtopic */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><span>📄</span> New Subtopic</h2>
            <select
              value={newSubtopicSubject}
              onChange={(e) => { setNewSubtopicSubject(e.target.value); setNewSubtopicTopic(''); }}
              className="w-full border rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Subject</option>
              {hierarchy.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
            <select
              value={newSubtopicTopic}
              onChange={(e) => setNewSubtopicTopic(e.target.value)}
              disabled={!newSubtopicSubject}
              className="w-full border rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value="">Select Topic</option>
              {currentTopicsForSubtopic.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
            <input
              type="text"
              value={newSubtopic}
              onChange={(e) => setNewSubtopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createSubtopic()}
              placeholder="Subtopic name"
              className="w-full border rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={createSubtopic} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-medium transition-colors">
              + Add Subtopic
            </button>
          </div>
        </div>

        {/* Hierarchy Tree */}
        {loading ? <Spinner /> : (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-4">Current Hierarchy</h2>
            {hierarchy.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No subjects yet.</p>
            ) : (
              <div className="space-y-3">
                {hierarchy.map((s) => (
                  <div key={s.slug} className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-indigo-50 px-4 py-3 flex items-center justify-between">
                      <span className="font-semibold text-indigo-800 flex items-center gap-2">
                        <span>📚</span> {s.name}
                        <span className="text-xs font-normal text-indigo-400">({s.slug})</span>
                      </span>
                      <button onClick={() => deleteSubject(s.slug)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                    </div>
                    {s.topics.length > 0 && (
                      <div className="px-4 py-2 space-y-2">
                        {s.topics.map((t) => (
                          <div key={t.slug} className="border-l-2 border-purple-200 pl-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-purple-700 flex items-center gap-1">
                                <span>📂</span> {t.name}
                                <span className="text-xs font-normal text-purple-400">({t.slug})</span>
                              </span>
                              <button onClick={() => deleteTopic(s.slug, t.slug)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                            </div>
                            {t.subtopics.length > 0 && (
                              <div className="ml-4 mt-1 space-y-1">
                                {t.subtopics.map((st) => (
                                  <div key={st.slug} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                                    <span className="flex items-center gap-1"><span>📄</span> {st.name} <span className="text-gray-400">({st.slug})</span></span>
                                    <button onClick={() => deleteSubtopic(s.slug, t.slug, st.slug)} className="text-red-400 hover:text-red-600">Delete</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
