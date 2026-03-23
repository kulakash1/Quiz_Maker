import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Subject } from '../types';
import Spinner from '../components/common/Spinner';

export default function AdminDashboard() {
  const [hierarchy, setHierarchy] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get('/admin/hierarchy'),
      api.get('/user/history').catch(() => ({ data: [] })),
    ]).then(([h]) => {
      setHierarchy(h.data);
    }).finally(() => setLoading(false));
  }, []);

  const totalSubjects = hierarchy.length;
  const totalTopics = hierarchy.reduce((a, s) => a + s.topics.length, 0);
  const totalSubtopics = hierarchy.reduce((a, s) => a + s.topics.reduce((b, t) => b + t.subtopics.length, 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-2xl p-6 text-white mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard 🛠️</h1>
          <p className="text-indigo-200 mt-1">Manage the Quiz Maker platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Subjects', value: totalSubjects, icon: '📚', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Topics', value: totalTopics, icon: '📂', color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Subtopics', value: totalSubtopics, icon: '📄', color: 'text-green-600', bg: 'bg-green-50' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className={`text-3xl font-bold ${s.color}`}>{loading ? '–' : s.value}</div>
              <div className="text-sm text-gray-600">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Link to="/admin/manage" className="bg-white border-2 border-indigo-100 hover:border-indigo-400 rounded-xl p-5 transition-all group">
            <div className="text-3xl mb-2">🗂️</div>
            <h3 className="font-semibold text-gray-800 group-hover:text-indigo-700">Manage Hierarchy</h3>
            <p className="text-gray-500 text-sm mt-1">Create subjects, topics, subtopics</p>
          </Link>
          <Link to="/admin/upload" className="bg-white border-2 border-purple-100 hover:border-purple-400 rounded-xl p-5 transition-all group">
            <div className="text-3xl mb-2">📤</div>
            <h3 className="font-semibold text-gray-800 group-hover:text-purple-700">Upload Questions</h3>
            <p className="text-gray-500 text-sm mt-1">Upload and preview questions</p>
          </Link>
          <Link to="/admin/settings" className="bg-white border-2 border-green-100 hover:border-green-400 rounded-xl p-5 transition-all group">
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="font-semibold text-gray-800 group-hover:text-green-700">Quiz Settings</h3>
            <p className="text-gray-500 text-sm mt-1">Configure quiz parameters</p>
          </Link>
        </div>

        {/* Hierarchy overview */}
        {loading ? <Spinner /> : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Content Structure</h2>
            {hierarchy.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📚</div>
                <p>No subjects yet. <Link to="/admin/manage" className="text-indigo-600 hover:underline">Create one!</Link></p>
              </div>
            ) : (
              <div className="space-y-3">
                {hierarchy.map((s) => (
                  <details key={s.slug} className="border border-gray-100 rounded-xl overflow-hidden">
                    <summary className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 font-medium text-gray-700 flex items-center gap-2">
                      <span className="text-lg">📚</span> {s.name}
                      <span className="ml-auto text-xs text-gray-400">{s.topics.length} topics</span>
                    </summary>
                    <div className="px-4 py-2 space-y-2">
                      {s.topics.map((t) => (
                        <details key={t.slug} className="ml-4 border-l-2 border-indigo-100 pl-3">
                          <summary className="cursor-pointer text-sm text-gray-700 py-1 font-medium flex items-center gap-2">
                            <span>📂</span> {t.name}
                            <span className="ml-auto text-xs text-gray-400">{t.subtopics.length} subtopics</span>
                          </summary>
                          <div className="ml-4 py-1 space-y-0.5">
                            {t.subtopics.map((st) => (
                              <div key={st.slug} className="flex items-center gap-1 text-xs text-gray-500 py-0.5">
                                <span>📄</span> {st.name}
                              </div>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
