import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

export default function ClozeQuiz({ section, studentName, onComplete, onBack }) {
  const [passages, setPassages]   = useState([])
  const [current, setCurrent]     = useState(0)   // passage index
  const [questions, setQuestions] = useState([])  // blanks for current passage
  const [blankIdx, setBlankIdx]   = useState(0)   // which blank we're on
  const [score, setScore]         = useState(0)
  const [chosen, setChosen]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    async function fetch() {
      const { data: pData, error: pErr } = await supabase
        .from('passages').select('*').eq('section', section.key)
      
      if (pErr || !pData?.length) { 
        setError(pErr?.message || 'No passages found.'); 
        setLoading(false); 
        return 
      }

      // CHANGE 1: Shuffle and pick ONLY the first passage
      const randomPassage = shuffle(pData)[0] 
      setPassages([randomPassage]) // Store as an array with 1 item
      
      await loadPassageQuestions(randomPassage.id)
      setLoading(false)
    }
    fetch()
  }, [section.key])

  async function loadPassageQuestions(passageId) {
    const { data } = await supabase
      .from('questions').select('*')
      .eq('passage_id', passageId).eq('type', 'cloze')
      .order('blank_index')
    setQuestions(data || [])
    setBlankIdx(0)
    setChosen(null)
  }

  if (loading) return <div className="screen center"><div className="spinner" /></div>
  if (error)   return <div className="screen center"><p className="error-msg">{error}</p><button className="btn-secondary" onClick={onBack}>← Back</button></div>

  const passage = passages[current]
  const q       = questions[blankIdx]

  if (!q) return <div className="screen center"><div className="spinner" /></div>

  const options = shuffle([
    { text: q.answer, cn: q.answer_cn, correct: true },
    ...q.options.map(o => ({ text: o.t, cn: o.c, correct: false }))
  ])

  function handleAnswer(opt) {
    if (chosen) return
    setChosen(opt)
    if (opt.correct) setScore(s => s + 1)
  }

  async function handleNext() {
    const isLastBlank = blankIdx + 1 >= questions.length
    
    // CHANGE 2: Simplified logic - since there is only 1 passage, 
    // we only care if we finished the blanks.
    if (!isLastBlank) {
      setBlankIdx(b => b + 1)
      setChosen(null)
      return
    }

    // CHANGE 3: Final submission logic
    // We now use questions.length as the total since there's only one passage
    const finalTotal = questions.length

    await supabase.from('sessions').insert({ 
      student_name: studentName, 
      section: section.key, 
      score: score, 
      total: finalTotal 
    })

    onComplete({ 
      score, 
      total: finalTotal, 
      studentName, 
      section: section.key 
    })
  }

  // highlight current blank in passage
  const highlightedPassage = passage.passage.replace(
    new RegExp(`___${blankIdx + 1}___`, 'g'),
    `[___]`
  )

  const progress = ((current * questions.length + blankIdx) / (passages.length * questions.length)) * 100

  return (
    <div className="screen quiz-screen">
      <div className="quiz-header">
        <button className="back-btn" onClick={onBack}>← Menu</button>
        <span className="progress-label">Passage {current + 1}/{passages.length} · Blank {blankIdx + 1}/{questions.length}</span>
        <span className="score-chip">✦ {score}</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

      <div className="passage-box">
        {passage.title && <p className="passage-title">{passage.title}</p>}
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
          {passage.passage.split(/(_+\d+_+)/).map((part, i) => {
            const match = part.match(/___(\d+)___/)
            if (match) {
              const num = parseInt(match[1])
              const isCurrent = num === blankIdx + 1
              return (
                <span key={i} className="blank-number" style={{ background: isCurrent ? 'var(--primary)' : 'var(--primary-dim)', color: '#fff' }}>
                  {num}
                </span>
              )
            }
            return <span key={i}>{part}</span>
          })}
        </p>
      </div>

      <div className="question-card">
        <p className="question-text">Fill in Blank {blankIdx + 1}</p>
      </div>

      <div className="options-list">
        {options.map((opt, i) => {
          let cls = 'option-btn'
          if (chosen) {
            if (opt.correct)         cls += ' correct'
            else if (opt === chosen) cls += ' wrong'
            else                     cls += ' dimmed'
          }
          return (
            <button key={i} className={cls} onClick={() => handleAnswer(opt)}>
              <span className="opt-text">{opt.text}</span>
              {chosen && <span className="opt-cn">{opt.cn}</span>}
            </button>
          )
        })}
      </div>

      {chosen && (
        <div className={`feedback-box ${chosen.correct ? 'fb-correct' : 'fb-wrong'}`}>
          <p className="fb-verdict">{chosen.correct ? '✅ Correct!' : '❌ Wrong'}</p>
          {!chosen.correct && <p className="fb-answer">Answer: <strong>{q.answer}</strong>{q.answer_cn && <span className="cn"> · {q.answer_cn}</span>}</p>}
          {q.explanation && <p className="fb-explain">{q.explanation}</p>}
          {q.explain_cn  && <p className="fb-explain cn">{q.explain_cn}</p>}
          <button className="btn-primary" onClick={handleNext}>
            {blankIdx + 1 >= questions.length && current + 1 >= passages.length ? 'See Results' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}