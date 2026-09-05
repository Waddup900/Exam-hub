import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const QUESTIONS_PER_SESSION = 15

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

function selectQuestions(data, count) {
  // If the total pool is smaller than target count, shuffle and return all
  if (data.length <= count) return shuffle(data)

  // 1. Group questions by their correct answer
  const grouped = data.reduce((acc, q) => {
    if (!acc[q.answer]) acc[q.answer] = []
    acc[q.answer].push(q)
    return acc
  }, {})

  // 2. Guarantee 1 question per unique answer key
  const selected = []
  const usedIds = new Set()

  Object.keys(grouped).forEach(key => {
    const pool = grouped[key]
    const picked = pool[Math.floor(Math.random() * pool.length)]
    selected.push(picked)
    usedIds.add(picked.id || JSON.stringify(picked)) // Track selected questions
  })

  // 3. Fill remaining quota up to 'count' from unused questions
  const remainingPool = data.filter(q => !usedIds.has(q.id || JSON.stringify(q)))
  const needed = count - selected.length

  if (needed > 0) {
    const extra = shuffle(remainingPool).slice(0, needed)
    selected.push(...extra)
  }

  // 4. Shuffle the combined selection so the order is randomized
  return shuffle(selected)
}

export default function MCQQuiz({ section, studentName, onComplete, onBack }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent]     = useState(0)
  const [score, setScore]         = useState(0)
  const [chosen, setChosen]       = useState(null)
  const [options, setOptions]     = useState([])   // fixed per question
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
      const selected = selectQuestions(data, QUESTIONS_PER_SESSION)
      setQuestions(selected)
      setOptions(buildOptions(selected[0]))
      setLoading(false)
    }
    fetchQuestions()
  }, [section.key])

  function buildOptions(q) {
    if (!q) return []
    return shuffle([
      { text: q.answer, cn: q.answer_cn, correct: true },
      ...q.options.map(o => ({ text: o.t, cn: o.c, correct: false })),
    ])
  }

  if (loading) return <div className="screen center"><div className="spinner" /></div>
  if (error) return (
    <div className="screen center">
      <p className="error-msg">{error}</p>
      <button className="btn-secondary" onClick={onBack}>← Back</button>
    </div>
  )

  const q = questions[current]

  function handleAnswer(opt) {
    if (chosen) return
    setChosen(opt)
    if (opt.correct) setScore(s => s + 1)
  }

  function handleRetry() {
    // reset answer only — score point already lost, options stay in same order
    setChosen(null)
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
    const nextIdx = current + 1
    setCurrent(nextIdx)
    setChosen(null)
    setOptions(buildOptions(questions[nextIdx]))  // fresh shuffle for next question
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

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
            {!chosen.correct && (
              <button className="btn-secondary" style={{ flex: 1 }} onClick={handleRetry}>
                ↩ Retry
              </button>
            )}
            <button className="btn-primary" style={{ flex: 2 }} onClick={handleNext}>
              {current + 1 >= questions.length ? 'See Results' : 'Next →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
