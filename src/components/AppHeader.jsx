import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Replaces WalletBadge.jsx + LogoutButton.jsx as two separate pieces —
 * one self-contained header instead, so there's only one place styling
 * can go wrong. Username top-left, balance (green) + logout top-right.
 * All colors hardcoded — doesn't depend on any existing global CSS.
 */
export default function AppHeader({ user, username, onWalletClick, onLoggedOut }) {
  const [balance, setBalance] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('wallet_balance')
      .select('balance')
      .eq('student_id', user.id)
      .maybeSingle()
      .then(({ data }) => setBalance(data?.balance ?? 0))
  }, [user])

  async function handleLogout() {
    await supabase.auth.signOut()
    onLoggedOut()
  }

  return (
    <div className="eh-header">
      <style>{`
        .eh-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.25rem;
          background: rgba(20, 20, 20, 0.85);
          backdrop-filter: blur(6px);
          z-index: 100;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
        }
        .eh-header-username {
          color: #ffffff;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .eh-header-right {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .eh-header-balance {
          color: #22c55e;
          font-weight: 700;
          font-size: 0.95rem;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-family: inherit;
        }
        .eh-header-logout {
          color: #ffffff;
          background: none;
          border: 1px solid rgba(255,255,255,0.4);
          border-radius: 6px;
          padding: 0.3rem 0.7rem;
          font-size: 0.8rem;
          cursor: pointer;
          font-family: inherit;
        }
        .eh-header-logout:hover {
          background: rgba(255,255,255,0.12);
        }
        .eh-header-spacer {
          height: 3.4rem;
        }
      `}</style>

      <span className="eh-header-username">{username || 'Student'}</span>

      <div className="eh-header-right">
        <button className="eh-header-balance" onClick={onWalletClick}>
          {balance === null ? '...' : `RM${balance.toFixed(2)}`}
        </button>
        <button className="eh-header-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  )
}
