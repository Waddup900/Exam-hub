import { useState } from 'react'
import Menu from './components/Menu'
import QuizShell from './components/QuizShell'
import ScoreScreen from './components/ScoreScreen'
import './App.css'

export const SECTIONS = [
  { key: 'idioms',                label: 'Idioms',                cn: '成语',       type: 'mcq'         },
  { key: 'synonyms',              label: 'Synonyms',              cn: '同义词',     type: 'fill'        },
  { key: 'vocab',                 label: 'Vocabulary',            cn: '词汇',       type: 'mcq'         },
  { key: 'phrasal_verbs',         label: 'Phrasal Verbs',         cn: '短语动词',   type: 'mcq'         },
  { key: 'language_functions',    label: 'Language Functions',    cn: '语言功能',   type: 'mcq'         },
  { key: 'past_perfect',          label: 'Past Perfect',          cn: '过去完成式', type: 'multi_blank' },
  { key: 'active_passive',        label: 'Active / Passive',      cn: '主被动语态', type: 'rearrange'   },
  { key: 'rational_cloze',        label: 'Rational Cloze',        cn: '理性填空',   type: 'cloze'       },
  { key: 'reading_comprehension', label: 'Reading Comprehension', cn: '阅读理解',   type: 'reading'     },
]

export default function App() {
  const [screen, setScreen]               = useState('menu')
  const [section, setSection]             = useState(null)
  const [sessionResult, setSessionResult] = useState(null)

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

  return (
    <div className="app">
      {screen === 'menu' && (
        <Menu sections={SECTIONS} onSelect={handleSelectSection} />
      )}
      {screen === 'quiz' && section && (
        <QuizShell
          section={section}
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
    </div>
  )
}