import React, { useState } from 'react'
import {
  X,
  Calendar,
  User,
  Sparkles,
  Link as LinkIcon,
  Clock,
  MapPin,
  FileText,
  DollarSign,
  ShieldCheck,
  Check
} from 'lucide-react'
import { createSeminarSession } from '../lib/storage'
import { getSystemConfig } from '../lib/settings'

export default function CreateEventModal({ isOpen, onClose, currentUser, onEventCreated }) {
  if (!isOpen) return null

  const { eventApprovalRequired } = getSystemConfig()

  const [title, setTitle] = useState('')
  const [speakerName, setSpeakerName] = useState('')
  const [speakerRole, setSpeakerRole] = useState('')
  const [scheduleTime, setScheduleTime] = useState(() => {
    const d = new Date(Date.now() + 3600000 * 2)
    return d.toISOString().slice(0, 16)
  })
  const [location, setLocation] = useState('Grand Auditorium · Main Stage')
  const [description, setDescription] = useState('')
  const [sponsorName, setSponsorName] = useState('Quantum Nexus Technologies')
  const [customShortCode, setCustomShortCode] = useState('')
  const [maxAudioMinutes, setMaxAudioMinutes] = useState(60)
  const [maxBudgetUsd, setMaxBudgetUsd] = useState(5.00)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !speakerName.trim()) {
      alert('Please provide an event topic and presenter name.')
      return
    }

    setIsSubmitting(true)
    try {
      const newSession = createSeminarSession({
        title,
        speakerName,
        speakerRole,
        organizerId: currentUser?.id,
        organizerName: currentUser?.full_name || 'Authorized Organizer',
        scheduleTime,
        location,
        description,
        sponsorName,
        sponsorLogoUrl: '/assets/sponsor_quantum_logo.jpg',
        customShortCode: customShortCode.trim() || undefined,
        maxAudioMinutes,
        maxBudgetUsd
      })

      if (onEventCreated) {
        onEventCreated(newSession)
      }
    } catch (err) {
      console.error('Failed to create event:', err)
      alert(err.message || 'Error creating event.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-800 bg-[#0b111e] p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Create New Seminar Event</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                !eventApprovalRequired
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-950 text-amber-400 border border-amber-500/30'
              }`}>
                {!eventApprovalRequired ? 'TEST MODE · AUTO-PUBLISH' : 'APPROVAL REQUIRED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Organizer: <span className="text-slate-200 font-semibold">{currentUser?.full_name || 'Dr. Almaz Kebede'}</span> ({currentUser?.email})
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Topic / Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Event Topic / Seminar Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Next-Generation Distributed Systems & Real-Time AI Inference"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Presenter Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Presenter / Keynote Speaker *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Elena Rostova"
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Speaker Title / Affiliation
              </label>
              <input
                type="text"
                placeholder="e.g. Chief Scientist, Quantum Systems"
                value={speakerRole}
                onChange={(e) => setSpeakerRole(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Schedule Time & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Schedule Date &amp; Time
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Venue / Hall
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Grand Auditorium Hall C"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Lecture Contents & Agenda */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Lecture Contents &amp; Key Syllabus Overview
            </label>
            <textarea
              rows={3}
              placeholder="Provide a brief summary of the core arguments, technical frameworks, and discussion themes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Custom Short Code & Sponsor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Short URL Code (Slug)
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. ai-summit-2026"
                  value={customShortCode}
                  onChange={(e) => setCustomShortCode(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Event Sponsor Name
              </label>
              <input
                type="text"
                placeholder="e.g. Quantum Nexus Technologies"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Cost Control Limits */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Audio Limit (Mins):</span>
              <input
                type="number"
                min={15}
                max={300}
                value={maxAudioMinutes}
                onChange={(e) => setMaxAudioMinutes(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Max Budget (USD):</span>
              <input
                type="number"
                step="0.5"
                min={1}
                max={50}
                value={maxBudgetUsd}
                onChange={(e) => setMaxBudgetUsd(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-lg shadow-emerald-950/60 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{!eventApprovalRequired ? 'Publish Event Instantly' : 'Submit for Admin Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
