import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export function LoginPage() {
  const { login, register, loading, error, clearError } = useAppStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@flowdesk.app');
  const [password, setPassword] = useState('password123');
  const [localError, setLocalError] = useState('');

  useEffect(() => () => clearError(), [clearError]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark" style={{ width: 40, height: 40 }} />
          <h1>FlowDesk</h1>
          <p>Projects, tasks, and teammates — ClickUp-style.</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          {(localError || error) && (
            <div className="auth-error">{localError || error}</div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          className="auth-switch"
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
        </button>

        <div className="auth-hint">
          Seed logins (password: password123)
          <br />
          admin@flowdesk.app · lead@flowdesk.app · dev@flowdesk.app · qa@flowdesk.app
        </div>
      </div>
    </div>
  );
}
