/**
 * Generic progress bar — used for course/section completion on the
 * menu screen. Unrelated to the wallet; just a fill % driven by a
 * number you already have, no library needed.
 */
export default function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="progress-bar-wrapper">
      {label && <span className="progress-bar-label">{label}</span>}
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-bar-count">
        {value} / {max}
      </span>
    </div>
  );
}
