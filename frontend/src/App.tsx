import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UserDashboard from './pages/UserDashboard';
import QuizSelectPage from './pages/QuizSelectPage';
import QuizPlayPage from './pages/QuizPlayPage';
import ResultPage from './pages/ResultPage';
import AdminDashboard from './pages/AdminDashboard';
import HierarchyManager from './pages/HierarchyManager';
import QuestionUploadPage from './pages/QuestionUploadPage';
import AdminSettings from './pages/AdminSettings';

function AppRoot() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />} />
        <Route path="/signup" element={!isAuthenticated ? <SignupPage /> : <Navigate to="/dashboard" replace />} />

        {/* User Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/quiz/select" element={<ProtectedRoute><QuizSelectPage /></ProtectedRoute>} />
        <Route path="/quiz/play" element={<ProtectedRoute><QuizPlayPage /></ProtectedRoute>} />
        <Route path="/quiz/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/manage" element={<ProtectedRoute adminOnly><HierarchyManager /></ProtectedRoute>} />
        <Route path="/admin/upload" element={<ProtectedRoute adminOnly><QuestionUploadPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />

        {/* Default */}
        <Route path="/" element={<Navigate to={isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </BrowserRouter>
  );
}
