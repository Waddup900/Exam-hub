import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AppHeader from './components/AppHeader'
import Login from './components/Login'
import Menu from './components/Menu'
import Wallet from './components/Wallet'
import QuizShell from './components/QuizShell'

// Update these keys and types to match the exact 'section' and 'type' values in your Supabase 'questions' table
const SECTIONS = [
   //{ key: 'grammar_rule1',     label: '1 Be Verbs (Present)',   cn: '语法：is/am/are',  type: 'fill' },
  //{ key: 'grammar_rule2',     label: '2 Was/Were (Past)',      cn: '语法：was/were',   type: 'fill' },
  //{ key: 'grammar_rule3',     label: '3 Subject-Verb Agreement', cn: '语法：主谓一致', type: 'fill' },
  //{ key: 'grammar_rule4',     label: '4 Modals + Base Form',   cn: '语法：情态动词',   type: 'fill' },
  //{ key: 'grammar_rule5',     label: '5 To + Base Form',       cn: '语法：不定式',     type: 'fill' },
  //{ key: 'grammar_verbforms', label: 'Verb Forms',           cn: '动词变形',         type: 'fill' },
  { key: 'idioms_3', label: 'Idioms 3',           cn: '言语',         type: 'mcq' },
  { key: 'vocab_3', label: 'Vocab 3',           cn: '词语',         type: 'mcq' },
  { key: 'synonyms_3', label: 'Synonyms 3',           cn: '同义字',         type: 'fill' },
  { key: 'phrasalverbs_take', label: 'Phrasal Verbs (Take)',           cn: '短语动词',         type: 'mcq' },
  { key: 'phrasalverbs_look', label: 'Phrasal Verbs (Look)',           cn: '短语动词',         type: 'mcq' },
  { key: 'grammar_conjunctions', label: 'Conjunctions',           cn: '连词',         type: 'mcq' },
  { key: 'grammar', label: 'Grammar Practice', cn: '语法练习', type: 'mcq' },
  { key: 'vocab', label: 'Vocabulary Builder', cn: '词汇积累', type: 'fill' },
  { key: 'cloze', label: 'Cloze Passage', cn: '完形填空', type: 'cloze' },
  { key: 'reading', label: 'Reading Comprehension', cn: '阅读理解', type: 'reading' },
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
      <div className="screen center" style={{ color: '#fff', padding: '2rem' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />
  }

  return (
    <div style={{ background: '#0d0d12', minHeight: '100vh', color: '#fff' }}>
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

      <main style={{ padding: '1rem', paddingTop: '4.5rem' }}>
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
          <div className="screen center" style={{ textAlign: 'center', paddingTop: '2rem' }}>
            <h2>Practice Completed! 🎉</h2>
            <p style={{ margin: '1rem 0', fontSize: '1.2rem' }}>
              Score: <strong>{lastResult.score} / {lastResult.total}</strong>
            </p>
            <button className="btn-primary" onClick={() => setLastResult(null)}>
              Back to Menu
            </button>
          </div>
        ) : (
          <Menu sections={SECTIONS} onSelect={(sec) => setCurrentSection(sec)} />
        )}
      </main>
    </div>
  )
}