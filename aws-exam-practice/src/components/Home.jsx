import { useState } from 'react'
import { questions, examSummary } from '../data/questions'
import { timeAgo } from '../hooks/useQuizSession'

const MODES = [
  { id: 'all',   label: 'All Questions', desc: `${questions.length} questions shuffled from all 23 exams` },
  { id: 'exam',  label: 'By Exam',       desc: 'Pick a specific exam (50 Qs each) to focus your study' },
  { id: 'quick', label: 'Quick 20',      desc: 'Random 20 questions for a fast 5-minute review' },
  { id: 'half',  label: 'Half Exam',     desc: '32 random questions, roughly half a real exam' },
]

export default function Home({ onStart, savedSession, onResume, onDismissSession, onHistory, historyCount }) {
  const [mode, setMode] = useState('all')
  const [selectedExam, setSelectedExam] = useState(1)

  function handleStart() {
    if (mode === 'all') {
      onStart(questions, 'All 1 142 Questions')
    } else if (mode === 'exam') {
      const qs = questions.filter(q => q.examNumber === selectedExam)
      onStart(qs, `Exam ${selectedExam}`)
    } else if (mode === 'quick') {
      const pool = [...questions].sort(() => Math.random() - 0.5).slice(0, 20)
      onStart(pool, 'Quick 20')
    } else if (mode === 'half') {
      const pool = [...questions].sort(() => Math.random() - 0.5).slice(0, 32)
      onStart(pool, 'Half Exam · 32 Qs')
    }
  }

  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-hero-top">
          <div />
          <h1>AWS CCP Practice</h1>
          <button className="btn-history" onClick={onHistory}>
            📋 History{historyCount > 0 ? ` (${historyCount})` : ''}
          </button>
        </div>
        <p>Cloud Practitioner exam prep — 1 142 questions across 23 exams</p>
        <div className="home-hero-stats">
          <span className="hero-stat"><strong>{questions.length}</strong> Questions</span>
          <span className="hero-stat"><strong>23</strong> Exams</span>
          <span className="hero-stat"><strong>70%</strong> Pass mark</span>
        </div>
      </div>

      {savedSession && (
        <div className="resume-banner">
          <div className="resume-banner-icon">💾</div>
          <div className="resume-banner-info">
            <div className="resume-banner-title">Resume: {savedSession.title}</div>
            <div className="resume-banner-sub">
              <span className="resume-badge">
                {savedSession.answers?.length ?? 0} / {savedSession.questionIds?.length ?? 0} answered
              </span>
              <span>Saved {timeAgo(savedSession.savedAt)}</span>
            </div>
          </div>
          <div className="resume-banner-actions">
            <button className="btn-resume" onClick={onResume}>Resume</button>
            <button className="btn-dismiss" onClick={onDismissSession}>✕</button>
          </div>
        </div>
      )}

      <div className="section-label">Study Mode</div>
      <div className="mode-grid">
        {MODES.map(m => (
          <button
            key={m.id}
            className={`mode-card${mode === m.id ? ' active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            <span className="mode-label">{m.label}</span>
            <span className="mode-desc">{m.desc}</span>
          </button>
        ))}
      </div>

      {mode === 'exam' && (
        <div className="exam-picker">
          <div className="exam-picker-label">Select Exam</div>
          <div className="exam-grid">
            {examSummary.map(e => (
              <button
                key={e.examNumber}
                className={`exam-btn${selectedExam === e.examNumber ? ' active' : ''}`}
                onClick={() => setSelectedExam(e.examNumber)}
              >
                {e.examNumber}
                <span className="exam-count">{e.count}q</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button className="btn-start" onClick={handleStart}>
        Start Quiz →
      </button>
    </div>
  )
}
