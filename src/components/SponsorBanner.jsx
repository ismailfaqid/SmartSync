import React from 'react'
import { Sparkles, ExternalLink, ShieldCheck } from 'lucide-react'

export default function SponsorBanner({ sponsorName, sponsorLogoUrl, compact = false }) {
  if (!sponsorName) return null

  return (
    <div className={`relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-slate-900/80 p-3.5 backdrop-blur-md shadow-lg ${compact ? 'py-2 px-3' : ''}`}>
      {/* Subtle background ambient light */}
      <div className="absolute -right-8 -top-8 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Sponsor Logo / Emblem */}
          <div className="relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-emerald-500/30 bg-slate-950 p-0.5 shadow-inner flex items-center justify-center">
            {sponsorLogoUrl ? (
              <img
                src={sponsorLogoUrl}
                alt={sponsorName}
                className="w-full h-full object-cover rounded-md"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = '<span class="text-emerald-400 font-bold text-xs">QN</span>'
                }}
              />
            ) : (
              <Sparkles className="w-5 h-5 text-emerald-400" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400/90 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Official Keynote Sponsor
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-100 truncate">
              Sponsored by <span className="text-emerald-300 font-bold">{sponsorName}</span>
            </div>
            {!compact && (
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Empowering real-time knowledge synthesis & intelligence infrastructure
              </p>
            )}
          </div>
        </div>

        {/* Sponsor Action / Verified badge */}
        <div className="hidden sm:flex flex-col items-end flex-shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors cursor-pointer">
            Partner Exhibit
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  )
}
