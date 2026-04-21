const SESSION_KEY = 'aws-ccp-quiz-session'
const HISTORY_KEY = 'aws-ccp-quiz-history'
const HISTORY_MAX = 50 // keep latest N records

/**
 * History record schema:
 * {
 *   id: number,          // Date.now() at completion
 *   title: string,
 *   total: number,
 *   correct: number,
 *   pct: number,
 *   passed: boolean,
 *   completedAt: number, // same as id
 * }
 */

export function saveHistory(record) {
  try {
    const existing = loadHistory()
    const updated = [record, ...existing].slice(0, HISTORY_MAX)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    // ignore
  }
}

/**
 * Session schema v1:
 * {
 *   version: 1,
 *   title: string,
 *   questionIds: string[],     // ordered question IDs
 *   index: number,             // current 0-based question index
 *   answers: Array<{ selected: string[], correct: boolean }>,
 *   currentSelected: string[], // selections for the in-progress question
 *   currentRevealed: boolean,
 *   savedAt: number,           // Date.now() timestamp
 * }
 */

/**
 * Persist the current quiz session to localStorage.
 * Silent-fails if storage is unavailable (quota exceeded, private browsing).
 */
export function saveSession(session) {
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...session, savedAt: Date.now() })
    )
  } catch {
    // Storage unavailable — session simply won't persist
  }
}

/**
 * Load a saved session. Returns null if nothing stored or data is corrupt.
 */
export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== 1) return null
    if (!Array.isArray(parsed.questionIds) || parsed.questionIds.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Remove the saved session.
 * Call on quiz finish, quit, or when the user dismisses the resume banner.
 */
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

/**
 * Format a unix timestamp as a human-readable "X ago" string.
 */
export function timeAgo(ts) {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}
