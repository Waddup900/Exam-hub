export default function Menu({ sections, onSelect }) {
  return (
    <div className="screen menu-screen">
      <div className="menu-header">
        <h1 className="menu-title">Exam Hub</h1>
        <p className="menu-sub">Form 2 · English Practice</p>
      </div>
      <div className="section-grid">
        {sections.map(sec => (
          <button
            key={sec.key}
            className="section-card"
            onClick={() => onSelect(sec)}
          >
            <span className="section-label">{sec.label}</span>
            <span className="section-cn">{sec.cn}</span>
          </button>
        ))}
      </div>
    </div>
  )
}