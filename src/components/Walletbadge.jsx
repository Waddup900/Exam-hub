import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Compact balance display for the header/nav — "RM123.45", nothing else.
 * Clicking it is meant to open the fuller Wallet.jsx panel (wire that up
 * in whatever your header/profile-click component is).
 */
export default function WalletBadge({ user, onClick }) {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data } = await supabase
        .from('wallet_balance')
        .select('balance')
        .eq('student_id', user.id)
        .maybeSingle();
      setBalance(data?.balance ?? 0);
    }

    load();
  }, [user]);

  if (balance === null) return null;

  return (
    <button className="wallet-badge" onClick={onClick}>
      RM{balance.toFixed(2)}
    </button>
  );
}