import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ExamPage from './pages/ExamPage';
import ResultPage from './pages/ResultPage';
import TrainingPage from './pages/TrainingPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

// ── Language Context ──────────────────────────────────────────────
export const LangContext = createContext();
export function useLang() { return useContext(LangContext); }

// ── Auth Context ──────────────────────────────────────────────────
export const AuthContext = createContext();
export function useAuth() { return useContext(AuthContext); }

// ── Protected Route ───────────────────────────────────────────────
function Protected({ children }) {
  const token = localStorage.getItem('rnp_token');
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function AdminProtected({ children }) {
  const token = localStorage.getItem('rnp_token');
  const user = JSON.parse(localStorage.getItem('rnp_user') || 'null');
  if (!token) return <Navigate to="/" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const [lang, _setLang] = useState(() => localStorage.getItem('rnp_lang') || 'rw');
  const setLang = (val) => {
    localStorage.setItem('rnp_lang', val);
    _setLang(val);
  };
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rnp_user')); }
    catch { return null; }
  });

  const login = (token, userData) => {
    localStorage.setItem('rnp_token', token);
    localStorage.setItem('rnp_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('rnp_token');
    localStorage.removeItem('rnp_user');
    setUser(null);
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <AuthContext.Provider value={{ user, login, logout }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
             <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
             <Route path="/exam" element={<Protected><ExamPage /></Protected>} />
             <Route path="/result" element={<Protected><ResultPage /></Protected>} />
             <Route path="/training" element={<Protected><TrainingPage /></Protected>} />
             <Route path="/admin" element={<AdminProtected><AdminDashboardPage /></AdminProtected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </LangContext.Provider>
  );
}
