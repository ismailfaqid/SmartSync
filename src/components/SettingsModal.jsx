import React, { useState } from 'react'
import {
  X,
  Database,
  Key,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Clock,
  Lock
} from 'lucide-react'
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  SUPABASE_SQL_SCHEMA
} from '../lib/supabase'
import {
  getOpenAIKey,
  setOpenAIKey,
  resetToDefaultData,
  getStoredSessions,
  saveSessions,
  getStoredActiveSessionId
} from '../lib/storage'

export default function SettingsModal({ isOpen, onClose, onConfigSaved, onResetData }) {
  if (!isOpen) return null

  const storedSupabase = getStoredSupabaseConfig()
  const sessions = getStoredSessions()
  const activeSessionId = getStoredActiveSessionId()
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]

  const [supabaseUrl, setSupabaseUrl] = useState(storedSupabase.url)
  const [supabaseKey, setSupabaseKey] = useState(storedSupabase.anonKey)
  const [openaiKey, setOpenaiKeyValue] = useState(getOpenAIKey())
  const [maxMinutes, setMaxMinutes] = useState(activeSession?.max_audio_minutes || 60)
  const [maxBudget, setMaxBudget] = useState(activeSession?.max_budget_usd || 5.00)
  
  const [showKey, setShowKey] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('security') // 'security' | 'cost' | 'schema'

  const handleSave = (e) => {
    e.preventDefault()
    saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim())
    setOpenAIKey(openaiKey.trim())

    // Update active session limits
    if (activeSession) {
      const updated = sessions.map((s) => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            max_audio_minutes: Number(maxMinutes),
            max_budget_usd: Number(maxBudget),
          }
        }
        return s
      })
      saveSessions(updated)
    }

    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
    if (onConfigSaved) onConfigSaved()
  }

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA)
      setCopiedSql(true)
      setTimeout(() => setCopiedSql(false), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  const handleReset = () => {
    if (window.confirm('Reset all sessions and notes back to initial seminar demo data?')) {
      resetToDefaultData()
      if (onResetData) onResetData()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-[#0b111e] p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">System Settings &amp; Architecture</h2>
            <p className="text-xs text-slate-400">
              Manage API security, Row-Level Security, cost controls, and database schema.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'security'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Security &amp; Keys
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cost')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'cost'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cost &amp; Quotas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'schema'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SQL &amp; RLS Policies
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: SECURITY & KEYS */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Security Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                <Lock className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white">Key Isolation &amp; Zero Attendee Exposure:</span> In production, API keys and Supabase service credentials stay strictly on the server via <code className="text-emerald-400">/api/process-audio</code>. Attendees only receive public read-only WebSocket feeds.
                </div>
              </div>

              {/* Supabase Config */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Supabase Realtime PostgreSQL</h3>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    supabaseUrl && supabaseKey
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {supabaseUrl && supabaseKey ? 'Configured' : 'Local High-Speed Bus'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Project URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://xyzcompany.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Anon / Public Key
                    </label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* OpenAI Config */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">OpenAI API Key (Podium Organizer)</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Whisper-1 + GPT-4o</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      placeholder="sk-proj-..."
                      value={openaiKey}
                      onChange={(e) => setOpenaiKeyValue(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Saved locally in your organizer browser session or configure on server via <code className="text-slate-400">.env</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COST & QUOTAS */}
          {activeTab === 'cost' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Per-Seminar Budget Limits &amp; Auto-Cutoff</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Max Audio Minutes Allowed
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={maxMinutes}
                      onChange={(e) => setMaxMinutes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Default: 60 minutes</span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Max Seminar Budget (USD)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={1}
                      max={50}
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Default: $5.00 USD</span>
                  </div>
                </div>

                {/* Pricing Reference Breakdown */}
                <div className="pt-3 border-t border-slate-800 text-xs space-y-1.5 text-slate-400">
                  <span className="font-bold text-slate-300 block mb-1">Live Seminar Unit Economics:</span>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span>Whisper Audio STT ($0.006/min):</span>
                    <span className="text-emerald-400">~$0.36 / hour</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span>GPT-4o Structured Bullet Extraction:</span>
                    <span className="text-emerald-400">~$0.24 / hour</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px] font-bold text-white pt-1 border-t border-slate-800/60">
                    <span>Total Estimated Cost:</span>
                    <span className="text-emerald-300">~$0.60 per live hour</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SQL & RLS */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    PostgreSQL Schema with RLS &amp; Sequence Ordering
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-emerald-600 hover:text-white transition-colors"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-56">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 py-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Demo Seminars</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-lg shadow-emerald-950/60 w-full sm:w-auto"
              >
                {saveSuccess ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{saveSuccess ? 'Settings Saved!' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
