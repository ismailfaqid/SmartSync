import React from 'react'
import {
  Radio,
  Mic,
  Users,
  QrCode,
  Settings,
  Tv,
  ChevronDown,
  Sparkles,
  Plus,
  ShieldAlert,
  User,
  Bell
} from 'lucide-react'

export default function Navbar({
  currentView,
  onViewChange,
  sessions,
  activeSessionId,
  onSelectSession,
  onOpenQR,
  onOpenSettings,
  onOpenProjector,
  onOpenCreateEvent,
  onOpenAdminDashboard,
  onOpenLogin,
  currentUser,
  unreadNotifsCount = 0,
  isSupabase
}) {
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]
  const isOrganizer = currentUser?.role === 'organizer' || currentUser?.role === 'admin'
  const isAdmin = currentUser?.role === 'admin'

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Seminar Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onViewChange('feed')}>
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-950/40">
              <div className="w-full h-full bg-[#080c14] rounded-[10px] flex items-center justify-center">
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">SmartSync</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 font-mono">
                  TEST MODE
                </span>
              </div>
            </div>
          </div>

          {/* Session Switcher Dropdown */}
          <div className="relative hidden lg:block max-w-xs">
            <select
              value={activeSessionId}
              onChange={(e) => onSelectSession(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-200 hover:border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer truncate max-w-xs"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.status === 'cancelled' ? '[CANCELLED] ' : s.status === 'pending_approval' ? '[PENDING] ' : ''}
                  {s.short_code} · {s.speaker_name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* View Mode Switcher Pill */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800/80 shadow-inner">
          <button
            onClick={() => onViewChange('feed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'feed'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Attendee Feed</span>
            <span className="sm:hidden">Feed</span>
          </button>

          {isOrganizer && (
            <button
              onClick={() => onViewChange('podium')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'podium'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Podium Studio</span>
              <span className="sm:hidden">Studio</span>
            </button>
          )}
        </div>

        {/* Action Controls & User Account Switcher */}
        <div className="flex items-center gap-2">
          {/* Create Event Button for Organizers */}
          <button
            onClick={onOpenCreateEvent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-xs font-bold text-white shadow-md shadow-emerald-950/50 transition-all"
            title="Create and auto-publish a new seminar event"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Event</span>
          </button>

          {/* Admin Dashboard Button (Only for Admins) */}
          {isAdmin && (
            <button
              onClick={onOpenAdminDashboard}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-xs font-bold text-indigo-200 hover:bg-indigo-900 transition-all shadow-sm"
              title="Open Admin Dashboard"
            >
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span className="hidden md:inline">Admin Hub</span>
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
          )}

          {/* Quick QR Code Trigger */}
          <button
            onClick={onOpenQR}
            title="Seminar QR Code"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/40 transition-all"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
          </button>

          {/* User Account / Role Pill */}
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-2 pl-2.5 pr-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 transition-colors"
            title="Switch User Role or Register"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isAdmin
                ? 'bg-indigo-500 text-white'
                : isOrganizer
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}>
              {currentUser ? currentUser.full_name[0] : 'G'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-semibold block truncate max-w-[100px] text-[11px] leading-tight">
                {currentUser ? currentUser.full_name.split(' ')[0] : 'Guest'}
              </span>
              <span className={`text-[9px] font-mono font-bold uppercase block leading-none ${
                isAdmin ? 'text-indigo-400' : isOrganizer ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                {currentUser?.role || 'Attendee'}
              </span>
            </div>
          </button>

          {/* System Settings */}
          <button
            onClick={onOpenSettings}
            title="Settings & Credentials"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
