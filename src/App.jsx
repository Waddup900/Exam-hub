import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AppHeader from './components/AppHeader'
import Login from './components/Login'
import Menu from './components/Menu'
import Wallet from './components/Wallet'
import QuizShell from './components/QuizShell'
import './App.css' // <-- Ensures App.css variables and styles load globally

const SECTIONS = [
  { key: 'idioms_3',            label: 'Idioms 3',                 cn: '言语',             type: 'mcq' },
  { key: 'vocab_3',             label: 'Vocab 3',                  cn: '词语',             type: 'mcq' },
  { key: 'synonyms_3',          label: 'Synonyms 3',               cn: '同义字',           type: 'fill' },
  { key: 'phrasalverbs_take',   label: 'Phrasal Verbs (Take)',     cn: '短语动词',         type: 'mcq' },
  { key: 'phrasalverbs_look',   label: 'Phrasal Verbs (Look)',     cn: '短语动词',         type: 'mcq' },
  { key: 'grammar_conjunctions',label: 'Conjunctions',             cn: '连词',             type: 'mcq' },
  { key: 'grammar',             label: 'Grammar Practice',         cn: '语法练习',         type: 'mcq' },
  { key: 'vocab',               label: 'Vocabulary Builder',       cn: '词汇积累',         type: 'fill' },
  { key: 'cloze',               label: 'Cloze Passage',            cn: '完形填空',         type: 'cloze' },
  { key: 'reading',             label: 'Reading Comprehension',    cn: '阅读理解',         type: 'reading' },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [currentSection, setCurrentSection] = useState(null)
  const [showWallet, setShowWallet] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setUsername('')
    })

    return () => authListener.subscription?.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle()
    if (data?.username) setUsername(data.username)
  }

  function handleQuizComplete(result) {
    setLastResult(result)
    setCurrentSection(null)
  }

  if (loading) {
    return (
      <div className="app">
        <div className="screen center">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <Login onLogin={(u) => setUser(u)} />
      </div>
    )
  }

  return (
    <div className="app">
      <AppHeader
        user={user}
        username={username}
        onWalletClick={() => {
          setShowWallet(!showWallet)
          setCurrentSection(null)
          setLastResult(null)
        }}
        onLoggedOut={() => setUser(null)}
      />

      <div className="screen" style={{ paddingTop: '3.5rem' }}>
        {showWallet ? (
          <Wallet user={user} />
        ) : currentSection ? (
          <QuizShell
            section={currentSection}
            studentName={username || 'Student'}
            user={user}
            onComplete={handleQuizComplete}
            onBack={() => setCurrentSection(null)}
          />
        ) : lastResult ? (
          <div className="screen score-screen">
            <div className="score-card">
              <span className="score-name">{lastResult.studentName}</span>
              <div className="score-circle">
                <span className="score-percent">
                  {Math.round((lastResult.score / lastResult.total) * 100)}%
                </span>
                <span className="score-fraction">
                  {lastResult.score} / {lastResult.total}
                </span>
              </div>
              <p className="grade-label">Practice Completed!</p>
              <button className="btn-primary" onClick={() => setLastResult(null)}>
                Back to Menu
              </button>
            </div>
          </div>
        ) : (
          <Menu sections={SECTIONS} onSelect={(sec) => setCurrentSection(sec)} />
        )}
      </div>
    </div>
  )
}