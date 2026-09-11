export default function Menu({ sections = [], onSelect }) {
  return (
    <div className="screen menu-screen" style={{ paddingTop: '5rem', color: '#fff' }}>
      <div className="menu-header">
        <h1 className="menu-title">Exam Hub</h1>
        <p className="menu-sub">Form 2 · English Practice</p>
      </div>
      <div className="section-grid">
        {(sections || []).length === 0 ? (
          <p style={{ color: '#888', marginTop: '2rem' }}>No sections available.</p>
        ) : (
          sections.map((sec) => (
            <button
              key={sec.key || sec.id}
              className="section-card"
              onClick={() => onSelect && onSelect(sec)}
            >
              <span className="section-label">{sec.label}</span>
              <span className="section-cn">{sec.cn}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}