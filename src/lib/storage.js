import { DEFAULT_SESSIONS } from './mockSeminars'
import { broadcastNoteLocally } from './supabase'
import { getSystemConfig } from './settings'
import { createAdminNotification } from './notifications'

const SESSIONS_STORAGE_KEY = 'smartsync_sessions_v3'
const OPENAI_KEY_STORAGE = 'smartsync_openai_api_key'
const ACTIVE_SESSION_STORAGE_KEY = 'smartsync_active_session_id'

export function getStoredSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.error('Error loading sessions from storage:', e)
  }
  saveSessions(DEFAULT_SESSIONS)
  return DEFAULT_SESSIONS
}

export function saveSessions(sessions) {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
  } catch (e) {
    console.error('Error saving sessions:', e)
  }
}

export function getStoredActiveSessionId() {
  const stored = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
  if (stored) return stored
  const sessions = getStoredSessions()
  return sessions[0]?.id || ''
}

export function setStoredActiveSessionId(id) {
  localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, id)
}

/**
 * Creates a new seminar session with Test Mode auto-publishing or production approval workflow
 */
export function createSeminarSession({
  title,
  speakerName,
  speakerRole,
  organizerId,
  organizerName,
  scheduleTime,
  location,
  description,
  sponsorName,
  sponsorLogoUrl,
  customShortCode,
  maxAudioMinutes = 60,
  maxBudgetUsd = 5.00
}) {
  const sessions = getStoredSessions()
  const { eventApprovalRequired } = getSystemConfig()

  // Generate clean slug for short_code
  let shortCode = (customShortCode || title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 28)

  if (!shortCode) shortCode = `seminar-${Date.now().toString(36)}`

  // Ensure unique short code
  let uniqueCode = shortCode
  let counter = 1
  while (sessions.some((s) => s.short_code.toLowerCase() === uniqueCode.toLowerCase())) {
    uniqueCode = `${shortCode}-${counter}`
    counter++
  }

  // Determine initial status based on EVENT_APPROVAL_REQUIRED setting
  const isAutoPublished = !eventApprovalRequired
  const status = isAutoPublished ? 'published' : 'pending_approval'
  const isActive = isAutoPublished
  const isApproved = isAutoPublished

  const newSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: title.trim(),
    speaker_name: speakerName.trim(),
    speaker_role: speakerRole ? speakerRole.trim() : '',
    organizer_id: organizerId || 'usr-org-01',
    organizer_name: organizerName || 'Event Organizer',
    schedule_time: scheduleTime || new Date().toISOString(),
    location: location ? location.trim() : 'Live Virtual Seminar',
    description: description ? description.trim() : 'Live lecture session and real-time knowledge synthesis.',
    sponsor_name: sponsorName ? sponsorName.trim() : '',
    sponsor_logo_url: sponsorLogoUrl || '/assets/sponsor_quantum_logo.jpg',
    short_code: uniqueCode,
    status,
    is_active: isActive,
    is_approved: isApproved,
    attendee_count: 0,
    max_audio_minutes: Number(maxAudioMinutes),
    audio_minutes_used: 0,
    max_budget_usd: Number(maxBudgetUsd),
    cost_usd_accumulated: 0,
    created_at: new Date().toISOString(),
    initial_notes: []
  }

  const updatedSessions = [newSession, ...sessions]
  saveSessions(updatedSessions)

  // Notify admin in-app
  createAdminNotification({
    eventType: 'event_created',
    sessionId: newSession.id,
    eventTitle: newSession.title,
    organizerName: newSession.organizer_name,
    presenterName: newSession.speaker_name,
    customMessage: isAutoPublished
      ? `New event "${newSession.title}" published automatically in TEST MODE.`
      : `New event "${newSession.title}" submitted and awaiting admin approval.`
  })

  return newSession
}

/**
 * Updates seminar status (published, completed, cancelled, pending_approval)
 * Unpublishing immediately sets is_active = false to block public access
 */
export function updateSessionStatus(sessionId, newStatus, reason = '') {
  const sessions = getStoredSessions()
  const idx = sessions.findIndex((s) => s.id === sessionId || s.short_code === sessionId)
  if (idx === -1) return null

  const target = sessions[idx]
  const isNowActive = newStatus === 'published'

  sessions[idx] = {
    ...target,
    status: newStatus,
    is_active: isNowActive,
    is_approved: newStatus === 'published' ? true : target.is_approved
  }

  saveSessions(sessions)

  // Create admin notification
  createAdminNotification({
    eventType: newStatus === 'cancelled' ? 'event_cancelled' : 'event_updated',
    sessionId: target.id,
    eventTitle: target.title,
    organizerName: target.organizer_name,
    presenterName: target.speaker_name,
    customMessage: `Seminar "${target.title}" status changed to ${newStatus.toUpperCase()}${reason ? ` (${reason})` : ''}.`
  })

  return sessions[idx]
}

/**
 * Content similarity check to prevent duplicate notes
 */
function isDuplicateNote(existingNotes, heading, bullets) {
  if (!existingNotes || existingNotes.length === 0) return false

  const newHeadingNorm = (heading || '').toLowerCase().trim()
  const newBulletsNorm = (bullets || []).join(' ').toLowerCase().trim()

  const recentNotes = existingNotes.slice(-3)
  for (const prev of recentNotes) {
    const prevHeadingNorm = (prev.heading || '').toLowerCase().trim()
    const prevBulletsNorm = (prev.bullet_points || []).join(' ').toLowerCase().trim()

    if (prevHeadingNorm === newHeadingNorm && prevBulletsNorm === newBulletsNorm) return true

    if (newBulletsNorm && prevBulletsNorm) {
      const newTokens = new Set(newBulletsNorm.split(/\s+/))
      const prevTokens = new Set(prevBulletsNorm.split(/\s+/))
      let common = 0
      newTokens.forEach((token) => {
        if (prevTokens.has(token)) common++
      })
      const similarity = common / Math.max(newTokens.size, prevTokens.size)
      if (similarity > 0.9) return true
    }
  }

  return false
}

