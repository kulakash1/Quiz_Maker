// Fisher-Yates shuffle
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

// Save/Load quiz state for refresh-persistence
export function saveQuizState(state: object) {
  try {
    localStorage.setItem('quiz_state', JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function loadQuizState<T>(): T | null {
  try {
    const s = localStorage.getItem('quiz_state');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function clearQuizState() {
  localStorage.removeItem('quiz_state');
}
