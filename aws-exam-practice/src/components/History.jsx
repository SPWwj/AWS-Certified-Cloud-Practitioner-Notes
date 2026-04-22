import { useState } from 'react'
import { clearHistory, timeAgo } from '../hooks/useQuizSession'
import { questions } from '../data/questions'

const qLookup = Object.fromEntries(questions.map(q => [q.id, q]))

export default function History({ history, onBack, onClear }) {
  const [confirmClear, setConfirmClear] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [filter, setFilter] = useState({})

  function handleClear() {
    if (!confirmClear) { setConfirmClear(true); return }
    clearHistory()
    onClear()
    setConfirmClear(false)
  }

  function toggleExpand(id) {
    setExpandedId(prev => prev === id ? null : id)
  }

  function setRecordFilter(id, f) {
    setFilter(prev => ({ ...prev, [id]: f }))
  }

  // Aggregate stats from history
  const totalAttempts = history.length
  const avgPct = totalAttempts
    ? Math.round(history.reduce((s, r) => s + r.pct, 0) / totalAttempts)
    : 0
  const passCount = history.filter(r => r.passed).length
  const bestPct   = totalAttempts ? Math.max(...history.map(r => r.pct)) : 0

  return (
    <div className="history-page">
      <div className="history-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h1 className="history-title">Quiz History</h1>
        {totalAttempts > 0 && (
          <button
            className={`btn-clear-history${confirmClear ? ' confirm' : ''}`}
            onClick={handleClear}
            onBlur={() => setConfirmClear(false)}
          >
            {confirmClear ? 'Confirm clear?' : 'Clear all'}
          </button>
        )}
      </div>

      {totalAttempts === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">📋</div>
          <div className="history-empty-text">No quiz history yet.</div>
          <div className="history-empty-sub">Complete a quiz to see your results here.</div>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="history-summary">
            <div className="history-summary-prism" />
            <div className="history-summary-body">
              <div className="hs-stat-row">
                <div className="hs-stat">
                  <span className="hs-stat-num">{totalAttempts}</span>
                  <span className="hs-stat-label">Attempts</span>
                </div>
                <div className="hs-stat">
                  <span className="hs-stat-num">{avgPct}%</span>
                  <span className="hs-stat-label">Avg Score</span>
                </div>
                <div className="hs-stat">
                  <span className="hs-stat-num" style={{ color: 'var(--green)' }}>{bestPct}%</span>
                  <span className="hs-stat-label">Best Score</span>
                </div>
                <div className="hs-stat">
                  <span className="hs-stat-num" style={{ color: 'var(--green)' }}>{passCount}</span>
                  <span className="hs-stat-label">Passed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Record list */}
          <div className="history-list">
            {history.map((record, idx) => {
              const rank = idx + 1
              const isExpanded = expandedId === record.id
              const hasDetail = record.questionIds && record.answers
              const activeFilter = filter[record.id] || 'all'

              // Build question+answer pairs for review
              const reviewItems = hasDetail
                ? record.questionIds.map((qid, i) => ({
                    q: qLookup[qid],
                    answer: record.answers[i],
                    i,
                  })).filter(x => x.q && x.answer)
                : []

              const filtered = reviewItems.filter(({ answer }) => {
                if (activeFilter === 'correct') return answer.correct
                if (activeFilter === 'wrong') return !answer.correct
                return true
              })

              return (
                <div key={record.id} className="history-record">
                  <div
                    className={`history-item${record.passed ? ' hi-passed' : ' hi-failed'}${hasDetail ? ' hi-clickable' : ''}`}
                    onClick={() => hasDetail && toggleExpand(record.id)}
                  >
                    <div className="hi-rank">#{rank}</div>
                    <div className="hi-main">
                      <div className="hi-title">{record.title}</div>
                      <div className="hi-meta">
                        {record.correct}/{record.total} correct
                        <span className="hi-dot">·</span>
                        {timeAgo(record.completedAt)}
                      </div>
                    </div>
                    <div className="hi-right">
                      <div className={`hi-pct${record.passed ? ' hi-pct-pass' : ' hi-pct-fail'}`}>
                        {record.pct}%
                      </div>
                      <div className={`hi-badge${record.passed ? ' passed' : ' failed'}`}>
                        {record.passed ? 'PASS' : 'FAIL'}
                      </div>
                    </div>
                    {hasDetail && (
                      <div className={`hi-chevron${isExpanded ? ' expanded' : ''}`}>›</div>
                    )}
                  </div>

                  {isExpanded && hasDetail && (
                    <div className="hi-detail">
                      <div className="hi-detail-filters">
                        {['all', 'correct', 'wrong'].map(f => (
                          <button
                            key={f}
                            className={`filter-btn${activeFilter === f ? ' active' : ''}`}
                            onClick={e => { e.stopPropagation(); setRecordFilter(record.id, f) }}
                          >
                            {f === 'all'     ? `All (${reviewItems.length})` :
                             f === 'correct' ? `Correct (${reviewItems.filter(x => x.answer.correct).length})` :
                                              `Wrong (${reviewItems.filter(x => !x.answer.correct).length})`}
                          </button>
                        ))}
                      </div>
                      <div className="hi-detail-list">
                        {filtered.map(({ q, answer, i }) => {
                          const sel = answer.selected ?? []
                          return (
                            <div key={i} className={`review-item ${answer.correct ? 'r-correct' : 'r-wrong'}`}>
                              <div className="r-header">
                                <span className="r-meta">Q{i + 1} · Exam {q.examNumber}</span>
                                <span className={`r-result-badge ${answer.correct ? 'correct' : 'wrong'}`}>
                                  {answer.correct ? '✓ Correct' : '✗ Wrong'}
                                </span>
                              </div>
                              <div className="r-question">{q.question}</div>
                              <div className="r-options">
                                {q.options.map(opt => {
                                  const isAns = q.answers.includes(opt.key)
                                  const wasSel = sel.includes(opt.key)
                                  let cls = 'r-opt'
                                  if (isAns) cls += ' r-opt-correct'
                                  else if (wasSel) cls += ' r-opt-wrong'
                                  return (
                                    <div key={opt.key} className={cls}>
                                      <strong>{opt.key}.</strong> {opt.text}
                                    </div>
                                  )
                                })}
                              </div>
                              {!answer.correct && (
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
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
