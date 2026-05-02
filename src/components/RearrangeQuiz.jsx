import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

export default function RearrangeQuiz({ section, studentName, onComplete, onBack }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent]     = useState(0)
  const [score, setScore]         = useState(0)
  const [pool, setPool]           = useState([])    // tokens not yet placed
  const [placed, setPlaced]       = useState([])    // tokens placed by student
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('questions').select('*')
        .eq('section', section.key).eq('type', 'rearrange')
      if (error || !data?.length) { setError(error?.message || 'No questions found.'); setLoading(false); return }
      const qs = shuffle(data).slice(0, 15)
      setQuestions(qs)
      initTokens(qs[0])
      setLoading(false)
    }
    fetch()
  }, [section.key])

  function initTokens(q) {
    const all = [...q.answer_tokens, ...(q.distractor_tokens || [])]
    setPool(shuffle(all.map((t, i) => ({ id: `${t}-${i}`, text: t }))))
    setPlaced([])
    setSubmitted(false)
  }

  if (loading) return <div className="screen center"><div className="spinner" /></div>
  if (error)   return <div className="screen center"><p className="error-msg">{error}</p><button className="btn-secondary" onClick={onBack}>← Back</button></div>

  const q = questions[current]

  function moveToPlaced(token) {
    if (submitted) return
    setPool(p => p.filter(t => t.id !== token.id))
    setPlaced(p => [...p, token])
  }

  function moveToPool(token) {
    if (submitted) return
    setPlaced(p => p.filter(t => t.id !== token.id))
    setPool(p => [...p, token])
  }

  function handleSubmit() {
    if (placed.length === 0 || submitted) return
    setSubmitted(true)
    const studentAnswer = placed.map(t => t.text).join(' ')
    const correctAnswer = q.answer_tokens.join(' ')
    if (studentAnswer === correctAnswer) setScore(s => s + 1)
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
    initTokens(questions[nextIdx])
  }

  const studentAnswer = placed.map(t => t.text).join(' ')
  const correctAnswer = q.answer_tokens.join(' ')
  const isCorrect     = submitted && studentAnswer === correctAnswer

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
        {q.source_sentence && <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{q.source_sentence}</p>}
        {q.source_cn && <p className="question-cn">{q.source_cn}</p>}
      </div>

      <div>
        <p className="rearrange-label">Your answer — tap to remove</p>
        <div className={`token-drop ${placed.length > 0 ? 'has-tokens' : ''}`}>
          {placed.map(token => {
            let cls = 'token'
            if (submitted) cls += correctAnswer.includes(token.text) && q.answer_tokens[placed.indexOf(token)] === token.text ? ' token-correct' : ' token-wrong'
            return <button key={token.id} className={cls} onClick={() => moveToPool(token)}>{token.text}</button>
          })}
          {placed.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tap words below to place them here</span>}
        </div>
      </div>

      <div>
        <p className="rearrange-label">Word bank — tap to add</p>
        <div className="token-pool">
          {pool.map(token => (
            <button key={token.id} className="token" onClick={() => moveToPlaced(token)}>{token.text}</button>
          ))}
          {pool.length === 0 && !submitted && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>All words placed</span>}
        </div>
      </div>

      {!submitted && (
        <button className="btn-primary" disabled={placed.length === 0} onClick={handleSubmit}>
          Check Answer
        </button>
      )}

      {submitted && (
        <div className={`feedback-box ${isCorrect ? 'fb-correct' : 'fb-wrong'}`}>
          <p className="fb-verdict">{isCorrect ? '✅ Correct!' : '❌ Wrong'}</p>
          {!isCorrect && <p className="fb-answer">Correct: <strong>{correctAnswer}</strong></p>}
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