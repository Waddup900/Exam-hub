import MCQQuiz        from './MCQQuiz'
import FillQuiz       from './FillQuiz'
import MultiBlankQuiz from './MultiBlankQuiz'
import RearrangeQuiz  from './RearrangeQuiz'
import ClozeQuiz      from './ClozeQuiz'
import ReadingQuiz    from './ReadingQuiz'

// No more name-entry screen — `studentName` and `user` now come in
// already resolved from App.jsx (via login + the profiles fetch),
// so there's nothing left to ask the student here.
export default function QuizShell({ section, studentName, user, onComplete, onBack }) {
  const props = { section, studentName, user, onComplete, onBack }

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