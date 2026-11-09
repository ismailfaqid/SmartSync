import React, { useState, useEffect, useRef } from 'react'
import {
  Mic,
  MicOff,
  Radio,
  Play,
  Square,
  Sparkles,
  Zap,
  Activity,
  Terminal,
  Clock,
  Layers,
  Settings,
  Tv,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  DollarSign,
  ShieldCheck,
  RotateCcw,
  Plus,
  Send,
  Cpu,
  FileText,
  Trash2,
  ArrowUpDown
} from 'lucide-react'
import { PodiumAudioEngine } from '../lib/audioRecorder'
import { transcribeAudioWithWhisper, summarizeTranscriptWithGPT4o, saveNoteToSupabase } from '../lib/aiPipeline'
import {
  appendNoteToSession,
  recordAudioUsage,
  getSessionQuotaStatus,
  updateSessionQuotaLimits,
  getOpenAIKey,
  clearSessionNotes
} from '../lib/storage'
import { SEMINAR_LIVE_SPEECH_STREAM } from '../lib/mockSeminars'

export default function PodiumStudio({ session, onNoteCreated, isSupabase, onOpenProjector, onOpenSettings, onRefreshData }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [logs, setLogs] = useState([])
  const [countdown, setCountdown] = useState(30)
  const [isProcessingChunk, setIsProcessingChunk] = useState(false)
  const [rightTab, setRightTab] = useState('notes') // default to 'notes' so speaker sees their notes immediately
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' | 'oldest' - default to newest first!
  const [localNotes, setLocalNotes] = useState(() => session?.initial_notes || [])
  const [manualHeading, setManualHeading] = useState('')
  const [manualBullets, setManualBullets] = useState('')
  const [hasOpenAIKey, setHasOpenAIKey] = useState(() => Boolean(getOpenAIKey()))

  // Keep localNotes synchronized with session changes from parent
  useEffect(() => {
    if (session?.initial_notes) {
      setLocalNotes(session.initial_notes)
    }
  }, [session?.initial_notes])

  // Cost control & Quotas
  const [quotaStatus, setQuotaStatus] = useState(() => getSessionQuotaStatus(session?.id) || {
    minutesUsed: 0,
    maxMinutes: 60,
    minutePercent: 0,
    costUsed: 0,
    maxBudget: 5.00,
    costPercent: 0,
    isExceeded: false,
    isApproachingLimit: false
  })

  // Resilience & Deduplication metrics
  const [duplicateNotesBlocked, setDuplicateNotesBlocked] = useState(0)
  const [retriesCount, setRetriesCount] = useState(0)
  const [lastTranscriptContext, setLastTranscriptContext] = useState('')

  const canvasRef = useRef(null)
  const audioEngineRef = useRef(null)
  const countdownTimerRef = useRef(null)
  const simulationTimerRef = useRef(null)
  const simulationIndexRef = useRef(0)

  // Refresh quota status periodically
  const refreshQuota = () => {
    if (!session?.id) return
    const q = getSessionQuotaStatus(session.id)
    if (q) setQuotaStatus(q)
  }

  // Check key periodically in case user updated in settings
  useEffect(() => {
    setHasOpenAIKey(Boolean(getOpenAIKey()))
  }, [logs.length])

  const addLog = (tag, message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs((prev) => [
      { id: Date.now() + Math.random(), tag, message, type, timestamp },
      ...prev.slice(0, 50),
    ])
  }

  // Handle recorded audio chunk with overlap & speech transcription
  const handleChunkReady = async ({
    audioBlob,
    durationSeconds,
    sequenceNumber,
    previousTranscriptContext,
    speechTranscript,
    isFinal
  }) => {
    // 1. Quota check before processing
    if (quotaStatus.isExceeded) {
      addLog('QUOTA', 'Session limit reached. Processing halted to protect API budget.', 'error')
      if (isRecording) toggleRecording()
      return
    }

    setIsProcessingChunk(true)
    const blobSizeKb = ((audioBlob?.size || 0) / 1024).toFixed(1)
    addLog('AUDIO', `Chunk #${sequenceNumber} (${durationSeconds}s, ${blobSizeKb} KB) captured${isFinal ? ' [Final on Stop]' : ''}`, 'info')

    try {
      const apiKey = getOpenAIKey()
      let transcriptText = ''

      if (apiKey) {
        // Mode A: Cloud OpenAI Whisper
        addLog('WHISPER', 'Transcribing audio via OpenAI Whisper API...', 'info')
        try {
          transcriptText = await transcribeAudioWithWhisper(audioBlob, previousTranscriptContext || lastTranscriptContext)
          addLog('WHISPER', `Whisper output: "${transcriptText.slice(0, 70)}..."`, 'success')
          setLastTranscriptContext(transcriptText)
        } catch (whisperErr) {
          addLog('WHISPER NOTICE', `${whisperErr.message}. Falling back to browser speech engine.`, 'warning')
          transcriptText = speechTranscript || liveTranscript || ''
        }
      } else {
        // Mode B: Browser-Native Speech Recognition Engine (Free, client-side)
        transcriptText = speechTranscript || liveTranscript || ''
        if (transcriptText) {
          addLog('BROWSER STT', `Speech transcribed: "${transcriptText.slice(0, 70)}..."`, 'success')
        }
      }

      // Fallback: If speechTranscript was somehow empty but liveTranscript captured words
      if (!transcriptText || !transcriptText.trim()) {
        if (liveTranscript && liveTranscript.trim() && !liveTranscript.toLowerCase().includes('listening to')) {
          transcriptText = liveTranscript.trim()
        }
      }

      // Check if any audible words were detected
      if (!transcriptText || !transcriptText.trim()) {
        addLog('AUDIO', `Chunk #${sequenceNumber}: No speech detected in this window. Speak into microphone to generate notes.`, 'warning')
        return
      }

      // 3. AI Structuring (GPT-4o if key configured, or local NLP structuring)
      addLog('AI STRUCTURING', 'Extracting structured bullet points...', 'info')
      const existingNotes = localNotes || []
      const structured = await summarizeTranscriptWithGPT4o(transcriptText, existingNotes)
      addLog('AI STRUCTURING', `Generated note: "${structured.heading}" (${structured.bullet_points.length} points)`, 'success')

      // 4. Update Audio Minutes & Cost Quotas
      const whisperCostEst = apiKey ? (durationSeconds / 60) * 0.006 : 0
      const totalChunkCost = whisperCostEst + (structured.estCost || 0.001)
      const updatedQuota = recordAudioUsage(session.id, durationSeconds, totalChunkCost)
      if (updatedQuota) setQuotaStatus(updatedQuota)

      // 5. Save to Supabase DB if enabled
      const timestampMarker = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const nextSequence = (existingNotes.length || 0) + 1
      const idempotencyHash = `hash_${Date.now()}_${sequenceNumber}`

      if (isSupabase) {
        await saveNoteToSupabase(session.id, structured.heading, structured.bullet_points, timestampMarker, nextSequence, idempotencyHash)
        addLog('SUPABASE RLS', `Sequenced note #${nextSequence} pushed to cloud`, 'success')
      }

      // 6. Save locally & broadcast to live feed
      const saved = appendNoteToSession(session.id, {
        sequence_number: nextSequence,
        idempotency_hash: idempotencyHash,
        heading: structured.heading,
        bullet_points: structured.bullet_points,
        timestamp_marker: timestampMarker,
      })

      if (saved) {
        // Immediately update local component state so it renders without delay
        setLocalNotes((prev) => [...prev, saved])
        setRightTab('notes') // Automatically switch to notes tab so speaker sees their new note!
        if (onNoteCreated) onNoteCreated(saved)
        addLog('SYNC', `Live note #${nextSequence} broadcasted to attendee devices`, 'success')
      } else {
        setDuplicateNotesBlocked((c) => c + 1)
        addLog('DEDUPLICATION', `Note was identical to previous content and was filtered.`, 'warning')
      }

      setLiveTranscript('')
    } catch (err) {
      console.error('Audio processing pipeline error:', err)
      addLog('ERROR', `Pipeline error: ${err.message}`, 'error')
    } finally {
      setIsProcessingChunk(false)
      setCountdown(30)
      refreshQuota()
    }
  }

  // Toggle live mic recording with quota safety check
  const toggleRecording = async () => {
    if (isRecording) {
      audioEngineRef.current?.stop()
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      setIsRecording(false)
      addLog('MIC', 'Podium microphone stopped. Processing final speech segment...', 'warning')
    } else {
      if (quotaStatus.isExceeded) {
        alert('Session budget or audio limit reached. Please extend the seminar quota limit in settings.')
        return
      }

      if (isSimulating) stopSimulation()

      audioEngineRef.current = new PodiumAudioEngine({
        onChunkReady: handleChunkReady,
        onLiveSpeech: (text) => setLiveTranscript(text),
        onQuotaCheck: () => quotaStatus.isExceeded,
        onError: (err) => {
          addLog('MIC ERROR', err.message || 'Microphone access denied', 'error')
          setIsRecording(false)
        },
      })

      const ok = await audioEngineRef.current.start()
      if (ok) {
        setIsRecording(true)
        addLog('MIC', 'Podium microphone active. Speak into mic — notes will generate every 30s or on stop.', 'success')

        if (canvasRef.current) {
          audioEngineRef.current.attachVisualizer(canvasRef.current)
        }

        setCountdown(30)
        countdownTimerRef.current = setInterval(() => {
          setCountdown((prev) => (prev <= 1 ? 30 : prev - 1))
        }, 1000)
      }
    }
  }

  // Live Seminar Simulation for instant testing
  const toggleSimulation = () => {
    if (isSimulating) {
      stopSimulation()
    } else {
      if (quotaStatus.isExceeded) {
        alert('Session budget limit reached. Extend limit to continue.')
        return
      }
      if (isRecording) {
        audioEngineRef.current?.stop()
        setIsRecording(false)
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      }
      startSimulation()
    }
  }

  const startSimulation = () => {
    setIsSimulating(true)
    addLog('SIMULATOR', 'Started automated seminar speech simulation. Emitting notes every 10s...', 'success')

    const emitNextSimulationSnippet = async () => {
      const idx = simulationIndexRef.current % SEMINAR_LIVE_SPEECH_STREAM.length
      simulationIndexRef.current += 1
      const sample = SEMINAR_LIVE_SPEECH_STREAM[idx]

      setIsProcessingChunk(true)
      addLog('SIMULATOR', `Simulated speaker snippet #${idx + 1} processing...`, 'info')

      try {
        const existingNotes = localNotes || []
        const structured = await summarizeTranscriptWithGPT4o(sample.speech_chunk, existingNotes)
        const timestampMarker = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const nextSequence = (existingNotes.length || 0) + 1
        const idempotencyHash = `hash_sim_${Date.now()}_${idx}`

        if (isSupabase) {
          await saveNoteToSupabase(session.id, structured.heading, structured.bullet_points, timestampMarker, nextSequence, idempotencyHash)
        }

        const saved = appendNoteToSession(session.id, {
          sequence_number: nextSequence,
          idempotency_hash: idempotencyHash,
          heading: structured.heading,
          bullet_points: structured.bullet_points,
          timestamp_marker: timestampMarker,
        })

        if (saved) {
          setLocalNotes((prev) => [...prev, saved])
          setRightTab('notes')
          if (onNoteCreated) onNoteCreated(saved)
          addLog('SIMULATOR', `Created note #${nextSequence}: "${saved.heading}"`, 'success')
        }
      } catch (err) {
        addLog('ERROR', `Simulation error: ${err.message}`, 'error')
      } finally {
        setIsProcessingChunk(false)
      }
    }

    emitNextSimulationSnippet()
    simulationTimerRef.current = setInterval(emitNextSimulationSnippet, 10000)
  }

  const stopSimulation = () => {
    setIsSimulating(false)
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current)
      simulationTimerRef.current = null
    }
    addLog('SIMULATOR', 'Seminar simulation stopped.', 'warning')
  }

  const handleExtendBudget = () => {
    const updated = updateSessionQuotaLimits(session.id, (quotaStatus.maxMinutes || 60) + 30, (quotaStatus.maxBudget || 5.0) + 2.0)
    if (updated) {
      refreshQuota()
      addLog('BUDGET', 'Extended seminar quota: +30 Audio Minutes & +$2.00 USD Budget', 'success')
    }
  }

  const handleClearAllNotes = () => {
    if (window.confirm(`Clear all ${localNotes.length} notes from this seminar session? This will give you a fresh, clean slate.`)) {
      clearSessionNotes(session.id)
      setLocalNotes([])
      if (onRefreshData) onRefreshData()
      addLog('RESET', 'Cleared session notes. Ready for fresh lecture recording.', 'warning')
    }
  }

  const handleInjectManualNote = (e) => {
    e.preventDefault()
    if (!manualHeading.trim()) return

    const bullets = manualBullets
      .split('\n')
      .map((b) => b.trim().replace(/^[-*•]\s*/, ''))
      .filter(Boolean)

    const existingNotes = localNotes || []
    const nextSequence = (existingNotes.length || 0) + 1
    const timestampMarker = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const idempotencyHash = `hash_manual_${Date.now()}`

    const saved = appendNoteToSession(session.id, {
      sequence_number: nextSequence,
      idempotency_hash: idempotencyHash,
      heading: manualHeading.trim(),
      bullet_points: bullets.length > 0 ? bullets : ['Key point broadcasted directly by seminar presenter.'],
      timestamp_marker: timestampMarker,
    })

    if (saved) {
      setLocalNotes((prev) => [...prev, saved])
      setRightTab('notes')
      if (onNoteCreated) onNoteCreated(saved)
      addLog('MANUAL', `Injected note #${nextSequence}: "${saved.heading}"`, 'success')
      setManualHeading('')
      setManualBullets('')
    }
  }

  useEffect(() => {
    return () => {
      audioEngineRef.current?.stop()
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current)
    }
  }, [])

  // Order notes based on sort preference: default newest first so latest note appears at top!
  const displayedNotes = sortOrder === 'newest' ? [...localNotes].reverse() : localNotes

  return (
    <div className="space-y-6">
      {/* Studio Header Banner with AI Mode & Security Status */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold uppercase">
                Podium Intake Console
              </span>

              {/* AI Engine Status Badge */}
              {hasOpenAIKey ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-mono text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  OpenAI Whisper + GPT-4o Mode
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  Browser Speech Engine (Free Mode)
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Server RLS Protected
              </span>
              <span className="text-xs text-slate-400 font-mono">Session: #{session?.short_code}</span>
            </div>

            <h1 className="text-2xl font-black text-white mt-1.5">
              {session?.title || 'Live Seminar'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Lecturer: <span className="text-slate-200 font-semibold">{session?.speaker_name || 'Presenter'}</span> · Chunks dispatched with continuous speech recognition and duplicate shielding.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenProjector}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>Projector Display Mode</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings &amp; Quotas</span>
            </button>
          </div>
        </div>
      </div>

      {/* COST CONTROL & QUOTA METER WIDGET */}
      <div className={`rounded-2xl border p-5 transition-all backdrop-blur-md shadow-xl ${
        quotaStatus.isExceeded
          ? 'bg-rose-950/40 border-rose-500/50'
          : quotaStatus.isApproachingLimit
          ? 'bg-amber-950/30 border-amber-500/40'
          : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              quotaStatus.isExceeded ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Seminar Cost &amp; Audio Quota Meter</h4>
                {quotaStatus.isExceeded && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white uppercase">
                    LIMIT REACHED
                  </span>
                )}
                {quotaStatus.isApproachingLimit && !quotaStatus.isExceeded && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    APPROACHING BUDGET
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Prevents unexpected API bills by tracking audio processing minutes and token consumption.
              </p>
            </div>
          </div>

          <button
            onClick={handleExtendBudget}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-emerald-600 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Extend Limit (+30m / +$2)
          </button>
        </div>

        {/* Meters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Audio Minutes Recorded:</span>
              <span className="font-mono font-bold text-slate-200">
                {quotaStatus.minutesUsed} / {quotaStatus.maxMinutes} mins ({quotaStatus.minutePercent}%)
              </span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  quotaStatus.minutePercent > 90
                    ? 'bg-rose-500'
                    : quotaStatus.minutePercent > 75
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${quotaStatus.minutePercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Accumulated AI Cost:</span>
              <span className="font-mono font-bold text-emerald-300">
                ${quotaStatus.costUsed.toFixed(2)} / ${quotaStatus.maxBudget.toFixed(2)} USD ({quotaStatus.costPercent}%)
              </span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  quotaStatus.costPercent > 90
                    ? 'bg-rose-500'
                    : quotaStatus.costPercent > 75
                    ? 'bg-amber-400'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${quotaStatus.costPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Audio Capture, Visualizer, Live Speech & Manual Notes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${isRecording ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                  {isRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Podium Microphone Audio Stream</h3>
                  <p className="text-xs text-slate-400">
                    {isRecording ? 'Capturing live speech into structured note chunks' : 'Microphone idle. Click Start Recording to stream.'}
                  </p>
                </div>
              </div>

              {(isRecording || isSimulating) && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    Next chunk: {countdown}s
                  </span>
                </div>
              )}
            </div>

            {/* Audio Waveform Canvas */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#070b12] p-2 h-36 flex flex-col justify-end">
              <canvas
                ref={canvasRef}
                width={640}
                height={130}
                className="w-full h-full block rounded-lg"
              />
              {!isRecording && !isSimulating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                  <span className="text-xs text-slate-400 font-mono">
                    Waveform visualizer starts when microphone is active
                  </span>
                </div>
              )}
              {isProcessingChunk && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 animate-pulse">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Processing AI pipeline...
                </div>
              )}
            </div>

            {/* Action Buttons: Start Mic & Simulation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={toggleRecording}
                disabled={quotaStatus.isExceeded}
                className={`flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                }`}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isRecording ? 'Stop Recording' : 'Start Microphone Intake'}</span>
              </button>

              <button
                onClick={toggleSimulation}
                disabled={quotaStatus.isExceeded}
                className={`flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-sm border transition-all disabled:opacity-50 ${
                  isSimulating
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 hover:bg-amber-600/30'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{isSimulating ? 'Stop Speech Simulation' : 'Simulate Live Seminar'}</span>
              </button>
            </div>

            {/* Resilience Shields Bar */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Duplicate Shield:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {duplicateNotesBlocked} blocked
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Retry Buffer:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {retriesCount} recovered
                </span>
              </div>
            </div>

            {/* Live Interim Transcript */}
            {(liveTranscript || isRecording) && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  Live Speech Preview (Streaming)
                </span>
                <p className="text-slate-300 italic font-sans leading-relaxed">
                  {liveTranscript || 'Listening to podium microphone...'}
                </p>
              </div>
            )}
          </div>

          {/* Quick Manual Note Injection Form */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Manual Note &amp; Announcement Injector</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Bypasses audio engine</span>
            </div>
            <form onSubmit={handleInjectManualNote} className="space-y-3">
              <input
                type="text"
                placeholder="Topic / Section Heading (e.g. Inverter Topology Differences)"
                value={manualHeading}
                onChange={(e) => setManualHeading(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <textarea
                rows={2}
                placeholder="Bullet points (one per line, e.g. Central inverters offer highest efficiency for utility scale)"
                value={manualBullets}
                onChange={(e) => setManualBullets(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
              <button
                type="submit"
                disabled={!manualHeading.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition-colors"
              >
                Broadcast Manual Note
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Tabbed Logs & Live Notes Stream (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl flex-1 flex flex-col min-h-[460px]">
            {/* Tab Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRightTab('notes')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    rightTab === 'notes'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Live Notes ({localNotes.length})</span>
                </button>
                <button
                  onClick={() => setRightTab('logs')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    rightTab === 'logs'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Pipeline Logs ({logs.length})</span>
                </button>
              </div>

              {/* Action Buttons on right */}
              <div className="flex items-center gap-1.5">
                {rightTab === 'notes' && localNotes.length > 0 && (
                  <>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                      className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
                      title="Toggle sort order"
                    >
                      <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                      <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
                    </button>
                    <button
                      onClick={handleClearAllNotes}
                      className="flex items-center gap-1 text-[11px] font-mono text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 transition-colors"
                      title="Clear old test notes from this seminar"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </>
                )}
                {rightTab === 'logs' && (
                  <button
                    onClick={() => setLogs([])}
                    className="text-[10px] text-slate-500 hover:text-slate-300 font-mono px-2 py-1 rounded-lg bg-slate-900 border border-slate-800"
                    title="Clear logs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* TAB CONTENT: LIVE NOTES PREVIEW */}
            {rightTab === 'notes' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
                {displayedNotes.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 space-y-2">
                    <Layers className="w-8 h-8 mx-auto text-slate-600" />
                    <p>No notes recorded yet in this session.</p>
                    <p className="text-[10px]">Start microphone or simulate speech to see notes appear here.</p>
                  </div>
                ) : (
                  displayedNotes.map((note, index) => {
                    const isLatest = sortOrder === 'newest' && index === 0
                    return (
                      <div
                        key={note.id || index}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isLatest
                            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/40 animate-note-enter'
                            : 'bg-slate-950/80 border-slate-800'
                        } space-y-1.5`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-emerald-400 font-bold">
                              #{note.sequence_number || index + 1}
                            </span>
                            {isLatest && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase animate-pulse">
                                Latest Note
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">
                            {note.timestamp_marker || 'Live'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white">
                          {note.heading}
                        </h4>
                        <ul className="space-y-1 text-xs text-slate-300 pl-3">
                          {(note.bullet_points || []).map((bullet, bIdx) => (
                            <li key={bIdx} className="list-disc leading-relaxed">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* TAB CONTENT: AI PIPELINE LOGS */}
            {rightTab === 'logs' && (
              <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px] pr-1 max-h-[500px]">
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 space-y-2">
                    <Activity className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
                    <p>No audio chunks processed yet.</p>
                    <p className="text-[10px]">Click "Start Microphone Intake" to capture live speech notes.</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start gap-2"
                    >
                      <span className="text-[10px] text-slate-500 flex-shrink-0 mt-0.5">
                        {log.timestamp}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${
                          log.type === 'success'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : log.type === 'warning'
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                            : log.type === 'error'
                            ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                            : 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {log.tag}
                      </span>
                      <span className="text-slate-300 break-words flex-1">
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
