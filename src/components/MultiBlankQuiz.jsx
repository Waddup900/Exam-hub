import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

function buildBlankOptions(blanks) {
  return blanks.reduce((acc, b) => {
    acc[b.index] = shuffle([
      { text: b.answer, cn: b.answer_cn, correct: true },
      ...b.options.map(o => ({ text: o.t, cn: o.c, correct: false }))
    ])
    return acc
  }, {})
}

export default function MultiBlankQuiz({ section, studentName, onComplete, onBack }) {
  const [questions, setQuestions]   = useState([])
  const [current, setCurrent]       = useState(0)
  const [score, setScore]           = useState(0)
  const [chosen, setChosen]         = useState({})
  const [blankOptions, setBlankOptions] = useState({})
  const [submitted, setSubmitted]   = useState(false)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('questions').select('*')
        .eq('section', section.key).eq('type', 'multi_blank')
      if (error || !data?.length) { setError(error?.message || 'No questions found.'); setLoading(false); return }
      const qs = shuffle(data).slice(0, 15)
      setQuestions(qs)
      setBlankOptions(buildBlankOptions(qs[0].blanks || []))
      setLoading(false)
    }
    fetch()
  }, [section.key])

  if (loading) return <div className="screen center"><div className="spinner" /></div>
  if (error)   return <div className="screen center"><p className="error-msg">{error}</p><button className="btn-secondary" onClick={onBack}>← Back</button></div>

  const q      = questions[current]
  const blanks = q.blanks || []
  const allAnswered = blanks.every(b => chosen[b.index] !== undefined)
  const allCorrect  = blanks.every(b => chosen[b.index] === b.answer)

  function handleSelect(blankIndex, optText) {
    if (submitted) return
    setChosen(c => ({ ...c, [blankIndex]: optText }))
  }

  function handleSubmit() {
    if (!allAnswered || submitted) return
    setSubmitted(true)
    if (allCorrect) setScore(s => s + 1)
  }

  function handleRetry() {
    setChosen({})
    setSubmitted(false)
  }

  async function handleNext() {
    const isLast = current + 1 >= questions.length
    if (isLast) {
      await supabase.from('sessions').insert({ student_name: studentName, section: section.key, score, total: questions.length })
      onComplete({ score, total: questions.length, studentName, section: section.key })
      return
    }
    const nextIdx = current + 1
    setCurrent(nextIdx)
    setChosen({})
    setSubmitted(false)
    setBlankOptions(buildBlankOptions(questions[nextIdx].blanks || []))
  }

  const progress = (current / questions.length) * 100

  return (
    <div className="screen quiz-screen">
      <div className="quiz-header">
        <button className="back-btn" onClick={onBack}>← Menu</button>
        <span className="progress-label">{current + 1} / {questions.length}</span>
        <span className="score-chip">✦ {score}</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

      <div className="question-card">
        <p className="question-text">{q.prompt}</p>
        {q.prompt_cn && <p className="question-cn">{q.prompt_cn}</p>}
      </div>

      <div className="blank-list">
        {blanks.map(b => {
          const opts = blankOptions[b.index] || []
          return (
            <div key={b.index} className="blank-item">
              <p className="blank-label">Blank {b.index}</p>
              <div className="options-list">
                {opts.map((opt, i) => {
                  let cls = 'option-btn'
                  if (submitted) {
                    if (opt.correct)                       cls += ' correct'
                    else if (chosen[b.index] === opt.text) cls += ' wrong'
                    else                                   cls += ' dimmed'
                  } else if (chosen[b.index] === opt.text) cls += ' correct'
                  return (
                    <button key={i} className={cls} onClick={() => handleSelect(b.index, opt.text)}>
                      <span className="opt-text">{opt.text}</span>
                      {submitted && <span className="opt-cn">{opt.cn}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {!submitted && (
        <button className="btn-primary" disabled={!allAnswered} onClick={handleSubmit}>
          Check Answers
        </button>
      )}

      {submitted && (
        <div className={`feedback-box ${allCorrect ? 'fb-correct' : 'fb-wrong'}`}>
          <p className="fb-verdict">{allCorrect ? '✅ All Correct!' : '❌ Some wrong — try again!'}</p>
          {allCorrect && q.explanation && <p className="fb-explain">{q.explanation}</p>}
          {allCorrect && q.explain_cn  && <p className="fb-explain cn">{q.explain_cn}</p>}
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
            {!allCorrect && (
              <button className="btn-secondary" style={{ flex: 1 }} onClick={handleRetry}>↩ Retry</button>
            )}
            {allCorrect && (
              <button className="btn-primary" style={{ flex: 2 }} onClick={handleNext}>
                {current + 1 >= questions.length ? 'See Results' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}