import { useState } from 'react'
import { clearHistory, timeAgo } from '../hooks/useQuizSession'

export default function History({ history, onBack, onClear }) {
  const [confirmClear, setConfirmClear] = useState(false)

  function handleClear() {
    if (!confirmClear) { setConfirmClear(true); return }
    clearHistory()
    onClear()
    setConfirmClear(false)
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
              return (
                <div key={record.id} className={`history-item${record.passed ? ' hi-passed' : ' hi-failed'}`}>
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
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
