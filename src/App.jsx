import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function AppHeader({ user, username, onWalletClick, onLoggedOut }) {
  const [balance, setBalance] = useState(null)
  const [activeThisWeek, setActiveThisWeek] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('wallet_balance')
      .select('balance')
      .eq('student_id', user.id)
      .maybeSingle()
      .then(({ data }) => setBalance(data?.balance ?? 0))

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .gte('completed_at', sevenDaysAgo)
      .then(({ count }) => setActiveThisWeek((count ?? 0) > 0))
  }, [user])

  async function handleLogout() {
    await supabase.auth.signOut()
    onLoggedOut()
  }

  return (
    <div className="eh-header">
      <style>{`
        .eh-header {
          position: fixed; top: 0; left: 0; right: 0;
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.75rem 1.25rem;
          background: rgba(20, 20, 20, 0.85);
          backdrop-filter: blur(6px);
          z-index: 100;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
        }
        .eh-header-left { display: flex; align-items: center; gap: 0.5rem; }
        .eh-header-dot {
          width: 9px; height: 9px; border-radius: 50%;
          background: ${'${activeThisWeek ? "#22c55e" : "#52525b"}'};
        }
        .eh-header-username { color: #fff; font-weight: 600; font-size: 0.95rem; }
        .eh-header-right { display: flex; align-items: center; gap: 0.85rem; }
        .eh-header-balance {
          color: #22c55e; font-weight: 700; font-size: 0.95rem;
          background: none; border: none; padding: 0; cursor: pointer; font-family: inherit;
        }
        .eh-header-logout {
          color: #fff; background: none; border: 1px solid rgba(255,255,255,0.4);
          border-radius: 6px; padding: 0.3rem 0.7rem; font-size: 0.8rem;
          cursor: pointer; font-family: inherit;
        }
        .eh-header-logout:hover { background: rgba(255,255,255,0.12); }
      `}</style>

      <div className="eh-header-left">
        <span
          className="eh-header-dot"
          style={{ background: activeThisWeek ? '#22c55e' : '#52525b' }}
          title={activeThisWeek ? 'Active this week' : 'No exercise yet this week'}
        />
        <span className="eh-header-username">{username || 'Student'}</span>
      </div>

      <div className="eh-header-right">
        <button className="eh-header-balance" onClick={onWalletClick}>
          {balance === null ? '...' : `RM${balance.toFixed(2)}`}
        </button>
        <button className="eh-header-logout" onClick={handleLogout}>Log out</button>
      </div>
    </div>
  )
}
