import { useState, useEffect } from 'react'
import Menu from './components/Menu'
import QuizShell from './components/QuizShell'
import ScoreScreen from './components/ScoreScreen'
import Login from './components/Login'
import Wallet from './components/Wallet'
import WalletBadge from './components/WalletBadge'
import { supabase } from './lib/supabaseClient'
import './App.css'

export const SECTIONS = [
  //{ key: 'idioms',                label: 'Idioms',                cn: '成语',       type: 'mcq'         },
  //{ key: 'synonyms',              label: 'Synonyms',              cn: '同义词',     type: 'fill'        },
  //{ key: 'vocab',                 label: 'Vocabulary',            cn: '词汇',       type: 'mcq'         },
 // { key: 'phrasal_verbs',         label: 'Phrasal Verbs',         cn: '短语动词',   type: 'mcq'         },
 // { key: 'language_functions',    label: 'Language Functions',    cn: '语言功能',   type: 'mcq'         },
  //{ key: 'past_perfect',          label: 'Past Perfect',          cn: '过去完成式', type: 'multi_blank' },
  //{ key: 'active_passive',        label: 'Active / Passive',      cn: '主被动语态', type: 'rearrange'   },
 // { key: 'rational_cloze',        label: 'Rational Cloze',        cn: '理性填空',   type: 'cloze'       },
 // { key: 'reading_comprehension', label: 'Reading Comprehension', cn: '阅读理解',   type: 'reading'     },
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
]

export default function App() {
  const [user, setUser]                   = useState(null)
  const [profile, setProfile]             = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const [screen, setScreen]               = useState('menu')
  const [section, setSection]             = useState(null)
  const [sessionResult, setSessionResult] = useState(null)

  // Runs ONCE when the app first opens — asks Supabase "is anyone
  // already logged in from before?" so they don't retype a password
  // every single time they open the site.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setCheckingSession(false)
    })
  }, [])

  // Once we know who's logged in, fetch their chosen username — this
  // is what replaces the old "type your name" step in QuizShell.
  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data))
  }, [user])

  function handleSelectSection(sec) {
    setSection(sec)
    setScreen('quiz')
  }

  function handleQuizComplete(result) {
    setSessionResult(result)
    setScreen('score')
  }

  function handleMenu() {
    setSection(null)
    setSessionResult(null)
    setScreen('menu')
  }

  // Still checking for an existing session — show nothing important yet.
  if (checkingSession) {
    return <p>Loading...</p>
  }

  // No logged-in user — show ONLY the login screen. Nothing below
  // this line runs until someone logs in.
  if (!user) {
    return <Login onLogin={setUser} />
  }

  return (
    <div className="app">
      <div className="app-header">
        <WalletBadge user={user} onClick={() => setScreen('wallet')} />
      </div>

      {screen === 'menu' && (
        <Menu sections={SECTIONS} onSelect={handleSelectSection} />
      )}
      {screen === 'quiz' && section && (
        <QuizShell
          section={section}
          user={user}
          studentName={profile?.username ?? ''}
          onComplete={handleQuizComplete}
          onBack={handleMenu}
        />
      )}
      {screen === 'score' && sessionResult && (
        <ScoreScreen
          result={sessionResult}
          onRetry={() => setScreen('quiz')}
          onMenu={handleMenu}
        />
      )}
      {screen === 'wallet' && (
        <div>
          <button onClick={handleMenu}>← Back</button>
          <Wallet user={user} />
        </div>
      )}
    </div>
  )
}