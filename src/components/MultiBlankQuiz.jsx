import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

export default function MultiBlankQuiz({ section, studentName, onComplete, onBack }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent]     = useState(0)
  const [score, setScore]         = useState(0)
  const [chosen, setChosen]       = useState({})   // { blankIndex: optionText }
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('questions').select('*')
        .eq('section', section.key).eq('type', 'multi_blank')
      if (error || !data?.length) { setError(error?.message || 'No questions found.'); setLoading(false); return }
      setQuestions(shuffle(data).slice(0, 15))
      setLoading(false)
    }
    fetch()
  }, [section.key])

  if (loading) return <div className="screen center"><div className="spinner" /></div>
  if (error)   return <div className="screen center"><p className="error-msg">{error}</p><button className="btn-secondary" onClick={onBack}>← Back</button></div>

  const q      = questions[current]
  const blanks = q.blanks || []
  const allAnswered = blanks.every(b => chosen[b.index] !== undefined)

  function handleSelect(blankIndex, optText) {
    if (submitted) return
    setChosen(c => ({ ...c, [blankIndex]: optText }))
  }

  function handleSubmit() {
    if (!allAnswered || submitted) return
    setSubmitted(true)
    const allCorrect = blanks.every(b => chosen[b.index] === b.answer)
    if (allCorrect) setScore(s => s + 1)
  }

  async function handleNext() {
    const isLast = current + 1 >= questions.length
    if (isLast) {
      await supabase.from('sessions').insert({ student_name: studentName, section: section.key, score, total: questions.length })
      onComplete({ score, total: questions.length, studentName, section: section.key })
      return
    }
    setCurrent(c => c + 1)
    setChosen({})
    setSubmitted(false)
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
          const opts = shuffle([
            { text: b.answer, cn: b.answer_cn, correct: true },
            ...b.options.map(o => ({ text: o.t, cn: o.c, correct: false }))
          ])
          return (
            <div key={b.index} className="blank-item">
              <p className="blank-label">Blank {b.index}</p>
              <div className="options-list">
                {opts.map((opt, i) => {
                  let cls = 'option-btn'
                  if (submitted) {
                    if (opt.correct)                         cls += ' correct'
                    else if (chosen[b.index] === opt.text)   cls += ' wrong'
                    else                                     cls += ' dimmed'
                  } else if (chosen[b.index] === opt.text)   cls += ' correct'
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
        <div className={`feedback-box ${blanks.every(b => chosen[b.index] === b.answer) ? 'fb-correct' : 'fb-wrong'}`}>
          <p className="fb-verdict">{blanks.every(b => chosen[b.index] === b.answer) ? '✅ All Correct!' : '❌ Some Wrong'}</p>
          {q.explanation && <p className="fb-explain">{q.explanation}</p>}
          {q.explain_cn  && <p className="fb-explain cn">{q.explain_cn}</p>}
          <button className="btn-primary" onClick={handleNext}>
            {current + 1 >= questions.length ? 'See Results' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}