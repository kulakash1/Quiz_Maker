import React, { useState } from 'react';
import { RawQuestion } from '../../types';

interface Props {
  questions: RawQuestion[];
  onSave: (questions: RawQuestion[]) => void;
  readOnly?: boolean;
}

export default function QuestionPreview({ questions: initial, onSave, readOnly = false }: Props) {
  const [questions, setQuestions] = useState<RawQuestion[]>(initial);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const startEdit = (i: number) => {
    setEditIdx(i);
    setEditQ(questions[i].question);
    setEditA(questions[i].answer);
  };

  const saveEdit = () => {
    if (editIdx === null) return;
    const updated = [...questions];
    updated[editIdx] = { question: editQ.trim(), answer: editA.trim() };
    setQuestions(updated);
    setEditIdx(null);
  };

  const deleteQuestion = (i: number) => {
    if (!window.confirm('Delete this question?')) return;
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
    if (editIdx === i) setEditIdx(null);
  };

  const addQuestion = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setQuestions((prev) => [...prev, { question: newQuestion.trim(), answer: newAnswer.trim() }]);
    setNewQuestion('');
    setNewAnswer('');
    setShowAdd(false);
  };

  return (
    <div>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {questions.length === 0 && (
          <p className="text-center text-gray-400 py-4 text-sm">No questions yet.</p>
        )}
        {questions.map((q, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
            {editIdx === i && !readOnly ? (
              <div className="space-y-2">
                <input
                  value={editQ}
                  onChange={(e) => setEditQ(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Question"
                />
                <input
                  value={editA}
                  onChange={(e) => setEditA(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Answer"
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-700">Save</button>
                  <button onClick={() => setEditIdx(null)} className="border border-gray-300 text-gray-600 px-3 py-1 rounded-lg text-xs hover:bg-gray-100">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-gray-400 mt-0.5 w-5 text-right flex-shrink-0">{i + 1}.</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{q.question}</p>
                  <p className="text-xs text-green-700 font-medium mt-1">✓ {q.answer}</p>
                </div>
                {!readOnly && (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(i)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                    <button onClick={() => deleteQuestion(i)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">Delete</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="mt-4 space-y-3">
          {showAdd ? (
            <div className="border border-dashed border-indigo-300 rounded-xl p-4 bg-indigo-50 space-y-2">
              <input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="New question"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Correct answer"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button onClick={addQuestion} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-indigo-700">Add</button>
                <button onClick={() => setShowAdd(false)} className="border border-gray-300 text-gray-600 px-3 py-1 rounded-lg text-xs hover:bg-gray-100">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <span className="font-bold">+</span> Add Question
            </button>
          )}

          <button
            onClick={() => onSave(questions)}
            disabled={questions.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            ✓ Save {questions.length} Questions
          </button>
        </div>
      )}
    </div>
  );
}
