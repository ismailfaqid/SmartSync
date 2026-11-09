import React, { useState } from 'react'
import confetti from 'canvas-confetti'
import { MessageSquare, FileDown, Copy, Check, Share2, Sparkles } from 'lucide-react'
import { shareViaWhatsApp, generateNotesPDF, copyMarkdownToClipboard, shareViaWebShare } from '../lib/exportUtils'

export default function ExportActions({ session, notes, fullWidth = false }) {
  const [copiedMd, setCopiedMd] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#10b981', '#06b6d4', '#3b82f6'],
      })
    } catch (e) {
      // ignore
    }
  }

  const handleWhatsApp = () => {
    triggerConfetti()
    shareViaWhatsApp(session, notes)
  }

  const handlePdfExport = () => {
    setIsExportingPdf(true)
    triggerConfetti()
    try {
      generateNotesPDF(session, notes)
    } catch (err) {
      console.error('PDF generation error:', err)
    } finally {
      setTimeout(() => setIsExportingPdf(false), 800)
    }
  }

  const handleCopyMarkdown = async () => {
    const success = await copyMarkdownToClipboard(session, notes)
    if (success) {
      setCopiedMd(true)
      setTimeout(() => setCopiedMd(false), 2000)
    }
  }

  const handleNativeShare = async () => {
    await shareViaWebShare(session, notes)
  }

  return (
    <div className={`flex flex-col gap-2.5 ${fullWidth ? 'w-full' : ''}`}>
      {/* Primary CTA: Full-width green button "Send Notes to WhatsApp" */}
      <button
        onClick={handleWhatsApp}
        id="btn-whatsapp-export"
        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/60 transition-all duration-200 hover:from-emerald-400 hover:to-green-500 hover:shadow-emerald-900/80 active:scale-[0.99]"
      >
        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <MessageSquare className="w-5 h-5 fill-white text-emerald-600" />
        <span className="tracking-wide">Send Notes to WhatsApp</span>
        <Sparkles className="w-4 h-4 text-emerald-200 opacity-80 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Secondary CTAs Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Secondary CTA: Export as PDF */}
        <button
          onClick={handlePdfExport}
          id="btn-pdf-export"
          disabled={isExportingPdf}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 px-3 text-xs font-semibold text-slate-200 shadow hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-all disabled:opacity-50"
        >
          <FileDown className="w-4 h-4 text-cyan-400" />
          <span>{isExportingPdf ? 'Generating PDF...' : 'Export as PDF'}</span>
        </button>

        {/* Copy Markdown */}
        <button
          onClick={handleCopyMarkdown}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 px-3 text-xs font-semibold text-slate-200 shadow hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-all"
        >
          {copiedMd ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
          <span>{copiedMd ? 'Copied Markdown!' : 'Copy Markdown'}</span>
        </button>
      </div>

      {/* Optional Web Share */}
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button
          onClick={handleNativeShare}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share Session Link to Other Apps
        </button>
      )}
    </div>
  )
}
