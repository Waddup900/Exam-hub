import { useState } from 'react';
import { supabase } from '../lib/supabase';

function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@examhub.local`;
}

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
      setError('That username is already taken, or something went wrong.');
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
    <div className="screen name-screen">
      <div className="name-card">
        <h2 className="name-title">ExamHub</h2>
        <p className="name-hint">
          {mode === 'signin' ? 'Log in to continue' : 'Create your account'}
        </p>

        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
          <input
            className="name-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
          <input
            className="name-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
          />

          {error && <p className="error-msg">{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <button
          className="btn-secondary"
          style={{ marginTop: '0.75rem' }}
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