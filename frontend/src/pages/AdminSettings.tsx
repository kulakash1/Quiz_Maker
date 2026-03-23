import React, { useEffect, useState } from 'react';
import api from '../api';
import { QuizConfig } from '../types';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';

export default function AdminSettings() {
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    api.get('/admin/config')
      .then((r) => setConfig(r.data))
      .catch(() => setFeedback({ msg: 'Failed to load config', type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.put('/admin/config', config);
      setFeedback({ msg: 'Settings saved successfully!', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ msg: err.response?.data?.error || 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!config) return null;

  const fields: { key: keyof QuizConfig; label: string; min: number; max: number; step: number; hint: string }[] = [
    { key: 'timerPerQuestion', label: 'Timer per Question (seconds)', min: 5, max: 300, step: 5, hint: 'How many seconds each question allows' },
    { key: 'marksPerQuestion', label: 'Marks per Correct Answer', min: 0.5, max: 10, step: 0.5, hint: 'Points awarded for each correct answer' },
    { key: 'negativeMarks', label: 'Negative Marks per Wrong Answer', min: 0, max: 5, step: 0.25, hint: 'Points deducted for each wrong answer' },
    { key: 'numberOfQuestions', label: 'Default Number of Questions', min: 1, max: 100, step: 1, hint: 'Default quiz length when user doesn\'t specify' },
    { key: 'numberOfOptions', label: 'Options per Question', min: 2, max: 6, step: 1, hint: 'How many answer choices generate per question' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz Settings ⚙️</h1>
        <p className="text-gray-500 text-sm mb-6">Configure global quiz parameters</p>

        {feedback && <Alert message={feedback.msg} type={feedback.type} />}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {fields.map(({ key, label, min, max, step, hint }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                <span className="ml-2 text-indigo-600 font-bold">{config[key]}</span>
              </label>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={config[key]}
                onChange={(e) => setConfig({ ...config, [key]: Number(e.target.value) })}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>{min}</span>
                <span className="text-gray-500">{hint}</span>
                <span>{max}</span>
              </div>
            </div>
          ))}

          <div className="border-t pt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Preview box */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-4">
          <h3 className="font-semibold text-gray-700 mb-3">Current Configuration</h3>
          <table className="w-full text-sm">
            <tbody>
              {fields.map(({ key, label }) => (
                <tr key={key} className="border-b last:border-0">
                  <td className="py-2 text-gray-500 pr-4">{label}</td>
                  <td className="py-2 font-semibold text-indigo-700">{config[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
