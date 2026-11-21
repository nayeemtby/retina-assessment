import { useState } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './context/useAuth.js';
import { ToastProvider } from './context/ToastContext.jsx';
import { ToastContainer } from './components/common/ToastContainer.jsx';

import { AuthTab } from './components/tabs/AuthTab.jsx';
import { StudentsTab } from './components/tabs/StudentsTab.jsx';
import { ExamsTab } from './components/tabs/ExamsTab.jsx';
import { ResultsTab } from './components/tabs/ResultsTab.jsx';
import { LeaderboardTab } from './components/tabs/LeaderboardTab.jsx';

import './App.css';

const TABS = [
  { id: 'auth', label: 'Admin Auth / Setup', icon: '🔐' },
  { id: 'students', label: 'Students', icon: '🎓' },
  { id: 'exams', label: 'Exams', icon: '📝' },
  { id: 'results', label: 'Results', icon: '📊' },
  { id: 'leaderboard', label: 'Public Leaderboard', icon: '🏆' },
];

function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('auth');
  const { admin, isAuthenticated, logout } = useAuth();

  return (
    <div className="dashboard-root">
      {/* Top Application Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo">
            <span className="brand-icon">⚡</span>
          </div>
          <div className="brand-titles">
            <h1 className="portal-title">Examination & Evaluation Portal</h1>
            <span className="portal-subtitle">Assessment & Verification Dashboard</span>
          </div>
        </div>

        <div className="header-session">
          {isAuthenticated ? (
            <div className="header-auth-badge">
              <span className="auth-pulse-dot"></span>
              <div className="auth-user-info">
                <span className="auth-user-name">{admin?.username || 'Administrator'}</span>
                <span className="auth-user-email">{admin?.email || ''}</span>
              </div>
              <button
                type="button"
                className="btn btn-outline-danger btn-xs"
                onClick={logout}
                title="Sign out of current administrator session"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="header-guest-badge">
              <span className="guest-badge-pill">Guest Mode</span>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setActiveTab('auth')}
              >
                Admin Login
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Primary Navigation Tab Bar */}
      <nav className="tab-navigation-bar" aria-label="Main Navigation">
        <div className="tab-navigation-track">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isPublic = tab.id === 'leaderboard';

            return (
              <button
                key={tab.id}
                type="button"
                className={`tab-nav-button ${isActive ? 'tab-nav-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={isActive}
              >
                <span className="tab-nav-icon">{tab.icon}</span>
                <span className="tab-nav-label">{tab.label}</span>
                {isPublic && <span className="tab-public-indicator">Public</span>}
                {isActive && <span className="tab-active-indicator" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Tab Content Pane */}
      <main className="tab-main-content">
        {activeTab === 'auth' && <AuthTab />}
        {activeTab === 'students' && <StudentsTab />}
        {activeTab === 'exams' && <ExamsTab />}
        {activeTab === 'results' && <ResultsTab />}
        {activeTab === 'leaderboard' && <LeaderboardTab />}
      </main>

      {/* System Footer */}
      <footer className="app-footer">
        <p>
          Student Examination Management & Verification Engine &bull; React 19 + Vite &bull; Standardized WireResult Architecture
        </p>
      </footer>

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DashboardLayout />
      </AuthProvider>
    </ToastProvider>
  );
}
