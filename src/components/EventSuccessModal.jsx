import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import confetti from 'canvas-confetti'
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Mic,
  Calendar,
  User,
  Download,
  Share2,
  Radio
} from 'lucide-react'

export default function EventSuccessModal({ isOpen, onClose, session, onOpenPodium, onOpenFeed }) {
  if (!isOpen || !session) return null

  const [copied, setCopied] = useState(false)
  const eventUrl = `${window.location.origin}/#${session.short_code}`

  React.useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#6366f1']
        })
      } catch (e) {}
    }
  }, [isOpen])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById('success-qr-code')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.short_code}-qrcode.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-emerald-500/30 bg-[#0a101d] p-6 sm:p-8 shadow-2xl text-center">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-lg shadow-emerald-950/50">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold tracking-wider uppercase mb-2">
          <Radio className="w-3 h-3 animate-pulse" />
          Event Published · Test Mode Active
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">
          Your Seminar is Live &amp; Ready!
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Attendees can scan the QR code below or open the unique short link to receive live AI bullet points as you lecture.
        </p>

        {/* Vector QR Code Display */}
        <div className="my-6 inline-flex flex-col items-center justify-center p-5 bg-white rounded-2xl border-4 border-emerald-500/30 shadow-2xl">
          <QRCodeSVG
            id="success-qr-code"
            value={eventUrl}
            size={200}
            level="H"
            includeMargin={true}
            imageSettings={{
              src: '/favicon.svg',
              x: undefined,
              y: undefined,
              height: 36,
              width: 36,
              excavate: true
            }}
          />
          <span className="mt-2 text-slate-900 font-mono font-bold text-xs uppercase tracking-wider">
            {session.short_code}
          </span>
        </div>

        {/* Event URL Bar & Copy Link */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs max-w-md mx-auto mb-6">
          <span className="font-mono text-emerald-400 truncate flex-1 px-2 select-all text-left">
            {eventUrl}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 font-bold text-white hover:bg-emerald-500 transition-colors flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-white" />}
            <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Event Details Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left space-y-2 mb-6 text-xs">
          <div className="flex justify-between items-start gap-2">
            <span className="font-bold text-white text-sm truncate">{session.title}</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold uppercase">
              {session.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>Speaker: {session.speaker_name}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Schedule: {new Date(session.schedule_time).toLocaleString()}</span>
          </div>
        </div>

        {/* Primary Action CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => {
              onClose()
              if (onOpenPodium) onOpenPodium(session.id)
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-xs font-bold text-white shadow-lg shadow-emerald-950/60 transition-all"
          >
            <Mic className="w-4 h-4" />
            <span>Open Podium Studio</span>
          </button>

          <button
            onClick={() => {
              onClose()
              if (onOpenFeed) onOpenFeed(session.id)
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 transition-all"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            <span>View Attendee Feed</span>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
          <button
            onClick={handleDownloadQR}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Download QR
          </button>
          <span>·</span>
          <button
            onClick={onClose}
            className="hover:text-slate-200 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  )
}
