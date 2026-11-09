/**
 * Admin Notifications Engine
 * Records in-app events (event creation, updates, cancellations)
 * Enables real-time notification badge, read/unread states, and action links.
 */

const NOTIFICATIONS_STORAGE_KEY = 'smartsync_admin_notifications_v1'

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-101',
    event_type: 'event_created',
    session_id: 'f3a41b55-8962-4217-91a7-17b5e406f901',
    event_title: 'Frontier AI & Satellite Telemetry for Climate-Resilient Agriculture',
    organizer_name: 'Dr. Almaz Kebede',
    presenter_name: 'Dr. Almaz Kebede',
    message: 'New seminar session created and auto-published under TEST MODE.',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'notif-102',
    event_type: 'event_created',
    session_id: 'e2b31a44-7851-3106-8096-06a4d305e890',
    event_title: 'Autonomous Systems & Low-Latency Agent Architectures',
    organizer_name: 'Marcus Vance',
    presenter_name: 'Marcus Vance',
    message: 'New seminar session created and auto-published under TEST MODE.',
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
]

export function getAdminNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    console.error('Error loading admin notifications:', e)
  }
  saveAdminNotifications(INITIAL_NOTIFICATIONS)
  return INITIAL_NOTIFICATIONS
}

export function saveAdminNotifications(notifs) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs))
  } catch (e) {
    console.error('Error saving notifications:', e)
  }
}

/**
 * Creates an admin notification and pushes to storage and Supabase
 */
export function createAdminNotification({ eventType, sessionId, eventTitle, organizerName, presenterName, customMessage }) {
  const notifs = getAdminNotifications()

  let message = customMessage
  if (!message) {
    if (eventType === 'event_created') {
      message = `New seminar "${eventTitle}" created by ${organizerName}. Auto-published with instant QR code.`
    } else if (eventType === 'event_updated') {
      message = `Seminar "${eventTitle}" details updated by ${organizerName}.`
    } else if (eventType === 'event_cancelled') {
      message = `Seminar "${eventTitle}" was cancelled or unpublished.`
    } else if (eventType === 'organizer_registered') {
      message = `New organizer account registered: ${organizerName}.`
    }
  }

  const newNotif = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    event_type: eventType,
    session_id: sessionId,
    event_title: eventTitle,
    organizer_name: organizerName,
    presenter_name: presenterName || organizerName,
    message,
    is_read: false,
    created_at: new Date().toISOString()
  }

  const updated = [newNotif, ...notifs]
  saveAdminNotifications(updated)
  return newNotif
}

export function markNotificationAsRead(id) {
  const notifs = getAdminNotifications()
  const updated = notifs.map((n) => (n.id === id ? { ...n, is_read: true } : n))
  saveAdminNotifications(updated)
  return updated
}

export function markAllNotificationsAsRead() {
  const notifs = getAdminNotifications()
  const updated = notifs.map((n) => ({ ...n, is_read: true }))
  saveAdminNotifications(updated)
  return updated
}

export function getUnreadNotificationCount() {
  const notifs = getAdminNotifications()
  return notifs.filter((n) => !n.is_read).length
}
