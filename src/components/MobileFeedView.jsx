import React, { useState } from 'react'
import { ListChecks, X, User, QrCode } from 'lucide-react'
import LiveSyncIndicator from './LiveSyncIndicator'
import SponsorBanner from './SponsorBanner'
import NotesFeed from './NotesFeed'
import ExportActions from './ExportActions'

export default function MobileFeedView({ session, notes, isSupabase, connectionState = 'connected', onOpenQR }) {
  const [showTocDrawer, setShowTocDrawer] = useState(false)

  if (!session) return null

  const scrollToSection = (noteId) => {
    setShowTocDrawer(false)
    setTimeout(() => {
      const el = document.getElementById(`note-${noteId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        el.classList.add('ring-2', 'ring-emerald-500/50')
        setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-500/50'), 1500)
      }
    }, 150)
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)] pb-28 relative">
      {/* Mobile Top Header: Live Sync + Title */}
      <div className="space-y-3 mb-4">
        {/* Status bar */}
        <div className="flex items-center justify-between gap-2">
          <LiveSyncIndicator
            isLive={session.is_active}
            attendeeCount={session.attendee_count}
            isSupabase={isSupabase}
            connectionState={connectionState}
          />
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowTocDrawer(true)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title="Table of Contents"
            >
              <ListChecks className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={onOpenQR}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title="QR Code"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Seminar Title & Speaker */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <h1 className="text-lg font-bold text-white leading-snug">
            {session.title}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200">{session.speaker_name}</span>
            <span className="text-slate-500">·</span>
            <span className="font-mono text-emerald-400">{session.short_code}</span>
          </div>
        </div>

        {/* Sponsor Banner */}
        <SponsorBanner
          sponsorName={session.sponsor_name}
          sponsorLogoUrl={session.sponsor_logo_url}
          compact={true}
        />
      </div>

      {/* Main Card Feed */}
      <div className="flex-1">
        <NotesFeed notes={notes} sessionTitle={session.title} />
      </div>

      {/* Sticky Mobile Bottom Floating Export Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#080c14] via-[#080c14]/95 to-transparent pt-3 pb-4 px-4 backdrop-blur-lg border-t border-slate-800/80">
        <div className="max-w-md mx-auto">
          <ExportActions session={session} notes={notes} fullWidth={true} />
        </div>
      </div>

      {/* Slide-over Table of Contents Drawer */}
      {showTocDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-4/5 max-w-xs h-full bg-[#0c1322] border-l border-slate-800 p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <ListChecks className="w-4 h-4 text-emerald-400" />
                <span>Table of Contents</span>
              </div>
              <button
                onClick={() => setShowTocDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {notes.map((note, idx) => (
                <button
                  key={note.id || idx}
                  onClick={() => scrollToSection(note.id)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 text-xs text-slate-300 transition-colors border border-transparent hover:border-slate-700"
                >
                  <span className="font-mono text-emerald-400 font-bold mr-1.5">
                    {idx + 1}.
                  </span>
                  {note.heading}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono text-center">
              SmartSync Real-Time Platform
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