export function appendNoteToSession(sessionId, note) {
  const sessions = getStoredSessions()
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId || s.short_code === sessionId)

  if (sessionIndex === -1) {
    console.warn(`Session ${sessionId} not found`)
    return null
  }

  const session = sessions[sessionIndex]

  // Enforce status check: cannot add notes to cancelled or unpublished sessions
  if (session.status === 'cancelled' || !session.is_active) {
    console.warn(`Cannot add notes to inactive or cancelled session ${sessionId}`)
    return null
  }

  const existingNotes = session.initial_notes || []
  const bulletPoints = Array.isArray(note.bullet_points) ? note.bullet_points : [note.bullet_points]
  const heading = note.heading || 'Key Discussion Takeaways'

  if (isDuplicateNote(existingNotes, heading, bulletPoints)) {
    console.log(`[Deduplication] Dropped duplicate note: "${heading}"`)
    return null
  }

  const maxSeq = existingNotes.reduce((max, n) => Math.max(max, n.sequence_number || 0), 0)
  const nextSeq = note.sequence_number ? note.sequence_number : maxSeq + 1
  const idempotencyHash = note.idempotency_hash || `hash_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`

  const formattedNote = {
    id: note.id || `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    session_id: session.id,
    sequence_number: nextSeq,
    idempotency_hash: idempotencyHash,
    heading,
    bullet_points: bulletPoints,
    timestamp_marker: note.timestamp_marker || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    created_at: note.created_at || new Date().toISOString()
  }

  const updatedNotes = [...existingNotes, formattedNote].sort((a, b) => a.sequence_number - b.sequence_number)
  sessions[sessionIndex].initial_notes = updatedNotes
  saveSessions(sessions)

  broadcastNoteLocally(session.id, formattedNote)
  return formattedNote
}

export function clearSessionNotes(sessionId) {
  const sessions = getStoredSessions()
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId || s.short_code === sessionId)
  if (sessionIndex === -1) return []

  sessions[sessionIndex].initial_notes = []
  sessions[sessionIndex].audio_minutes_used = 0
  sessions[sessionIndex].cost_usd_accumulated = 0
  saveSessions(sessions)
  return []
}

export function recordAudioUsage(sessionId, secondsDuration, estCostUsd) {
  const sessions = getStoredSessions()
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId || s.short_code === sessionId)
  if (sessionIndex === -1) return null

  const s = sessions[sessionIndex]
  const additionalMinutes = Number((secondsDuration / 60).toFixed(2))
  const newMinutesUsed = Number(((s.audio_minutes_used || 0) + additionalMinutes).toFixed(2))
  const newCostUsed = Number(((s.cost_usd_accumulated || 0) + estCostUsd).toFixed(3))

  sessions[sessionIndex].audio_minutes_used = newMinutesUsed
  sessions[sessionIndex].cost_usd_accumulated = newCostUsed
  saveSessions(sessions)

  return {
    minutesUsed: newMinutesUsed,
    costUsed: newCostUsed,
    maxMinutes: s.max_audio_minutes || 60,
    maxBudget: s.max_budget_usd || 5.00,
    isExceeded: newMinutesUsed >= (s.max_audio_minutes || 60) || newCostUsed >= (s.max_budget_usd || 5.00),
    isApproachingLimit: newMinutesUsed >= (s.max_audio_minutes || 60) * 0.8 || newCostUsed >= (s.max_budget_usd || 5.00) * 0.8
  }
}

export function updateSessionQuotaLimits(sessionId, newMaxMinutes, newMaxBudgetUsd) {
  const sessions = getStoredSessions()
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId || s.short_code === sessionId)
  if (sessionIndex === -1) return null

  sessions[sessionIndex].max_audio_minutes = Number(newMaxMinutes)
  sessions[sessionIndex].max_budget_usd = Number(newMaxBudgetUsd)
  saveSessions(sessions)
  return sessions[sessionIndex]
}

export function getSessionQuotaStatus(sessionId) {
  const sessions = getStoredSessions()
  const s = sessions.find((item) => item.id === sessionId || item.short_code === sessionId)
  if (!s) return null

  const minutesUsed = s.audio_minutes_used || 0
  const maxMinutes = s.max_audio_minutes || 60
  const costUsed = s.cost_usd_accumulated || 0
  const maxBudget = s.max_budget_usd || 5.00

  const minutePercent = Math.min(100, Math.round((minutesUsed / maxMinutes) * 100))
  const costPercent = Math.min(100, Math.round((costUsed / maxBudget) * 100))

  return {
    minutesUsed,
    maxMinutes,
    minutePercent,
    costUsed,
    maxBudget,
    costPercent,
    isExceeded: minutesUsed >= maxMinutes || costUsed >= maxBudget,
    isApproachingLimit: minutePercent >= 80 || costPercent >= 80,
  }
}

export function getOpenAIKey() {
  const envKey = import.meta.env?.VITE_OPENAI_API_KEY
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(OPENAI_KEY_STORAGE) : ''
  return (localKey && localKey.trim()) || (envKey && envKey.trim()) || ''
}

export function setOpenAIKey(key) {
  if (key) localStorage.setItem(OPENAI_KEY_STORAGE, key.trim())
  else localStorage.removeItem(OPENAI_KEY_STORAGE)
}

export function resetToDefaultData() {
  localStorage.removeItem(SESSIONS_STORAGE_KEY)
  saveSessions(DEFAULT_SESSIONS)
  return DEFAULT_SESSIONS
}
