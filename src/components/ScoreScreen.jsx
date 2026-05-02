export default function ScoreScreen({ result, onRetry, onMenu }) {
  const { score, total, studentName, section } = result
  const percent = Math.round((score / total) * 100)

  const grade =
    percent >= 90 ? { label: 'Outstanding', cn: '优秀',   color: '#2ecc71' } :
    percent >= 70 ? { label: 'Good Job',    cn: '良好',   color: '#3498db' } :
    percent >= 50 ? { label: 'Keep Going',  cn: '继续努力', color: '#f39c12' } :
                    { label: 'Try Again',   cn: '再试一次', color: '#e74c3c' }

  return (
    <div className="screen score-screen">
      <div className="score-card">
        <p className="score-name">{studentName}</p>
        <div className="score-circle" style={{ '--grade-color': grade.color }}>
          <span className="score-percent">{percent}%</span>
          <span className="score-fraction">{score} / {total}</span>
        </div>
        <p className="grade-label" style={{ color: grade.color }}>
          {grade.label} <span className="cn">· {grade.cn}</span>
        </p>
        <p className="score-section">{section.replace(/_/g, ' ')}</p>
      </div>
      <div className="score-actions">
        <button className="btn-primary" onClick={onRetry}>Retry</button>
        <button className="btn-secondary" onClick={onMenu}>← Menu</button>
      </div>
    </div>
  )
}