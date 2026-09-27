import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function QuestModal({ user, sections = [], onClose }) {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .rpc('get_my_weekly_progress')
      .then(({ data, error }) => {
        if (!error && data?.length) setProgress(data[0])
        setLoading(false)
      })
  }, [user])

  const todayCount = progress?.today_count ?? 0
  const todayCredit = progress?.today_credit ?? 0
  const weekCredit = progress?.week_credit ?? 0
  const rate = progress?.rate ?? 0
  const bonusEarned = progress?.bonus_earned ?? false
  const todayFull = todayCount >= 10

  return (
    <div className="eh-quest-overlay" onClick={onClose}>
      <style>{`
        .eh-quest-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex; align-items: center; justify-content: center;
          z-index: 200;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .eh-quest-card {
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 16px;
          padding: 1.75rem;
          width: 100%;
          max-width: 340px;
          color: #fff;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        }
        .eh-quest-title { margin: 0 0 0.2rem; font-size: 1.15rem; font-weight: 700; }
        .eh-quest-sub { margin: 0 0 1.25rem; color: #9ca3af; font-size: 0.85rem; }
        .eh-quest-today-box {
          border-radius: 10px;
          padding: 0.9rem;
          text-align: center;
          margin-bottom: 0.75rem;
          transition: background 0.2s;
        }
        .eh-quest-today-count { font-size: 1.5rem; font-weight: 800; }
        .eh-quest-today-label { font-size: 0.75rem; color: #9ca3af; margin-top: 0.15rem; }
        .eh-quest-week-box {
          background: #111827;
          border-radius: 10px;
          padding: 0.9rem;
          text-align: center;
          margin-bottom: 1rem;
        }
        .eh-quest-rate-value { font-size: 1.8rem; font-weight: 800; color: #22c55e; }
        .eh-quest-rate-label { font-size: 0.75rem; color: #9ca3af; margin-top: 0.15rem; }
        .eh-quest-bonus {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.85rem;
          padding: 0.6rem 0.7rem;
          border-radius: 8px;
        }
        .eh-quest-bonus.done { background: rgba(34,197,94,0.15); color: #86efac; }
        .eh-quest-bonus.pending { background: rgba(255,255,255,0.06); color: #9ca3af; }
        .eh-quest-close {
          margin-top: 1.25rem;
          width: 100%;
          padding: 0.6rem;
          border: none;
          border-radius: 8px;
          background: #374151;
          color: #fff;
          font-size: 0.9rem;
          cursor: pointer;
        }
      `}</style>

      <div className="eh-quest-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="eh-quest-title">📜 Weekly Quest</h2>
        <p className="eh-quest-sub">Resets every Sunday</p>

        {loading ? (
          <p style={{ color: '#9ca3af' }}>Loading...</p>
        ) : (
          <>
            <div
              className="eh-quest-today-box"
              style={{ background: todayFull ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="eh-quest-today-count"
                style={{ color: todayFull ? '#22c55e' : '#fff' }}
              >
                {todayCount}/10
              </div>
              <div className="eh-quest-today-label">
                today · +{(todayCredit * 100).toFixed(1)}%
                {todayFull ? ' (capped)' : ''}
              </div>
            </div>

            <div className="eh-quest-week-box">
              <div className="eh-quest-rate-value">{(rate * 100).toFixed(1)}%</div>
              <div className="eh-quest-rate-label">
                total interest this week (activity: {(weekCredit * 100).toFixed(1)}%)
              </div>
            </div>

            {progress?.bonus_section_key ? (
              <div className={`eh-quest-bonus ${bonusEarned ? 'done' : 'pending'}`}>
                {bonusEarned ? '✅' : '⭐'} Score 80%+ on{' '}
                {sections.find((s) => s.key === progress.bonus_section_key)?.label ?? progress.bonus_section_key}
                {' '}for +1%{bonusEarned ? ' — earned!' : ''}
              </div>
            ) : (
              <div className="eh-quest-bonus pending">No bonus challenge set this week</div>
            )}
          </>
        )}

        <button className="eh-quest-close" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
