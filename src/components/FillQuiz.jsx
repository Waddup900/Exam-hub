import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

export default function FillQuiz({ section, studentName, onComplete, onBack }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent]     = useState(0)
  const [score, setScore]         = useState(0)
  const [input, setInput]         = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('questions').select('*')
        .eq('section', section.key).eq('type', 'fill')
      if (error || !data?.length) { setError(error?.message || 'No questions found.'); setLoading(false); return }
      setQuestions(shuffle(data).slice(0, 15))
      setLoading(false)
    }
    fetch()
  }, [section.key])

  if (loading) return <div className="screen center"><div className="spinner" /></div>
  if (error)   return <div className="screen center"><p className="error-msg">{error}</p><button className="btn-secondary" onClick={onBack}>← Back</button></div>

  const q = questions[current]
  const acceptable = q.acceptable_answers || [q.answer]
  const isCorrect  = submitted && acceptable.map(a => a.toLowerCase()).includes(input.trim().toLowerCase())

  function handleSubmit() {
    if (!input.trim() || submitted) return
    setSubmitted(true)
    if (acceptable.map(a => a.toLowerCase()).includes(input.trim().toLowerCase())) setScore(s => s + 1)
  }

  async function handleNext() {
    const isLast = current + 1 >= questions.length
    if (isLast) {
      await supabase.from('sessions').insert({ student_name: studentName, section: section.key, score, total: questions.length })
      onComplete({ score, total: questions.length, studentName, section: section.key })
      return
    }
    setCurrent(c => c + 1)
    setInput('')
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

      <div className="fill-input-row">
        <input
          className={`fill-input ${submitted ? (isCorrect ? 'fill-correct' : 'fill-wrong') : ''}`}
          type="text"
          placeholder="Type your answer..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={submitted}
          autoFocus
        />
        {!submitted && (
          <button className="btn-primary" style={{ width: 'auto', padding: '0 1.2rem' }} onClick={handleSubmit}>
            Check
          </button>
        )}
      </div>

      {submitted && (
        <div className={`feedback-box ${isCorrect ? 'fb-correct' : 'fb-wrong'}`}>
          <p className="fb-verdict">{isCorrect ? '✅ Correct!' : '❌ Wrong'}</p>
          {!isCorrect && <p className="fb-answer">Answer: <strong>{q.answer}</strong>{q.answer_cn && <span className="cn"> · {q.answer_cn}</span>}</p>}
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