import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Maximize, Minimize, Sparkles, Users, Radio } from 'lucide-react'

export default function ProjectorDisplay({ session, latestNote, onClose }) {
  if (!session) return null

  const sessionUrl = `${window.location.origin}/#${session.short_code}`

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#050811] text-white flex flex-col justify-between p-8 sm:p-12 overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Studio</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-sm font-bold tracking-wider">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </span>
            <span>LIVE SYNC ACTIVE</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Hero: Huge QR Code and Session Callout */}
      <div className="relative z-10 max-w-4xl mx-auto text-center my-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          Interactive Seminar Audience Sync
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl">
          {session.title}
        </h1>

        <p className="text-base sm:text-lg text-slate-300 mt-3 font-medium">
          Speaker: <span className="text-emerald-300 font-bold">{session.speaker_name}</span>
          {session.sponsor_name && (
            <span className="text-slate-400"> · Sponsored by <span className="text-white font-semibold">{session.sponsor_name}</span></span>
          )}
        </p>

        {/* Big QR Code Card */}
        <div className="mt-8 flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-2xl shadow-emerald-950/60 border-4 border-emerald-400/30">
          <QRCodeSVG
            value={sessionUrl}
            size={280}
            level="H"
            includeMargin={true}
            imageSettings={{
              src: '/favicon.svg',
              x: undefined,
              y: undefined,
              height: 48,
              width: 48,
              excavate: true,
            }}
          />
          <div className="mt-4 text-center">
            <span className="text-slate-800 font-bold text-sm tracking-widest uppercase block">
              Scan with your phone camera
            </span>
            <span className="mt-1 inline-block px-4 py-1.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-base font-bold tracking-wider">
              {session.short_code}
            </span>
          </div>
        </div>

        <p className="mt-6 font-mono text-sm text-slate-400">
          or open in browser: <span className="text-emerald-400 underline">{sessionUrl}</span>
        </p>
      </div>

      {/* Bottom Ticker: Real-time Live Note Broadcast */}
      <div className="relative z-10 max-w-4xl mx-auto w-full">
        {latestNote ? (
          <div className="rounded-2xl bg-slate-900/80 border border-emerald-500/30 p-4 backdrop-blur-md flex items-center justify-between gap-4 animate-fade-in shadow-xl">
            <div className="flex items-center gap-3 truncate">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="truncate">
                <span className="text-[10px] uppercase font-mono text-emerald-400 tracking-wider block">
                  Latest AI Note Streamed to Attendees
                </span>
                <span className="text-sm font-bold text-white truncate block">
                  {latestNote.heading}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400 flex-shrink-0">
              {latestNote.timestamp_marker || 'Just now'}
            </span>
          </div>
        ) : (
          <div className="text-center text-xs text-slate-500 font-mono">
            Awaiting speech intake from the podium...
          </div>
        )}
      </div>
    </div>
  )
}
