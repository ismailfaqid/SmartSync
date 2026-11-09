import React from 'react'
import { Calendar, MapPin, User, ListChecks, Activity, Sparkles, QrCode } from 'lucide-react'
import LiveSyncIndicator from './LiveSyncIndicator'
import SponsorBanner from './SponsorBanner'
import NotesFeed from './NotesFeed'
import ExportActions from './ExportActions'
import { getOpenAIKey } from '../lib/storage'

export default function DualPaneLayout({ session, notes, isSupabase, connectionState = 'connected', onOpenQR }) {
  if (!session) return null

  // Calculate live session statistics
  const totalBullets = notes.reduce(
    (acc, note) => acc + (Array.isArray(note.bullet_points) ? note.bullet_points.length : 1),
    0
  )
  const estimatedReadMinutes = Math.max(1, Math.ceil(totalBullets * 0.4))

  const scrollToSection = (noteId) => {
    const el = document.getElementById(`note-${noteId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('ring-2', 'ring-emerald-500/50')
      setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-500/50'), 1500)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-5rem)]">
      {/* Left Pane: Session Metadata, Sponsor, Table of Contents, Exports (cols 5 of 12) */}
      <aside className="lg:col-span-5 xl:col-span-4 flex flex-col h-full overflow-y-auto space-y-4 pr-1">
        {/* Session Metadata Card */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              SESSION: {session.short_code}
            </span>
            <button
              onClick={onOpenQR}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Show QR</span>
            </button>
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-white leading-snug tracking-tight">
              {session.title}
            </h1>
            <div className="mt-2.5 flex items-center gap-2 text-sm text-slate-300">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white">{session.speaker_name}</span>
                {session.speaker_role && (
                  <span className="block text-[11px] text-slate-400">{session.speaker_role}</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
            {session.location && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{session.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Live Seminar</span>
            </div>
          </div>
        </div>

        {/* Sponsor Banner (B2B Area) */}
        <SponsorBanner
          sponsorName={session.sponsor_name}
          sponsorLogoUrl={session.sponsor_logo_url}
        />

        {/* Interactive Table of Contents */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 shadow-xl flex-1 flex flex-col min-h-[220px]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 tracking-wide uppercase">
              <ListChecks className="w-4 h-4 text-emerald-400" />
              <span>Table of Contents</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {notes.length} Sections
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[260px]">
            {notes.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                Waiting for incoming sections...
              </p>
            ) : (
              notes.map((note, idx) => (
                <button
                  key={note.id || idx}
                  onClick={() => scrollToSection(note.id)}
                  className="w-full text-left group flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-800/70 transition-all border border-transparent hover:border-slate-700/60"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[11px] font-mono font-bold text-slate-500 group-hover:text-emerald-400">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span className="text-xs text-slate-300 group-hover:text-white truncate">
                      {note.heading}
                    </span>
                  </div>
                  {note.timestamp_marker && (
                    <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                      {note.timestamp_marker}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* AI Metrics Pill */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              {totalBullets} key insights
            </span>
            <span>~{estimatedReadMinutes} min read</span>
            <span className="text-cyan-400 font-mono">Whisper+GPT-4o</span>
          </div>
        </div>

        {/* Export CTAs Card */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 shadow-xl">
          <ExportActions session={session} notes={notes} fullWidth={true} />
        </div>
      </aside>

      {/* Right Pane: Live Bullet Points Feed (cols 7 of 12) */}
      <main className="lg:col-span-7 xl:col-span-8 flex flex-col h-full glass-panel rounded-2xl p-5 border border-slate-800/80 shadow-2xl relative overflow-hidden">
        {/* Right Pane Top Header with Live Sync Status */}
        <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Live AI Bullet Stream
            </h2>
          </div>
          <LiveSyncIndicator
            isLive={session.is_active}
            attendeeCount={session.attendee_count}
            isSupabase={isSupabase}
            connectionState={connectionState}
          />
        </div>

        {/* The Card Feed */}
        <div className="flex-1 overflow-hidden">
          <NotesFeed notes={notes} sessionTitle={session.title} />
        </div>
      </main>
    </div>
  )
}
