import React, { useState } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Calendar,
  Bell,
  CheckCircle,
  XCircle,
  Eye,
  Sliders,
  Search,
  Filter,
  Check,
  Radio,
  ExternalLink,
  Ban,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../lib/notifications'
import { getRegisteredUsers, saveRegisteredUsers } from '../lib/auth'
import { updateSessionStatus } from '../lib/storage'
import { getSystemConfig, saveSystemConfig } from '../lib/settings'

export default function AdminDashboard({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onRefreshData
}) {
  if (!isOpen) return null

  const [activeTab, setActiveTab] = useState('events') // 'events' | 'notifications' | 'users' | 'settings'
  const [notifications, setNotifications] = useState(() => getAdminNotifications())
  const [users, setUsers] = useState(() => getRegisteredUsers())
  const [systemConfig, setSystemConfig] = useState(() => getSystemConfig())
  const [eventFilter, setEventFilter] = useState('all') // 'all' | 'published' | 'cancelled' | 'pending_approval'
  const [searchQuery, setSearchQuery] = useState('')

  const handleToggleApprovalSetting = (enabled) => {
    const updated = saveSystemConfig({ eventApprovalRequired: enabled })
    setSystemConfig(updated)
  }

  const handleUnpublishOrCancelEvent = (sessionId, currentStatus) => {
    const action = currentStatus === 'cancelled' ? 're-publish' : 'unpublish / cancel'
    if (window.confirm(`Are you sure you want to ${action} this seminar? Unpublishing will immediately block public attendee access to the event and its live notes.`)) {
      const nextStatus = currentStatus === 'cancelled' ? 'published' : 'cancelled'
      updateSessionStatus(sessionId, nextStatus, 'Admin Moderation Action')
      if (onRefreshData) onRefreshData()
      setNotifications(getAdminNotifications())
    }
  }

  const handleApproveEvent = (sessionId) => {
    updateSessionStatus(sessionId, 'published', 'Admin Approved Event')
    if (onRefreshData) onRefreshData()
    setNotifications(getAdminNotifications())
  }

  const handleMarkNotifRead = (id) => {
    const updated = markNotificationAsRead(id)
    setNotifications(updated)
  }

  const handleMarkAllRead = () => {
    const updated = markAllNotificationsAsRead()
    setNotifications(updated)
  }

  const handleToggleUserAuth = (userId) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        return { ...u, is_authorized: !u.is_authorized }
      }
      return u
    })
    setUsers(updated)
    saveRegisteredUsers(updated)
  }

  // Filtered events
  const filteredEvents = sessions.filter((s) => {
    if (eventFilter !== 'all' && s.status !== eventFilter) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.speaker_name.toLowerCase().includes(q) ||
      (s.organizer_name && s.organizer_name.toLowerCase().includes(q)) ||
      s.short_code.toLowerCase().includes(q)
    )
  })

  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[88vh] rounded-3xl border border-slate-800 bg-[#090e1a] shadow-2xl flex flex-col overflow-hidden">
        {/* Dashboard Top Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  SmartSync Admin Command Center
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  ROOT ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Oversee seminar events, moderate live feeds, manage organizer authorizations, and configure platform approval policies.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Exit Dashboard
          </button>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2 flex-shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'events'
                  ? 'border-emerald-400 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Event Monitoring &amp; Moderation</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
                {sessions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'notifications'
                  ? 'border-emerald-400 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>Admin Notifications</span>
              {unreadNotifsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'users'
                  ? 'border-emerald-400 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Organizer Management</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'settings'
                  ? 'border-emerald-400 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Approval Settings (Test Mode)</span>
            </button>
          </div>
        </div>

        {/* Dashboard Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: EVENT MONITORING & MODERATION */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full sm:max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by topic, speaker, organizer, slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  {['all', 'published', 'pending_approval', 'cancelled'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setEventFilter(tab)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                        eventFilter === tab
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab === 'all' ? 'All Events' : tab.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Events Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/50 shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px]">
                      <th className="p-3.5">Seminar Event</th>
                      <th className="p-3.5">Presenter &amp; Organizer</th>
                      <th className="p-3.5">Schedule</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          No events found matching this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((evt) => {
                        const isPublished = evt.status === 'published' && evt.is_active
                        const isPending = evt.status === 'pending_approval'
                        const isCancelled = evt.status === 'cancelled' || !evt.is_active

                        return (
                          <tr key={evt.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3.5">
                              <span className="font-bold text-white block truncate max-w-xs">
                                {evt.title}
                              </span>
                              <span className="font-mono text-[11px] text-emerald-400">
                                #{evt.short_code}
                              </span>
                            </td>

                            <td className="p-3.5">
                              <span className="text-slate-200 font-semibold block">
                                {evt.speaker_name}
                              </span>
                              <span className="text-slate-400 text-[11px] block">
                                Org: {evt.organizer_name || 'Dr. Almaz Kebede'}
                              </span>
                            </td>

                            <td className="p-3.5 font-mono text-[11px] text-slate-400">
                              {evt.schedule_time ? new Date(evt.schedule_time).toLocaleDateString() : 'Live'}
                            </td>

                            <td className="p-3.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                                  isPublished
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                    : isPending
                                    ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {evt.status}
                              </span>
                            </td>

                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isPending && (
                                  <button
                                    onClick={() => handleApproveEvent(evt.id)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve &amp; Publish</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleUnpublishOrCancelEvent(evt.id, evt.status)}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                                    isCancelled
                                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                      : 'bg-rose-950/80 border border-rose-500/40 hover:bg-rose-900 text-rose-300'
                                  }`}
                                >
                                  {isCancelled ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                  <span>{isCancelled ? 'Re-Publish' : 'Unpublish / Cancel'}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    if (onSelectSession) onSelectSession(evt.id)
                                    onClose()
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                                  title="Open Session"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: IN-APP ADMIN NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Event Audit &amp; Activity Notifications</h3>
                  <p className="text-xs text-slate-400">
                    In-app alerts received when organizers create, update, or cancel live seminars.
                  </p>
                </div>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mark All Read</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No notifications recorded yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                        !notif.is_read
                          ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                          : 'bg-slate-950/60 border-slate-800/80 opacity-80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl mt-0.5 ${
                            notif.event_type === 'event_cancelled'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">
                              {notif.event_title}
                            </span>
                            {!notif.is_read && (
                              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[9px] font-bold uppercase">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1.5">
                            <span>Organizer: {notif.organizer_name}</span>
                            <span>·</span>
                            <span>{new Date(notif.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notif.is_read && (
                          <button
                            onClick={() => handleMarkNotifRead(notif.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold"
                          >
                            Mark Read
                          </button>
                        )}
                        {notif.session_id && (
                          <button
                            onClick={() => {
                              if (onSelectSession) onSelectSession(notif.session_id)
                              onClose()
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400 hover:bg-slate-700 transition-colors"
                            title="Inspect Seminar"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: USER & ORGANIZER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Authorized Organizers &amp; Accounts</h3>
                <p className="text-xs text-slate-400">
                  Manage registered organizers who hold permission to create seminars and stream podium audio.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px]">
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Organization</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Authorization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-white block">{u.full_name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{u.email}</span>
                        </td>
                        <td className="p-3.5 text-slate-300">{u.organization || 'Independent'}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                            u.is_authorized ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {u.is_authorized ? <ShieldCheck className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            <span>{u.is_authorized ? 'Authorized' : 'Pending'}</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleUserAuth(u.id)}
                              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                u.is_authorized
                                  ? 'bg-rose-950/80 text-rose-300 hover:bg-rose-900'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
                              }`}
                            >
                              {u.is_authorized ? 'Revoke Access' : 'Authorize Organizer'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM SETTINGS & APPROVAL TOGGLE */}
          {activeTab === 'settings' && (
            <div className="space-y-5 max-w-2xl">
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Event Approval Requirement Toggle</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Controls whether newly created seminar sessions require manual admin approval before publication.
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                    !systemConfig.eventApprovalRequired
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                  }`}>
                    {!systemConfig.eventApprovalRequired ? 'TEST MODE (BYPASS)' : 'PRODUCTION MODE'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Require Admin Approval Before Publishing
                      </span>
                      <span className="text-[11px] text-slate-400">
                        When disabled (false), events publish immediately and generate live QR codes for instant testing.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleApprovalSetting(!systemConfig.eventApprovalRequired)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        systemConfig.eventApprovalRequired ? 'bg-indigo-600' : 'bg-emerald-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          systemConfig.eventApprovalRequired ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="font-bold text-white block">Production Readiness Note:</span>
                  <p>
                    Changing this setting switches the system between <strong>Test Mode</strong> (automatic instant publishing) and <strong>Production Mode</strong> (admin review queue) without requiring any codebase rebuilds or schema restructuring.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
