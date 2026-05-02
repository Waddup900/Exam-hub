import { useState } from 'react'
import MCQQuiz        from './MCQQuiz'
import FillQuiz       from './FillQuiz'
import MultiBlankQuiz from './MultiBlankQuiz'
import RearrangeQuiz  from './RearrangeQuiz'
import ClozeQuiz      from './ClozeQuiz'
import ReadingQuiz    from './ReadingQuiz'

export default function QuizShell({ section, onComplete, onBack }) {
  const [studentName, setStudentName] = useState('')
  const [nameSubmitted, setNameSubmitted] = useState(false)

  if (!nameSubmitted) {
    return (
      <div className="screen name-screen">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="name-card">
          <h2 className="name-title">
            {section.label}
            <span className="cn"> {section.cn}</span>
          </h2>
          <p className="name-hint">Enter your name to begin</p>
          <input
            className="name-input"
            type="text"
            placeholder="Your name..."
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && studentName.trim() && setNameSubmitted(true)}
            autoFocus
          />
          <button
            className="btn-primary"
            disabled={!studentName.trim()}
            onClick={() => setNameSubmitted(true)}
          >
            Start →
          </button>
        </div>
      </div>
    )
  }

  const props = { section, studentName, onComplete, onBack }

  switch (section.type) {
    case 'mcq':         return <MCQQuiz        {...props} />
    case 'fill':        return <FillQuiz        {...props} />
    case 'multi_blank': return <MultiBlankQuiz  {...props} />
    case 'rearrange':   return <RearrangeQuiz   {...props} />
    case 'cloze':       return <ClozeQuiz        {...props} />
    case 'reading':     return <ReadingQuiz      {...props} />
    default:            return <p style={{color:'var(--text-muted)'}}>Unknown type</p>
  }
}