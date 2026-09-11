import { useState } from 'react';
import { supabase } from '../lib/supabase';

function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@examhub.local`;
}

// Every style below is scoped to this component (inline + a <style> block
// with an "eh-" prefix) on purpose — it doesn't rely on any class from
// your existing App.css, so it can't collide with a dark theme or end up
// invisible again. Plain centered card, readable regardless of your
// site's global colors.
export default function Login({ onLogin }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    setLoading(false);

    if (error) {
      setError('Wrong username or password.');
      return;
    }
    onLogin(data.user);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('Username needs to be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password needs to be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
    });

    if (signUpError) {
      setLoading(false);
      console.error('Supabase signUp error:', signUpError); // check browser console (F12)
      setError(signUpError.message); // showing the REAL reason while debugging
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username: username.trim(),
    });

    setLoading(false);

    if (profileError) {
      setError('Account created, but profile setup failed — tell Gerard.');
      return;
    }

    onLogin(data.user);
  }

  return (
    <div className="eh-login-wrap">
      <style>{`
        .eh-login-wrap {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f4f5f7;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
          padding: 1.5rem;
        }
        .eh-login-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 360px;
          text-align: center;
        }
        .eh-login-title {
          margin: 0 0 0.25rem;
          font-size: 1.6rem;
          font-weight: 700;
          color: #1a1a1a;
        }
        .eh-login-hint {
          margin: 0 0 1.5rem;
          color: #6b7280;
          font-size: 0.95rem;
        }
        .eh-login-input {
          width: 100%;
          padding: 0.75rem 0.9rem;
          margin-bottom: 0.85rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          color: #111827;
          background: #fff;
          box-sizing: border-box;
        }
        .eh-login-input::placeholder { color: #9ca3af; }
        .eh-login-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79,70,229,0.15);
        }
        .eh-login-error {
          color: #dc2626;
          font-size: 0.9rem;
          margin: 0 0 0.85rem;
        }
        .eh-login-submit {
          width: 100%;
          padding: 0.8rem;
          border: none;
          border-radius: 8px;
          background: #4f46e5;
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
        }
        .eh-login-submit:disabled { opacity: 0.6; cursor: default; }
        .eh-login-submit:hover:not(:disabled) { background: #4338ca; }
        .eh-login-switch {
          margin-top: 1.1rem;
          background: none;
          border: none;
          color: #4f46e5;
          font-size: 0.9rem;
          cursor: pointer;
          text-decoration: underline;
        }
      `}</style>

      <div className="eh-login-card">
        <h1 className="eh-login-title">ExamHub</h1>
        <p className="eh-login-hint">
          {mode === 'signin' ? 'Log in to continue' : 'Create your account'}
        </p>

        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
          <input
            className="eh-login-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
          <input
            className="eh-login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
          />

          {error && <p className="eh-login-error">{error}</p>}

          <button className="eh-login-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <button
          className="eh-login-switch"
          onClick={() => {
            setError('');
            setMode(mode === 'signin' ? 'signup' : 'signin');
          }}
        >
          {mode === 'signin' ? 'New student? Create an account' : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  );
}
