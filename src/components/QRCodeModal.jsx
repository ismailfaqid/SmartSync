import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, Check, ExternalLink, Download, Smartphone, QrCode } from 'lucide-react'

export default function QRCodeModal({ isOpen, onClose, session }) {
  if (!isOpen || !session) return null

  const [copied, setCopied] = useState(false)
  const sessionUrl = `${window.location.origin}/#${session.short_code}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sessionUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy link error:', err)
    }
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById('session-qr-code')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.short_code}-qr-code.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0c1322] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Join Seminar Session</h3>
          <p className="text-xs text-slate-400 mt-1">
            Attendees can scan this QR code with their phone camera to receive live AI bullet notes instantly.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="my-6 flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-inner border border-slate-200">
          <QRCodeSVG
            id="session-qr-code"
            value={sessionUrl}
            size={220}
            level="H"
            includeMargin={true}
            imageSettings={{
              src: '/favicon.svg',
              x: undefined,
              y: undefined,
              height: 38,
              width: 38,
              excavate: true,
            }}
          />
          <div className="mt-3 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-slate-900 text-emerald-400 font-mono text-xs font-semibold tracking-wider">
              {session.short_code}
            </span>
          </div>
        </div>

        {/* Session Short URL Bar */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs">
          <span className="font-mono text-slate-300 truncate flex-1 px-2 select-all">
            {sessionUrl}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 font-medium text-slate-200 hover:bg-emerald-600 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownloadQR}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Download SVG QR
          </button>
          <a
            href={sessionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-3 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/50"
          >
            <ExternalLink className="w-4 h-4" />
            Open Attendee View
          </a>
        </div>
      </div>
    </div>
  )
}
