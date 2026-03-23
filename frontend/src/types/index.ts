// All shared TypeScript types for Quiz Maker

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface Subtopic {
  name: string;
  slug: string;
}

export interface Topic {
  name: string;
  slug: string;
  subtopics: Subtopic[];
}

export interface Subject {
  name: string;
  slug: string;
  topics: Topic[];
}

export interface RawQuestion {
  question: string;
  answer: string;
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

export interface QuizConfig {
  timerPerQuestion: number;
  marksPerQuestion: number;
  negativeMarks: number;
  numberOfQuestions: number;
  numberOfOptions: number;
}

export type QuizMode = 'mcq' | 'qa';

export interface QuizSession {
  sessionToken: string;
  questions: QuizQuestion[];
  quizMode: QuizMode;
  correctAnswers?: string[];
  config: {
    timer: number;
    marksPerQuestion: number;
    negativeMarks: number;
    numOptions: number;
  };
}

export interface QuizAnswer {
  questionId: number;
  selectedOption: string | null;
  flagged?: boolean;
}

export interface QuizResultDetail {
  questionId: number;
  correct: boolean;
  skipped: boolean;
  correctAnswer: string;
}

export interface QuizResult {
  score: number;
  correct: number;
  wrong: number;
  unattempted: number;
  total: number;
  maxScore: number;
  result: QuizResultDetail[];
  subject: string;
  topic: string;
  subtopic: string;
}

export interface QuizHistoryEntry {
  subject: string;
  topic: string;
  subtopic: string;
  score: number;
  total: number;
  maxScore: number;
  correct: number;
  wrong: number;
  date: string;
}
