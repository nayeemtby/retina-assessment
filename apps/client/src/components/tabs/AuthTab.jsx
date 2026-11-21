import { useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { useToast } from '../../context/useToast.js';
import { AlertBanner } from '../common/AlertBanner.jsx';

export function AuthTab() {
  const { admin, token, isAuthenticated, login, logout, bootstrap } = useAuth();
  const { success, error } = useToast();

  // Bootstrap form state
  const [bootstrapForm, setBootstrapForm] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapConflict, setBootstrapConflict] = useState(false);
  const [bootstrapError, setBootstrapError] = useState('');

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleBootstrapChange = (e) => {
    const { name, value } = e.target;
    setBootstrapForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBootstrapSubmit = async (e) => {
    e.preventDefault();
    setBootstrapLoading(true);
    setBootstrapError('');

    try {
      await bootstrap(bootstrapForm);
      success('Admin initialized successfully! You may now log in.', 'Setup Complete');
      setBootstrapConflict(true);
      // Auto-fill login email for convenience
      setLoginForm((prev) => ({ ...prev, email: bootstrapForm.email }));
      setBootstrapForm({ username: '', email: '', password: '' });
    } catch (err) {
      if (err.isConflict || err.status === 409) {
        setBootstrapConflict(true);
        const msg = err.message || 'Admin already initialized. Please log in.';
        setBootstrapError(msg);
        error(msg, 'Conflict');
      } else {
        const msg = err.message || 'Failed to initialize administrator.';
        setBootstrapError(msg);
        error(msg, 'Bootstrap Error');
      }
    } finally {
      setBootstrapLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const data = await login(loginForm);
      success(`Welcome back, ${data.admin?.username || data.admin?.email}!`, 'Login Successful');
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      const msg = err.message || 'Invalid credentials or login failed.';
      setLoginError(msg);
      error(msg, 'Authentication Failed');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="tab-pane">
      <div className="tab-header">
        <h2>Administrator Authentication & Setup</h2>
        <p className="tab-subtitle">
          Initialize the primary system administrator or authenticate to access protected student, examination, and result management operations.
        </p>
      </div>

      {/* Active Session Banner */}
      <section className="session-banner-card">
        <div className="session-banner-header">
          <div className="session-indicator">
            <span className={`status-dot ${isAuthenticated ? 'dot-active' : 'dot-inactive'}`}></span>
            <span className="session-status-label">
              Session Status: <strong>{isAuthenticated ? 'Authenticated Administrator' : 'Guest / Unauthenticated'}</strong>
            </span>
          </div>

          {isAuthenticated && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => {
                logout();
                success('Logged out successfully.', 'Session Terminated');
              }}
            >
              Sign Out (Clear Token)
            </button>
          )}
        </div>

        {isAuthenticated ? (
          <div className="session-details-grid">
            <div className="session-detail-item">
              <span className="detail-label">Admin Username:</span>
              <span className="detail-value">{admin?.username || '—'}</span>
            </div>
            <div className="session-detail-item">
              <span className="detail-label">Admin Email:</span>
              <span className="detail-value">{admin?.email || '—'}</span>
            </div>
            <div className="session-detail-item">
              <span className="detail-label">JWT Bearer Status:</span>
              <span className="detail-value text-success">
                Active in localStorage ({token ? `${token.slice(0, 12)}...${token.slice(-8)}` : 'Valid'})
              </span>
            </div>
          </div>
        ) : (
          <div className="session-guest-notice">
            <p>
              You are currently viewing in <strong>Guest Mode</strong>. You can view the <strong>Public Leaderboard</strong> without credentials. To manage students, exams, or record results, please log in below.
            </p>
          </div>
        )}
      </section>

      <div className="auth-forms-grid">
        {/* Step 1: Bootstrap Admin Section */}
        <section className="card auth-card">
          <div className="card-header">
            <div className="step-tag">Step 1</div>
            <h3>Initialize Administrator</h3>
          </div>

          <div className="card-body">
            <p className="card-desc">
              One-time initial bootstrap. Creates the root admin account. Returns a <code>409 Conflict</code> if an administrator already exists.
            </p>

            {bootstrapError && (
              <AlertBanner
                type={bootstrapConflict ? 'warning' : 'error'}
                title={bootstrapConflict ? 'Conflict' : 'Error'}
                message={bootstrapError}
                onClose={() => setBootstrapError('')}
              />
            )}

            {bootstrapConflict && (
              <div className="info-box info-warning">
                ℹ️ <strong>Admin account is already initialized.</strong> Please proceed to the Login section.
              </div>
            )}

            <form onSubmit={handleBootstrapSubmit} className="stacked-form">
              <div className="form-group">
                <label htmlFor="bootstrap-username">Username</label>
                <input
                  id="bootstrap-username"
                  name="username"
                  type="text"
                  className="form-input"
                  placeholder="e.g. superadmin"
                  value={bootstrapForm.username}
                  onChange={handleBootstrapChange}
                  required
                  minLength={3}
                  disabled={bootstrapLoading || bootstrapConflict}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bootstrap-email">Admin Email</label>
                <input
                  id="bootstrap-email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="admin@example.com"
                  value={bootstrapForm.email}
                  onChange={handleBootstrapChange}
                  required
                  disabled={bootstrapLoading || bootstrapConflict}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bootstrap-password">Password</label>
                <input
                  id="bootstrap-password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={bootstrapForm.password}
                  onChange={handleBootstrapChange}
                  required
                  minLength={6}
                  disabled={bootstrapLoading || bootstrapConflict}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={bootstrapLoading || bootstrapConflict}
              >
                {bootstrapLoading ? 'Initializing...' : 'Initialize Admin'}
              </button>
            </form>
          </div>
        </section>

        {/* Step 2: Login Section */}
        <section className="card auth-card">
          <div className="card-header">
            <div className="step-tag">Step 2</div>
            <h3>Admin Login</h3>
          </div>

          <div className="card-body">
            <p className="card-desc">
              Authenticate with your administrator credentials. Saves JWT token to <code>localStorage</code> to authorize requests.
            </p>

            {loginError && (
              <AlertBanner
                type="error"
                title="Login Failed"
                message={loginError}
                onClose={() => setLoginError('')}
              />
            )}

            <form onSubmit={handleLoginSubmit} className="stacked-form">
              <div className="form-group">
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="admin@example.com"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  required
                  disabled={loginLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Enter password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                  disabled={loginLoading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-accent"
                disabled={loginLoading}
              >
                {loginLoading ? 'Authenticating...' : isAuthenticated ? 'Switch / Re-login' : 'Login'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
