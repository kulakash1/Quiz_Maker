import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-indigo-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-wide flex items-center gap-2">
          <span className="text-2xl">🎯</span> Quiz Maker
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <>
                  <Link to="/admin" className="hover:text-indigo-200 transition-colors">Dashboard</Link>
                  <Link to="/admin/manage" className="hover:text-indigo-200 transition-colors">Manage</Link>
                  <Link to="/admin/upload" className="hover:text-indigo-200 transition-colors">Upload</Link>
                  <Link to="/admin/settings" className="hover:text-indigo-200 transition-colors">Settings</Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="hover:text-indigo-200 transition-colors">Dashboard</Link>
                  <Link to="/quiz/select" className="hover:text-indigo-200 transition-colors">Start Quiz</Link>
                </>
              )}
              <span className="hidden sm:inline text-indigo-200">|</span>
              <span className="font-medium hidden sm:inline">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="bg-indigo-500 hover:bg-indigo-400 px-3 py-1 rounded-lg transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-indigo-200 transition-colors">Login</Link>
              <Link to="/signup" className="bg-white text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors font-medium">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
