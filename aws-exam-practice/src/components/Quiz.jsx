import { useState, useEffect } from 'react'
import { saveSession } from '../hooks/useQuizSession'

export default function Quiz({ questions, title, resumeState, onFinish, onQuit }) {
  const [index,    setIndex]    = useState(resumeState?.index             ?? 0)
  const [answers,  setAnswers]  = useState(resumeState?.answers            ?? [])
  const [selected, setSelected] = useState(resumeState?.currentSelected    ?? [])
  const [revealed, setRevealed] = useState(resumeState?.currentRevealed    ?? false)

  // Persist on every meaningful state change
  useEffect(() => {
    if (!questions || questions.length === 0) return
    saveSession({
      version: 1,
      title,
      questionIds: questions.map(q => q.id),
      index,
      answers,
      currentSelected: selected,
      currentRevealed: revealed,
    })
  }, [index, answers, selected, revealed, questions, title])

  if (!questions || questions.length === 0 || !questions[index]) return null

  const q        = questions[index]
  const isMulti  = q.multiSelect
  const progress = (index / questions.length) * 100

  function toggleOption(key) {
    if (revealed) return
    if (isMulti) {
      setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
    } else {
      setSelected([key])
    }
  }

  function handleCheck() {
    if (selected.length === 0) return
    setRevealed(true)
  }

  function handleBack() {
    if (index === 0) return
    const prevAnswer = answers[index - 1]
    setAnswers(prev => prev.slice(0, -1))
    setIndex(index - 1)
    setSelected(prevAnswer.selected)
    setRevealed(true)
  }

  function handleNext() {
    const correct =
      selected.length === q.answers.length &&
      q.answers.every(a => selected.includes(a))
    const newAnswers = [...answers, { selected: [...selected], correct }]
    if (index + 1 >= questions.length) {
      onFinish(newAnswers, title)
    } else {
      setAnswers(newAnswers)
      setIndex(index + 1)
      setSelected([])
      setRevealed(false)
    }
  }

  function getOptionState(key) {
    if (!revealed) return selected.includes(key) ? 'selected' : 'default'
    if (q.answers.includes(key)) return 'correct'
    if (selected.includes(key))  return 'wrong'
    return 'default'
  }

  const isCorrectAnswer =
    revealed &&
    selected.length === q.answers.length &&
    q.answers.every(a => selected.includes(a))

  const correctCount = answers.filter(a => a.correct).length

  return (
    <div className="quiz-page">
      <div className="quiz-header">
        <div className="quiz-header-left">
          <div className="quiz-title">{title}</div>
          <div className="quiz-counter">Question {index + 1} of {questions.length}</div>
        </div>
        <div className="quiz-header-right">
          {answers.length > 0 && (
            <div className="quiz-score-pill">
              {correctCount}/{answers.length} correct
            </div>
          )}
          <button className="quit-btn" onClick={onQuit}>✕ Quit</button>
        </div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="question-card">
        <div className="question-card-prism" />
        <div className="question-card-body">
          <div className="question-top">
            <span className="exam-badge">Exam {q.examNumber}</span>
            {isMulti && <span className="multi-badge">Choose {q.answers.length}</span>}
          </div>

          <h2 className="question-text">{q.question}</h2>

          <div className="options-list">
            {q.options.map(opt => {
              const state = getOptionState(opt.key)
              return (
                <button
                  key={opt.key}
                  className={`option option-${state}`}
                  onClick={() => toggleOption(opt.key)}
                  disabled={revealed}
                >
                  <span className="opt-key">{opt.key}</span>
                  <span className="opt-text">{opt.text}</span>
                  {revealed && state === 'correct' && <span className="opt-icon">✓</span>}
                  {revealed && state === 'wrong'   && <span className="opt-icon opt-icon-wrong">✗</span>}
                </button>
              )
            })}
          </div>

          {revealed && (
            <div className={`feedback ${isCorrectAnswer ? 'feedback-correct' : 'feedback-wrong'}`}>
              <div className="feedback-icon">{isCorrectAnswer ? '🎉' : '💡'}</div>
              <div className="feedback-content">
                {isCorrectAnswer
                  ? <span className="feedback-title">Correct!</span>
                  : <span className="feedback-title">Correct: {q.answers.join(', ')}</span>
                }
                {q.explanation && (
                  <p className="feedback-explanation">{q.explanation}</p>
                )}
                {q.reference && (
                  <a className="feedback-link" href={q.reference} target="_blank" rel="noreferrer">
                    View reference →
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="quiz-actions">
            {index > 0 && (
              <button className="btn-quiz-back" onClick={handleBack}>← Back</button>
            )}
            <div className="quiz-actions-spacer" />
            {!revealed ? (
              <button
                className="btn-check"
                onClick={handleCheck}
                disabled={selected.length === 0}
              >
                {isMulti && selected.length < q.answers.length
                  ? `Select ${q.answers.length - selected.length} more`
                  : 'Check Answer'
                }
              </button>
            ) : (
              <button className="btn-next" onClick={handleNext}>
                {index + 1 < questions.length ? 'Next Question →' : 'See Results →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
