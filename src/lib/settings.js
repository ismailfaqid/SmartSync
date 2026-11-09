/**
 * Global SmartSync System Configuration
 * Manages test mode vs production approval mode.
 */

const SYSTEM_CONFIG_STORAGE_KEY = 'smartsync_system_config_v1'

export function getSystemConfig() {
  const envApproval = import.meta.env.VITE_EVENT_APPROVAL_REQUIRED
  let approvalRequired = envApproval === 'true'

  try {
    const raw = localStorage.getItem(SYSTEM_CONFIG_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed.eventApprovalRequired === 'boolean') {
        approvalRequired = parsed.eventApprovalRequired
      }
    }
  } catch (e) {
    console.error('Error reading system config:', e)
  }

  return {
    // Current testing phase default is false (events auto-published immediately)
    eventApprovalRequired: approvalRequired,
    testMode: !approvalRequired,
    maxDefaultAudioMinutes: 60,
    maxDefaultBudgetUsd: 5.00
  }
}

export function saveSystemConfig(updates) {
  try {
    const current = getSystemConfig()
    const merged = { ...current, ...updates }
    localStorage.setItem(SYSTEM_CONFIG_STORAGE_KEY, JSON.stringify(merged))
    return merged
  } catch (e) {
    console.error('Error saving system config:', e)
    return getSystemConfig()
  }
}

export function toggleEventApprovalRequired(enabled) {
  return saveSystemConfig({ eventApprovalRequired: Boolean(enabled) })
}
