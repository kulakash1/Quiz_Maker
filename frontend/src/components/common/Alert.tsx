import React from 'react';

interface Props {
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
}

const styles: Record<string, string> = {
  error: 'bg-red-50 border-red-400 text-red-700',
  success: 'bg-green-50 border-green-400 text-green-700',
  info: 'bg-blue-50 border-blue-400 text-blue-700',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-700',
};

export default function Alert({ message, type = 'info' }: Props) {
  return (
    <div className={`border-l-4 p-4 rounded ${styles[type]} mb-4`} role="alert">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
