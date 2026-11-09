import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mic,
  Plus,
  QrCode,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  LogOut,
  Building,
  Radio,
  Users,
  DollarSign,
  BarChart2,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  Globe,
  Layers
} from 'lucide-react'
import { signOutUser } from '../lib/authService'

// Status badge styling
function StatusBadge({ status }) {
  const map = {
    published:        { label: 'Published',        classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    completed:        { label: 'Completed',         classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    cancelled:        { label: 'Cancelled',         classes: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
    pending_approval: { label: 'Pending Approval',  classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  }
  const cfg = map[status] || map.published
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

// Mini activity sparkline (random bars for demo)
function SparkBars({ count = 0 }) {
  const heights = Array.from({ length: 8 }, (_, i) => {
    const base = Math.max(2, Math.min(28, Math.round((count / 6) * (0.4 + Math.sin(i * 1.3 + count) * 0.6)))  )
    return base
  })
  return (
    <div className="flex items-end gap-0.5 h-7">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-sm bg-emerald-500/40 group-hover:bg-emerald-500/70 transition-colors"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  )
}

export default function OrganizerDashboardPage({
  currentUser,
  sessions,
  onSelectSession,
  onOpenCreateEvent,
  onOpenQR,
  onLogout
}) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('sessions') // 'sessions' | 'analytics'

  // Guard: Redirect to login if not logged in
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login')
    }
  }, [currentUser, navigate])

  if (!currentUser) return null

  // Filter organizer's own events
  const organizerSessions = sessions.filter(
    (s) => currentUser.role === 'admin' || s.organizer_id === currentUser.id || s.organizer_name === currentUser.full_name
  )

  const totalNotes    = organizerSessions.reduce((acc, s) => acc + (s.initial_notes?.length || 0), 0)
  const totalMinutes  = organizerSessions.reduce((acc, s) => acc + (s.audio_minutes_used || 0), 0).toFixed(1)
  const totalCost     = organizerSessions.reduce((acc, s) => acc + (s.cost_usd_accumulated || 0), 0).toFixed(2)
  const totalBullets  = organizerSessions.reduce((acc, s) =>
    acc + s.initial_notes?.reduce((a, n) => a + (n.bullet_points?.length || 0), 0), 0)
  const publishedCount   = organizerSessions.filter(s => s.status === 'published').length
  const totalAttendees   = organizerSessions.reduce((acc, s) => acc + (s.attendee_count || 0), 0)

  const handleLogout = async () => {
    await signOutUser()
    if (onLogout) onLogout()
    navigate('/login')
  }

  const METRICS = [
    { label: 'Managed Seminars',     value: organizerSessions.length, sub: `${publishedCount} live now`, color: 'text-white',      icon: Radio    },
    { label: 'Notes Streamed',        value: totalNotes,               sub: `${totalBullets} bullet points`, color: 'text-cyan-400', icon: Layers   },
    { label: 'Total Attendees',       value: totalAttendees,           sub: 'across all sessions',  color: 'text-violet-400', icon: Users    },
    { label: 'Audio Processed',       value: `${totalMinutes}m`,       sub: 'Whisper STT tracked',  color: 'text-amber-400',  icon: Activity },
    { label: 'AI Budget Used',        value: `$${totalCost}`,          sub: 'Quota guards active',  color: 'text-emerald-300',icon: DollarSign },
  ]

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      {/* Dashboard Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-950/40">
                <div className="w-full h-full bg-[#080c14] rounded-[10px] flex items-center justify-center">
                  <Radio className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">SmartSync</span>
            </Link>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-xs font-mono font-bold text-emerald-400 hidden sm:inline">ORGANIZER DASHBOARD</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreateEvent}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-xs font-bold text-white shadow-md shadow-emerald-950/50 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>

            <Link
              to="/feed"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Live Feed
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Welcome Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Gradient orb */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold uppercase">
                  Verified Organizer
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-500" />
                  {currentUser.organization_name || 'Independent Institution'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome back, {currentUser.full_name.split(' ')[0]} 👋
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Create seminar sessions, launch the AI Podium Studio, and watch structured notes sync to attendee screens in real time.
              </p>
            </div>

            <button
              onClick={onOpenCreateEvent}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-xl shadow-emerald-950/60 transition-all flex-shrink-0 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Seminar Event</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {METRICS.map((m, i) => (
            <div key={i} className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-lg hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400 leading-tight">{m.label}</span>
                <div className="w-6 h-6 rounded-lg bg-slate-900/80 flex items-center justify-center">
                  <m.icon className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
              <span className={`text-2xl font-black font-mono block ${m.color}`}>{m.value}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">{m.sub}</span>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 w-fit">
          {[
            { key: 'sessions',  label: 'My Sessions',  icon: Calendar },
            { key: 'analytics', label: 'Analytics',    icon: BarChart2 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── SESSIONS TAB ── */}
        {activeTab === 'sessions' && (
          <div className="glass-panel rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white">Seminar Events</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Launch the Podium Studio, share QR codes, or open the live attendee feed.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {organizerSessions.length} Total
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {organizerSessions.length === 0 ? (
                <div className="text-center py-16 text-slate-500 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="text-sm">You haven't created any seminars yet.</p>
                  <button
                    onClick={onOpenCreateEvent}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                  >
                    Create Your First Seminar
                  </button>
                </div>
              ) : (
                organizerSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors group"
                  >
                    {/* Left: Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <StatusBadge status={session.status} />
                        <span className="font-mono text-xs text-slate-500">#{session.short_code}</span>
                        {session.is_active && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                        {session.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-violet-400" />
                          {session.attendee_count || 0} attendees
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {new Date(session.schedule_time || session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          {session.initial_notes?.length || 0} notes
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-amber-400" />
                          ${(session.cost_usd_accumulated || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Center: Sparkline */}
                    <div className="hidden md:flex items-center gap-2">
                      <SparkBars count={session.initial_notes?.length || 0} />
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          if (onSelectSession) onSelectSession(session.id)
                          navigate('/feed')
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-950/50 transition-colors"
                        title="Launch Podium Studio"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Podium</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onSelectSession) onSelectSession(session.id)
                          if (onOpenQR) onOpenQR(session)
                        }}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/40 transition-colors"
                        title="View QR Code"
                      >
                        <QrCode className="w-4 h-4 text-emerald-400" />
                      </button>

                      <Link
                        to={`/live/${session.short_code}`}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 transition-colors"
                        title="Open Live Feed"
                        target="_blank"
                      >
                        <ExternalLink className="w-4 h-4 text-cyan-400" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            {/* Top stat cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  label: 'Avg Notes per Session',
                  value: organizerSessions.length > 0 ? (totalNotes / organizerSessions.length).toFixed(1) : 0,
                  sub: 'Structured bullet-point takeaways',
                  color: 'text-cyan-400',
                  bg: 'from-cyan-500/10 to-transparent',
                  border: 'border-cyan-500/20'
                },
                {
                  label: 'Total Attendee Reach',
                  value: totalAttendees.toLocaleString(),
                  sub: 'Cumulative across all sessions',
                  color: 'text-violet-400',
                  bg: 'from-violet-500/10 to-transparent',
                  border: 'border-violet-500/20'
                },
                {
                  label: 'Cost Efficiency',
                  value: totalNotes > 0 ? `$${(parseFloat(totalCost) / totalNotes).toFixed(3)}` : '$0.000',
                  sub: 'Cost per AI note card generated',
                  color: 'text-emerald-400',
                  bg: 'from-emerald-500/10 to-transparent',
                  border: 'border-emerald-500/20'
                }
              ].map((item, i) => (
                <div key={i} className={`glass-panel rounded-2xl p-5 border ${item.border} bg-gradient-to-br ${item.bg} shadow-lg`}>
                  <p className="text-xs text-slate-400 mb-2">{item.label}</p>
                  <p className={`text-3xl font-black font-mono ${item.color}`}>{item.value}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* Per-session breakdown table */}
            <div className="glass-panel rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Session Performance Breakdown</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Note counts, audience reach, audio usage, and costs per session</p>
                </div>
                <BarChart2 className="w-5 h-5 text-slate-600" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-slate-500 uppercase text-[10px] tracking-wider">
                      <th className="px-5 py-3 font-semibold">Session</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Attendees</th>
                      <th className="px-4 py-3 font-semibold text-right">Notes</th>
                      <th className="px-4 py-3 font-semibold text-right">Audio</th>
                      <th className="px-4 py-3 font-semibold text-right">AI Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {organizerSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-200 truncate max-w-[200px]">{s.title}</div>
                          <div className="font-mono text-slate-500 text-[10px]">#{s.short_code}</div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-violet-400">{s.attendee_count || 0}</td>
                        <td className="px-4 py-3 text-right font-mono text-cyan-400">{s.initial_notes?.length || 0}</td>
                        <td className="px-4 py-3 text-right font-mono text-amber-400">{(s.audio_minutes_used || 0).toFixed(1)}m</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-400">${(s.cost_usd_accumulated || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {organizerSessions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-500">No sessions yet. Create your first event to see analytics.</td>
                      </tr>
                    )}
                  </tbody>
                  {organizerSessions.length > 0 && (
                    <tfoot className="border-t border-slate-700 bg-slate-950/40">
                      <tr>
                        <td className="px-5 py-3 font-bold text-slate-300 text-xs">Totals</td>
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3 text-right font-mono font-bold text-violet-300">{totalAttendees}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-cyan-300">{totalNotes}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-300">{totalMinutes}m</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-300">${totalCost}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="glass-panel rounded-3xl border border-slate-800 p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Budget Usage Overview
              </h3>
              {organizerSessions.map((s) => {
                const pct = Math.min(100, ((s.audio_minutes_used || 0) / (s.max_audio_minutes || 60)) * 100)
                return (
                  <div key={s.id} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="text-slate-300 font-medium truncate max-w-[60%]">{s.title}</span>
                      <span className="text-slate-500 font-mono">{(s.audio_minutes_used || 0).toFixed(1)}/{s.max_audio_minutes || 60}m</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                      <span>$({(s.cost_usd_accumulated || 0).toFixed(2)} used)</span>
                      <span>Budget: ${s.max_budget_usd || 5.00}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
