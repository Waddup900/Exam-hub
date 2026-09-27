import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

/**
 * Vocabulary word-bank exercise. All sentences shown at once, on one
 * page, each with a blank. Word bank sits at the top. Tap a word, then
 * tap the blank you want it in (tap a filled blank to return that word
 * to the bank). Submit once, all at once — then every sentence reveals
 * correct/wrong plus the Chinese translation.
 *
 * Data shape expected per question row (type = 'vocab_drag'):
 *   prompt      — the sentence, with the blank written as "___"
 *   answer      — the correct word for that blank
 *   answer_cn   — Chinese translation of that word (shown after submit)
 *   section     — matches section.key as usual
 */
export default function VocabDragQuiz({ section, studentName, user, onComplete, onBack }) {
  const [questions, setQuestions] = useState([])
  const [bank, setBank]           = useState([])   // [{ id, word, cn }]
  const [placements, setPlacements] = useState({}) // { questionIndex: bankWordId }
  const [selectedId, setSelectedId] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true)
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('section', section.key)
        .eq('type', 'vocab_drag')

      if (error || !data?.length) {
        setError(error?.message || 'No questions found.')
        setLoading(false)
        return
      }

      const picked = shuffle(data).slice(0, 12) // keep one-page UI manageable
      setQuestions(picked)
      setBank(shuffle(picked.map((q, i) => ({ id: i, word: q.answer, cn: q.answer_cn }))))
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

  const usedIds = new Set(Object.values(placements))
  const poolWords = bank.filter(w => !usedIds.has(w.id))
  const allFilled = questions.length > 0 && Object.keys(placements).length === questions.length

  function handleWordTap(wordId) {
    if (submitted) return
    setSelectedId(prev => (prev === wordId ? null : wordId))
  }

  function handleBlankTap(qIndex) {
    if (submitted) return
    const currentlyPlaced = placements[qIndex]

    if (currentlyPlaced !== undefined) {
      // Filled — tapping it returns the word to the bank.
      setPlacements(prev => {
        const next = { ...prev }
        delete next[qIndex]
        return next
      })
      return
    }

    if (selectedId !== null) {
      setPlacements(prev => ({ ...prev, [qIndex]: selectedId }))
      setSelectedId(null)
    }
  }

  function wordTextFor(qIndex) {
    const id = placements[qIndex]
    if (id === undefined) return null
    return bank.find(w => w.id === id)?.word ?? null
  }

  function isCorrect(qIndex) {
    const placed = wordTextFor(qIndex)
    if (placed === null) return false
    return placed.trim().toLowerCase() === questions[qIndex].answer.trim().toLowerCase()
  }

  const score = submitted ? questions.filter((_, i) => isCorrect(i)).length : 0

  function handleSubmit() {
    if (!allFilled || submitted) return
    setSubmitted(true)
  }

  async function handleFinish() {
    await supabase.from('sessions').insert({
      student_id: user?.id,
      student_name: studentName,
      section: section.key,
      score,
      total: questions.length,
    })
    onComplete({ score, total: questions.length, studentName, section: section.key })
  }

  return (
    <div className="screen quiz-screen">
      <div className="quiz-header">
        <button className="back-btn" onClick={onBack}>← Menu</button>
        <span className="progress-label">{Object.keys(placements).length} / {questions.length} placed</span>
        {submitted && <span className="score-chip">✦ {score}</span>}
      </div>

      {/* Word bank */}
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
          padding: '0.9rem', marginBottom: '1rem',
          background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
        }}
      >
        {poolWords.length === 0 && !submitted && (
          <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>All words placed — check your answers below, then Submit.</span>
        )}
        {poolWords.map(w => (
          <button
            key={w.id}
            onClick={() => handleWordTap(w.id)}
            className="btn-secondary"
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              border: selectedId === w.id ? '2px solid #4f46e5' : '1px solid #4b5563',
              background: selectedId === w.id ? 'rgba(79,70,229,0.2)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            {w.word}
          </button>
        ))}
      </div>

      {/* Sentences */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {questions.map((q, i) => {
          const [before, after] = q.prompt.split('___')
          const placedWord = wordTextFor(i)
          const correct = submitted ? isCorrect(i) : null

          return (
            <div key={i} className="question-card" style={{ padding: '0.9rem 1rem' }}>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                {before}
                <button
                  onClick={() => handleBlankTap(i)}
                  disabled={submitted}
                  style={{
                    display: 'inline-block',
                    minWidth: '90px',
                    margin: '0 0.3rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    border: '1.5px dashed #6b7280',
                    background: submitted
                      ? (correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)')
                      : (placedWord ? 'rgba(79,70,229,0.15)' : 'transparent'),
                    color: 'inherit',
                    cursor: submitted ? 'default' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {placedWord ?? '____'}
                </button>
                {after}
              </p>

              {submitted && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', opacity: 0.85 }}>
                  {correct ? '✅' : '❌'} Answer: <strong>{q.answer}</strong>
                  {q.answer_cn && <span> · {q.answer_cn}</span>}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {!submitted ? (
        <button
          className="btn-primary"
          style={{ marginTop: '1.2rem' }}
          disabled={!allFilled}
          onClick={handleSubmit}
        >
          Submit
        </button>
      ) : (
        <div className="feedback-box fb-correct" style={{ marginTop: '1.2rem' }}>
          <p className="fb-verdict">Score: {score} / {questions.length}</p>
          <button className="btn-primary" onClick={handleFinish}>See Results</button>
        </div>
      )}
    </div>
  )
}
