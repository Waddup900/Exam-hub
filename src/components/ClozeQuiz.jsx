import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

function buildOptions(q) {
  if (!q) return []
  return shuffle([
    { text: q.answer, cn: q.answer_cn, correct: true },
    ...q.options.map(o => ({ text: o.t, cn: o.c, correct: false }))
  ])
}

export default function ClozeQuiz({ section, studentName, onComplete, onBack }) {
  const [passages, setPassages]   = useState([])
  const [current, setCurrent]     = useState(0)
  const [questions, setQuestions] = useState([])
  const [blankIdx, setBlankIdx]   = useState(0)
  const [score, setScore]         = useState(0)
  const [chosen, setChosen]       = useState(null)
  const [options, setOptions]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    async function fetch() {
      const { data: pData, error: pErr } = await supabase
        .from('passages').select('*').eq('section', section.key)
      if (pErr || !pData?.length) { setError(pErr?.message || 'No passages found.'); setLoading(false); return }
      const randomPassage = shuffle(pData)[0]
      setPassages([randomPassage])
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
    const qs = data || []
    setQuestions(qs)
    setBlankIdx(0)
    setChosen(null)
    setOptions(buildOptions(qs[0]))
  }

  if (loading) return <div className="screen center"><div className="spinner" /></div>
  if (error)   return <div className="screen center"><p className="error-msg">{error}</p><button className="btn-secondary" onClick={onBack}>← Back</button></div>

  const passage = passages[current]
  const q       = questions[blankIdx]

  if (!q) return <div className="screen center"><div className="spinner" /></div>

  function handleAnswer(opt) {
    if (chosen) return
    setChosen(opt)
    if (opt.correct) setScore(s => s + 1)
  }

  function handleRetry() {
    setChosen(null)
  }

  async function handleNext() {
    const isLastBlank = blankIdx + 1 >= questions.length
    if (!isLastBlank) {
      const nextIdx = blankIdx + 1
      setBlankIdx(nextIdx)
      setChosen(null)
      setOptions(buildOptions(questions[nextIdx]))
      return
    }
    await supabase.from('sessions').insert({
      student_name: studentName, section: section.key,
      score, total: questions.length
    })
    onComplete({ score, total: questions.length, studentName, section: section.key })
  }

  const progress = (blankIdx / questions.length) * 100

  return (
    <div className="screen quiz-screen">
      <div className="quiz-header">
        <button className="back-btn" onClick={onBack}>← Menu</button>
        <span className="progress-label">Blank {blankIdx + 1} / {questions.length}</span>
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
              {chosen && opt === chosen && !chosen.correct && <span className="opt-cn">{opt.cn}</span>}
            </button>
          )
        })}
      </div>

      {chosen && (
        <div className={`feedback-box ${chosen.correct ? 'fb-correct' : 'fb-wrong'}`}>
          <p className="fb-verdict">{chosen.correct ? '✅ Correct!' : '❌ Try again!'}</p>
          {chosen.correct && q.explanation && <p className="fb-explain">{q.explanation}</p>}
          {chosen.correct && q.explain_cn  && <p className="fb-explain cn">{q.explain_cn}</p>}
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
            {!chosen.correct && (
              <button className="btn-secondary" style={{ flex: 1 }} onClick={handleRetry}>↩ Retry</button>
            )}
            {chosen.correct && (
              <button className="btn-primary" style={{ flex: 2 }} onClick={handleNext}>
                {blankIdx + 1 >= questions.length ? 'See Results' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}