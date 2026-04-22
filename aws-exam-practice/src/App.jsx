import { useState, useCallback, useEffect } from 'react'
import Home from './components/Home'
import Quiz from './components/Quiz'
import Results from './components/Results'
import History from './components/History'
import { questions } from './data/questions'
import { saveSession, loadSession, clearSession, saveHistory, loadHistory } from './hooks/useQuizSession'
import './App.css'

// Build a lookup map once so restoring a session is O(1) per question
const qLookup = Object.fromEntries(questions.map(q => [q.id, q]))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function App() {
  const [view, setView] = useState('home')
  const [quizQuestions, setQuizQuestions] = useState([])
  const [userAnswers, setUserAnswers] = useState([])
  const [quizTitle, setQuizTitle] = useState('')
  // savedSession: raw session object from localStorage shown on Home
  const [savedSession, setSavedSession] = useState(null)
  // resumeState: parsed state handed to Quiz for in-flight resume
  const [resumeState, setResumeState] = useState(null)
  const [history, setHistory] = useState([])

  // Load any saved session + history on mount
  useEffect(() => {
    const s = loadSession()
    if (s) setSavedSession(s)
    setHistory(loadHistory())
  }, [])

  /** Start a brand-new quiz, overwriting any previous session. */
  const startQuiz = useCallback((qs, title) => {
    const shuffled = shuffle(qs)
    clearSession()
    const initial = {
      version: 1,
      title,
      questionIds: shuffled.map(q => q.id),
      index: 0,
      answers: [],
      currentSelected: [],
      currentRevealed: false,
    }
    saveSession(initial)
    setSavedSession(null)
    setResumeState(null)
    setQuizQuestions(shuffled)
    setQuizTitle(title)
    setUserAnswers([])
    setView('quiz')
  }, [])

  /** Restore a saved session and jump back into the quiz. */
  const resumeQuiz = useCallback(() => {
    const s = loadSession()
    if (!s) return
    const qs = s.questionIds.map(id => qLookup[id]).filter(Boolean)
    if (qs.length === 0) { clearSession(); setSavedSession(null); return }
    setQuizQuestions(qs)
    setQuizTitle(s.title)
    setResumeState({
      index: s.index,
      answers: s.answers ?? [],
      currentSelected: s.currentSelected ?? [],
      currentRevealed: s.currentRevealed ?? false,
    })
    setSavedSession(null)
    setUserAnswers([])
    setView('quiz')
  }, [])

  /** Dismiss the saved session banner and clear storage. */
  const dismissSession = useCallback(() => {
    clearSession()
    setSavedSession(null)
  }, [])

  /** Quiz finished — store final answers, append to history, go to results. */
  const finishQuiz = useCallback((answers, title) => {
    clearSession()
    setSavedSession(null)
    setUserAnswers(answers)
    const correct = answers.filter(a => a.correct).length
    const total   = answers.length
    const pct     = total > 0 ? Math.round((correct / total) * 100) : 0
    const record = {
      id: Date.now(),
      title: title ?? quizTitle,
      total,
      correct,
      pct,
      passed: pct >= 70,
      completedAt: Date.now(),
      questionIds: quizQuestions.map(q => q.id),
      answers,
    }
    saveHistory(record)
    setHistory(loadHistory())
    setView('results')
  }, [quizTitle])

  /** Go back to Home. */
  const restart = useCallback(() => {
    clearSession()
    setSavedSession(null)
    setResumeState(null)
    setQuizQuestions([])
    setUserAnswers([])
    setView('home')
  }, [])

  /** Open history view. */
  const openHistory = useCallback(() => {
    setHistory(loadHistory())
    setView('history')
  }, [])

  /** Called when user clears all history. */
  const handleHistoryCleared = useCallback(() => {
    setHistory([])
  }, [])

  /** Retry only the questions the user got wrong. */
  const retryWrong = useCallback(() => {
    const wrong = quizQuestions.filter((_, i) => userAnswers[i] && !userAnswers[i].correct)
    if (wrong.length === 0) return
    startQuiz(wrong, `Retry · ${wrong.length} Wrong`)
  }, [quizQuestions, userAnswers, startQuiz])

  return (
    <div className="app">
      {view === 'home' && (
        <Home
          onStart={startQuiz}
          savedSession={savedSession}
          onResume={resumeQuiz}
          onDismissSession={dismissSession}
          onHistory={openHistory}
          historyCount={history.length}
        />
      )}
      {view === 'history' && (
        <History
          history={history}
          onBack={restart}
          onClear={handleHistoryCleared}
        />
      )}
      {view === 'quiz' && (
        <Quiz
          questions={quizQuestions}
          title={quizTitle}
          resumeState={resumeState}
          onFinish={finishQuiz}
          onQuit={restart}
        />
      )}
      {view === 'results' && (
        <Results
          questions={quizQuestions}
          answers={userAnswers}
          title={quizTitle}
          onHome={restart}
          onRetryWrong={retryWrong}
        />
      )}
    </div>
  )
}
