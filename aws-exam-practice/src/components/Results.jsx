import { useState, useEffect } from 'react'
import { clearSession } from '../hooks/useQuizSession'

const R    = 50
const CIRC = 2 * Math.PI * R   // ≈ 314.16

export default function Results({ questions, answers, title, onHome, onRetryWrong }) {
  const [filter, setFilter] = useState('all')
  const [showReview, setShowReview] = useState(false)

  // Quiz is finished — wipe saved session
  useEffect(() => { clearSession() }, [])

  const correct = answers.filter(a => a.correct).length
  const total   = answers.length
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0
  const passed  = pct >= 70
  const wrong   = total - correct

  const fill = (pct / 100) * CIRC

  const filteredIdx = answers
    .map((a, i) => ({ ...a, i }))
    .filter(a => filter === 'all' ? true : filter === 'wrong' ? !a.correct : a.correct)

  return (
    <div className="results-page">
      <div className="results-hero">
        <div className="results-hero-prism" />
        <div className="results-hero-body">
          <div className="results-headline">{title}</div>
          <div className="results-subtitle">Quiz complete · {total} questions</div>

          <div className="score-ring-wrapper">
            <div className="score-ring-container">
              <svg width="140" height="140" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r={R}
                  fill="none" stroke="#e2e8f0" strokeWidth="8"
                />
                <circle
                  cx="60" cy="60" r={R}
                  fill="none"
                  stroke={passed ? '#22c55e' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${fill} ${CIRC}`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
              </svg>
              <div className="score-ring-label">
                <span className="score-ring-pct">{pct}%</span>
                <span className="score-ring-word">Score</span>
              </div>
            </div>
          </div>

          <div className="stat-row">
            <div className="stat-pill">
              <span className="stat-pill-num correct-num">{correct}</span>
              <span className="stat-pill-label">Correct</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-num wrong-num">{wrong}</span>
              <span className="stat-pill-label">Wrong</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-num">{total}</span>
              <span className="stat-pill-label">Total</span>
            </div>
          </div>

          <div className={`pass-fail-badge ${passed ? 'passed' : 'failed'}`}>
            {passed ? '🎉 PASSED' : '📚 KEEP STUDYING'} &nbsp;· 70% to pass
          </div>

          <div className="results-actions">
            <button className="btn-home" onClick={onHome}>← Home</button>
            {wrong > 0 && (
              <button className="btn-retry-wrong" onClick={onRetryWrong}>
                Retry Wrong ({wrong})
              </button>
            )}
            <button className="btn-review" onClick={() => setShowReview(v => !v)}>
              {showReview ? 'Hide Review' : 'Review Answers'}
            </button>
          </div>
        </div>
      </div>

      {showReview && (
        <div className="review-section">
          <div className="review-filters">
            {['all', 'correct', 'wrong'].map(f => (
              <button
                key={f}
                className={`filter-btn${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all'     ? `All (${total})`      :
                 f === 'correct' ? `Correct (${correct})` :
                                   `Wrong (${wrong})`}
              </button>
            ))}
          </div>

          {filteredIdx.map(({ i, selected: sel, correct: isCorrect }) => {
            const q = questions[i]
            if (!q) return null
            return (
              <div key={i} className={`review-item ${isCorrect ? 'r-correct' : 'r-wrong'}`}>
                <div className="r-header">
                  <span className="r-meta">Q{i + 1} · Exam {q.examNumber}</span>
                  <span className={`r-result-badge ${isCorrect ? 'correct' : 'wrong'}`}>
                    {isCorrect ? '✓ Correct' : '✗ Wrong'}
                  </span>
                </div>
                <div className="r-question">{q.question}</div>
                <div className="r-options">
                  {q.options.map(opt => {
                    const isAns = q.answers.includes(opt.key)
                    const wasSel = sel.includes(opt.key)
                    let cls = 'r-opt'
                    if (isAns)  cls += ' r-opt-correct'
                    else if (wasSel) cls += ' r-opt-wrong'
                    return (
                      <div key={opt.key} className={cls}>
                        <strong>{opt.key}.</strong> {opt.text}
                      </div>
                    )
                  })}
                </div>
                {!isCorrect && (
                  <div className="r-answer-note">
                    You chose: <strong>{sel.join(', ') || '—'}</strong> ·
                    Correct: <strong>{q.answers.join(', ')}</strong>
                  </div>
                )}
                {q.explanation && (
                  <a className="ex-link" href={q.explanation} target="_blank" rel="noreferrer">
                    📖 Reference →
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
