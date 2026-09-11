import { supabase } from '../lib/supabase';

/**
 * Drop this next to WalletBadge in your header. Clears the Supabase
 * session (both server-side and the browser's local storage copy) and
 * calls onLoggedOut so App.jsx can reset its `user` state back to null,
 * which flips the app back to showing <Login />.
 */
export default function LogoutButton({ onLoggedOut }) {
  async function handleLogout() {
    await supabase.auth.signOut();
    onLoggedOut();
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '0.4rem 0.9rem',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        background: '#fff',
        color: '#374151',
        fontSize: '0.85rem',
        cursor: 'pointer',
      }}
    >
      Log out
    </button>
  );
}
