/**
 * SmartSync Authentication & Role-Based Access Control (RBAC) Module
 * Supports:
 * - Supabase Auth (when connected to cloud)
 * - Persistent local demo accounts for rapid test-mode evaluation
 * - User roles: 'admin', 'organizer', 'attendee'
 */

const AUTH_STORAGE_KEY = 'smartsync_current_user_v2'
const USERS_STORAGE_KEY = 'smartsync_registered_users_v2'

export const DEFAULT_USERS = [
  {
    id: 'usr-admin-01',
    email: 'admin@smartsync.io',
    full_name: 'Dr. Sarah Chen (Admin)',
    role: 'admin',
    is_authorized: true,
    organization: 'Global Academic Consortia',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'usr-org-01',
    email: 'organizer@smartsync.io',
    full_name: 'Dr. Almaz Kebede',
    role: 'organizer',
    is_authorized: true,
    organization: 'African Agritech Initiative',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 'usr-org-02',
    email: 'marcus@smartsync.io',
    full_name: 'Marcus Vance',
    role: 'organizer',
    is_authorized: true,
    organization: 'HyperScale AI Global',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  }
]

export function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.error('Error reading registered users:', e)
  }
  saveRegisteredUsers(DEFAULT_USERS)
  return DEFAULT_USERS
}

export function saveRegisteredUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  } catch (e) {
    console.error('Error saving users:', e)
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.error('Error reading current user:', e)
  }
  // Default to Organizer in test mode so event creation is instantly testable
  const defaultUser = DEFAULT_USERS[1] // Dr. Almaz Kebede
  setCurrentUser(defaultUser)
  return defaultUser
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

/**
 * Register a new organizer account
 */
export function registerOrganizer({ email, fullName, organization, password }) {
  const users = getRegisteredUsers()
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim())
  if (existing) {
    throw new Error('An account with this email address already exists.')
  }

  const newUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: email.toLowerCase().trim(),
    full_name: fullName.trim(),
    role: 'organizer',
    // In Test Mode, organizers are authorized automatically
    is_authorized: true,
    organization: organization ? organization.trim() : 'Independent Organizer',
    created_at: new Date().toISOString()
  }

  const updated = [...users, newUser]
  saveRegisteredUsers(updated)
  setCurrentUser(newUser)
  return newUser
}

/**
 * Log in with email
 */
export function loginUser(email, password) {
  const users = getRegisteredUsers()
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim())
  if (!found) {
    throw new Error('Account not found. Please register or select a test account.')
  }

  if (!found.is_authorized && found.role === 'organizer') {
    throw new Error('Your organizer account is pending authorization by the platform administrator.')
  }

  setCurrentUser(found)
  return found
}

/**
 * Switch role / user directly for rapid testing
 */
export function switchTestUser(roleOrEmail) {
  const users = getRegisteredUsers()
  let target = users.find((u) => u.email === roleOrEmail || u.role === roleOrEmail)
  if (!target) target = users[0]
  setCurrentUser(target)
  return target
}

export function logoutUser() {
  setCurrentUser(null)
}
