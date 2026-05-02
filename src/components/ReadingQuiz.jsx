import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

export default function ReadingQuiz({ section, studentName, onComplete, onBack }) {
  const [passages, setPassages]   = useState([])
  const [current, setCurrent]     = useState(0)
  const [questions, setQuestions] = useState([])
  const [qIdx, setQIdx]           = useState(0)
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

      // Randomize and pick only the first one
      const selectedPassage = shuffle(pData)[0]
      setPassages([selectedPassage]) // Keeping it as a single-item array
      
      await loadQuestions(selectedPassage.id)
      setLoading(false)
    }
    fetch()
  }, [section.key])

  async function loadQuestions(passageId) {
    const { data } = await supabase
      .from('questions').select('*')
      .eq('passage_id', passageId).eq('type', 'reading')
      .order('question_order')
    setQuestions(data || [])
    setQIdx(0)
    setChosen(null)
  }

  if (loading) return <div className="screen center"><div className="spinner" /></div>
  if (error)   return <div className="screen center"><p className="error-msg">{error}</p><button className="btn-secondary" onClick={onBack}>← Back</button></div>

  const passage = passages[current]
  const q       = questions[qIdx]

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
    const isLastQ = qIdx + 1 >= questions.length

    // If there are more questions in this passage, go to next Q
    if (!isLastQ) {
      setQIdx(i => i + 1)
      setChosen(null)
      return
    }

    // Since we only have 1 passage, finishing the questions means finishing the quiz
    const totalQuestions = questions.length
    
    await supabase.from('sessions').insert({ 
      student_name: studentName, 
      section: section.key, 
      score, 
      total: totalQuestions 
    })
    
    onComplete({ 
      score, 
      total: totalQuestions, 
      studentName, 
      section: section.key 
    })
  }

  const progress = ((current * questions.length + qIdx) / (passages.length * questions.length)) * 100

  return (
    <div className="screen quiz-screen">
      <div className="quiz-header">
        <button className="back-btn" onClick={onBack}>← Menu</button>
        <span className="progress-label">Passage {current + 1}/{passages.length} · Q{qIdx + 1}/{questions.length}</span>
        <span className="score-chip">✦ {score}</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

      <div className="passage-box">
        {passage.title && <p className="passage-title">{passage.title}</p>}
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.9rem' }}>{passage.passage}</p>
      </div>

      <div className="question-card">
        <p className="question-text">{q.prompt}</p>
        {q.prompt_cn && <p className="question-cn">{q.prompt_cn}</p>}
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
            {qIdx + 1 >= questions.length && current + 1 >= passages.length ? 'See Results' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}