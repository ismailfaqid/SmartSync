import React from 'react'
import { Wifi, Users, Radio, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function LiveSyncIndicator({
  isLive = true,
  attendeeCount = 342,
  isSupabase = false,
  connectionState = 'connected', // 'connected' | 'reconnecting' | 'hydrating' | 'offline'
  reconnectDetails = ''
}) {
  const isReconnecting = connectionState === 'reconnecting'
  const isHydrating = connectionState === 'hydrating'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Primary Pulsating Live Badge */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide shadow-lg backdrop-blur-md transition-all ${
          isReconnecting
            ? 'bg-amber-950/80 border border-amber-500/40 text-amber-300 shadow-amber-950/40'
            : isHydrating
            ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-cyan-950/40'
            : isLive
            ? 'bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 shadow-emerald-950/40'
            : 'bg-slate-900 border border-slate-800 text-slate-400'
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          {isReconnecting ? (
            <RefreshCw className="w-2.5 h-2.5 text-amber-400 animate-spin" />
          ) : isHydrating ? (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          ) : isLive ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_10px_#10b981]"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-500"></span>
          )}
        </span>
        <span className="font-bold tracking-wider uppercase text-[11px]">
          {isReconnecting
            ? 'RECONNECTING WS...'
            : isHydrating
            ? 'CATCHING UP...'
            : isLive
            ? 'LIVE SYNC ACTIVE'
            : 'SYNC PAUSED'}
        </span>
      </div>

      {/* Latency & Protocol Pill with RLS Protection Badge */}
      <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 text-xs">
        <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span className="text-[11px] font-mono text-slate-300">
          {isSupabase ? 'PostgreSQL Realtime' : 'Ultra-Fast Bus'}
        </span>
        <span className="text-[10px] text-emerald-400 font-mono">· 18ms</span>
        <span className="hidden md:inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-2.5 h-2.5" /> RLS
        </span>
      </div>

      {/* Live Attendees Pill */}
      {attendeeCount > 0 && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 text-xs">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-[11px] font-mono">{attendeeCount} connected</span>
        </div>
      )}
    </div>
  )
}
