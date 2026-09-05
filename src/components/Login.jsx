import { useState } from 'react';
import { supabase } from '../lib/supabase';

// Students think in "username + password", not email — so we alias
// username -> a fake email under the hood. Supabase Auth still handles
// real sessions/JWTs/password hashing; we're just hiding the email concept.
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

    // No deposit is written here on purpose — wallet_deposits has no
    // student-insert policy. Add each new student's RM100 starting
    // deposit yourself in the Supabase SQL editor once they've signed up
    // (see README, "Tomorrow" section).
    onLogin(data.user);
  }

  return (
    <div className="login-screen">
      <h1>ExamHub</h1>

      <div className="login-tabs">
        <button
          className={mode === 'signin' ? 'active' : ''}
          onClick={() => setMode('signin')}
        >
          Log In
        </button>
        <button
          className={mode === 'signup' ? 'active' : ''}
          onClick={() => setMode('signup')}
        >
          New Student
        </button>
      </div>

      <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'signin' ? 'Log In' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}