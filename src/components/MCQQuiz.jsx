import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const QUESTIONS_PER_SESSION = 15

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

function selectQuestions(data, count) {
  const grouped = data.reduce((acc, q) => {
    if (!acc[q.answer]) acc[q.answer] = []
    acc[q.answer].push(q)
    return acc
  }, {})
  const keys = shuffle(Object.keys(grouped)).slice(0, count)
  const selected = keys.map(k => {
    const pool = grouped[k]
    return pool[Math.floor(Math.random() * pool.length)]
  })
  return shuffle(selected)
}

export default function MCQQuiz({ section, studentName, onComplete, onBack }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent]     = useState(0)
  const [score, setScore]         = useState(0)
  const [chosen, setChosen]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true)
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('section', section.key)
        .eq('type', 'mcq')

      if (error || !data?.length) {
        setError(error?.message || 'No questions found.')
        setLoading(false)
        return
      }
      setQuestions(selectQuestions(data, QUESTIONS_PER_SESSION))
      setLoading(false)
    }
    fetchQuestions()
  }, [section.key])

  if (loading) return <div className="screen center"><div className="spinner" /></div>
  if (error) return (
    <div className="screen center">
      <p className="error-msg">{error}</p>
      <button className="btn-secondary" onClick={onBack}>← Back</button>
    </div>
  )

  const q = questions[current]
  const options = q ? shuffle([
    { text: q.answer, cn: q.answer_cn, correct: true },
    ...q.options.map(o => ({ text: o.t, cn: o.c, correct: false })),
  ]) : []

  function handleAnswer(opt) {
    if (chosen) return
    setChosen(opt)
    if (opt.correct) setScore(s => s + 1)
  }

  async function handleNext() {
    const isLast = current + 1 >= questions.length
    if (isLast) {
      await supabase.from('sessions').insert({
        student_name: studentName,
        section: section.key,
        score,
        total: questions.length,
      })
      onComplete({ score, total: questions.length, studentName, section: section.key })
      return
    }
    setCurrent(c => c + 1)
    setChosen(null)
  }

  const progress = (current / questions.length) * 100

  return (
    <div className="screen quiz-screen">
      <div className="quiz-header">
        <button className="back-btn" onClick={onBack}>← Menu</button>
        <span className="progress-label">{current + 1} / {questions.length}</span>
        <span className="score-chip">✦ {score}</span>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="question-card">
        <p className="question-text">{q.prompt}</p>
        {q.prompt_cn && <p className="question-cn">{q.prompt_cn}</p>}
        {q.tip && <div className="tip-box">💡 {q.tip}</div>}
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
          {!chosen.correct && (
            <p className="fb-answer">
              Answer: <strong>{q.answer}</strong>
              {q.answer_cn && <span className="cn"> · {q.answer_cn}</span>}
            </p>
          )}
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