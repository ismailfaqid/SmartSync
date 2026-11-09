import { getSupabaseClient } from './supabase'

const AUTH_USER_KEY = 'smartsync_auth_user_v3'
const LOCAL_USERS_KEY = 'smartsync_users_directory_v3'

// Pre-seeded accounts for testing and verification
export const SEED_USERS = [
  {
    id: 'usr-admin-01',
    email: 'admin@smartsync.io',
    full_name: 'Dr. Sarah Chen (Admin)',
    organization_name: 'Global Academic Consortia',
    role: 'admin',
    is_authorized: true,
    is_suspended: false,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'usr-org-01',
    email: 'organizer@smartsync.io',
    full_name: 'Dr. Almaz Kebede',
    organization_name: 'African Agritech Initiative',
    role: 'organizer',
    is_authorized: true,
    is_suspended: false,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 'usr-org-02',
    email: 'marcus@smartsync.io',
    full_name: 'Marcus Vance',
    organization_name: 'HyperScale AI Global',
    role: 'organizer',
    is_authorized: true,
    is_suspended: false,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  }
]

export function getLocalUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.error('Error loading users directory:', e)
  }
  saveLocalUsers(SEED_USERS)
  return SEED_USERS
}

export function saveLocalUsers(users) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
  } catch (e) {
    console.error('Error saving users directory:', e)
  }
}

/**
 * Returns currently authenticated user session
 */
export function getCurrentSession() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.error('Error getting current session:', e)
  }
  // Default to Dr. Almaz Kebede in testing so organizer actions are immediately active
  const defaultUser = SEED_USERS[1]
  setCurrentSession(defaultUser)
  return defaultUser
}

export function setCurrentSession(user) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(AUTH_USER_KEY)
  }
}

/**
 * Organizer Registration (collects full_name, organization_name, email, password)
 * Automatically activates accounts in TEST MODE.
 */
export async function signUpOrganizer({ email, password, fullName, organizationName }) {
  const cleanEmail = email.trim().toLowerCase()
  const cleanName = fullName.trim()
  const cleanOrg = organizationName.trim()

  if (!cleanEmail || !password || !cleanName || !cleanOrg) {
    throw new Error('Please fill in all required registration fields.')
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }

  const supabase = getSupabaseClient()
  let supabaseUser = null

  // 1. Supabase Auth Integration
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            organization_name: cleanOrg,
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }
      supabaseUser = data.user
    } catch (err) {
      console.warn('Supabase Auth signUp notice:', err.message)
      // Continue to local directory if offline or demo
    }
  }

  // 2. Synchronize Local Profiles Store
  const users = getLocalUsers()
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error('An organizer account with this email address already exists.')
  }

  const newProfile = {
    id: supabaseUser?.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: cleanEmail,
    full_name: cleanName,
    organization_name: cleanOrg,
    role: 'organizer', // Public registration is strictly organizer; never admin
    is_authorized: true, // Auto-activated for test mode
    is_suspended: false,
    created_at: new Date().toISOString()
  }

  const updatedUsers = [...users, newProfile]
  saveLocalUsers(updatedUsers)
  setCurrentSession(newProfile)

  return newProfile
}

/**
 * Sign In User with role verification & account suspension guard
 * @param {string} email
 * @param {string} password
 * @param {string} requiredRole - 'admin' or 'organizer'
 */
export async function signInUser({ email, password, requiredRole }) {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail || !password) {
    throw new Error('Please enter your email and password.')
  }

  const supabase = getSupabaseClient()
  let supabaseAuthSuccess = false

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })
      if (!error && data.user) {
        supabaseAuthSuccess = true
      }
    } catch (err) {
      console.warn('Supabase Auth sign-in notice:', err.message)
    }
  }

  // Locate profile
  const users = getLocalUsers()
  const profile = users.find((u) => u.email.toLowerCase() === cleanEmail)

  if (!profile && !supabaseAuthSuccess) {
    throw new Error('Account not found. Please verify your credentials or register.')
  }

  const activeProfile = profile || {
    id: `usr-${Date.now()}`,
    email: cleanEmail,
    full_name: 'Verified User',
    organization_name: 'Partner Institution',
    role: 'organizer',
    is_authorized: true,
    is_suspended: false
  }

  // Account Suspension Check
  if (activeProfile.is_suspended) {
    throw new Error('Account Suspended: Your access has been deactivated by the system administrator.')
  }

  // Role Gate Verification: Reject unauthorized access to admin portal
  if (requiredRole === 'admin' && activeProfile.role !== 'admin') {
    throw new Error('Access Denied: This administrative portal is restricted to authorized platform administrators only.')
  }

  setCurrentSession(activeProfile)
  return activeProfile
}

/**
 * Password Reset trigger
 */
export async function resetPasswordForUser(email) {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail) throw new Error('Please enter your email address.')

  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw new Error(error.message)
    } catch (e) {
      console.warn('Supabase password reset notice:', e.message)
    }
  }

  return true
}

/**
 * Sign Out
 */
export async function signOutUser() {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      // ignore
    }
  }
  setCurrentSession(null)
}

/**
 * Admin action: toggle user suspension
 */
export function toggleUserSuspension(userId, shouldSuspend) {
  const users = getLocalUsers()
  const updated = users.map((u) => {
    if (u.id === userId) {
      // Prevent suspending root admin
      if (u.role === 'admin') return u
      return { ...u, is_suspended: shouldSuspend }
    }
    return u
  })
  saveLocalUsers(updated)
  return updated
}

/**
 * Admin action: toggle organizer authorization
 */
export function toggleUserAuthorization(userId, isAuthorized) {
  const users = getLocalUsers()
  const updated = users.map((u) => {
    if (u.id === userId) {
      return { ...u, is_authorized: isAuthorized }
    }
    return u
  })
  saveLocalUsers(updated)
  return updated
}
