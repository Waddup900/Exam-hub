import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Labels for the "git log" style ledger — short tag, sign, amount, reason.
const SOURCE_LABEL = {
  initial: 'Starting deposit',
  weekly_interest: 'Weekly interest',
  tuition: 'Tuition top-up',
  wager_win: 'Challenge win',
  wager_loss: 'Challenge loss',
  manual_admin: 'Adjustment',
  challenge: 'Challenge bonus',
};

/**
 * Full wallet panel — opened by clicking WalletBadge or the profile.
 * Just balance + a plain transaction list. No progress bar, no ceiling —
 * kept deliberately simple per the current design.
 */
export default function Wallet({ user }) {
  const [balance, setBalance] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);

      const [{ data: balanceRow }, { data: ledgerRows }] = await Promise.all([
        supabase
          .from('wallet_balance')
          .select('balance')
          .eq('student_id', user.id)
          .maybeSingle(),
        supabase
          .from('wallet_ledger_view')
          .select('*')
          .eq('student_id', user.id)
          .limit(50),
      ]);

      setBalance(balanceRow?.balance ?? 0);
      setLedger(ledgerRows ?? []);
      setLoading(false);
    }

    load();
  }, [user]);

  if (loading) return <div className="wallet-loading">Loading wallet...</div>;

  return (
    <div className="wallet-panel">
      <h2 className="wallet-balance-amount">RM{balance.toFixed(2)}</h2>

      <ul className="wallet-ledger">
        {ledger.map((row) => (
          <li key={row.id} className={row.amount >= 0 ? 'ledger-positive' : 'ledger-negative'}>
            <span className="ledger-amount">
              {row.amount >= 0 ? '+' : ''}
              RM{row.amount.toFixed(2)}
            </span>
            <span className="ledger-label">
              {SOURCE_LABEL[row.source] ?? row.source}
              {row.note ? ` — ${row.note}` : ''}
            </span>
            <span className="ledger-date">
              {new Date(row.created_at).toLocaleDateString('en-MY', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </li>
        ))}
        {ledger.length === 0 && <li className="ledger-empty">No transactions yet.</li>}
      </ul>
    </div>
  );
}
