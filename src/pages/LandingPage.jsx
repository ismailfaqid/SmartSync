import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Radio,
  Mic,
  Zap,
  Users,
  QrCode,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Play,
  Layers,
  Download,
  ChevronRight,
  Activity,
  CheckCircle2
} from 'lucide-react'

// Animated counter hook
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

const FEATURES = [
  {
    icon: Mic,
    color: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-950/60',
    title: 'AI Podium Studio',
    desc: '30-second chunked audio capture with Whisper STT. Transcribes and structures live speech into bullet-point notes in real time.'
  },
  {
    icon: Zap,
    color: 'from-cyan-500 to-blue-500',
    glow: 'shadow-cyan-950/60',
    title: 'Instant Sync via Supabase',
    desc: 'WebSocket-powered real-time delivery. Every new note appears on attendee screens within milliseconds — zero polling, zero refresh.'
  },
  {
    icon: QrCode,
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-950/60',
    title: 'One-Tap QR Attendance',
    desc: 'Auto-generated vector QR codes link directly to your live session URL. Attendees scan and instantly join the synchronized note stream.'
  },
  {
    icon: ShieldCheck,
    color: 'from-rose-500 to-pink-600',
    glow: 'shadow-rose-950/60',
    title: 'Role-Based Access Control',
    desc: 'Admin approval workflows, organizer verification, session moderation, and Supabase Row-Level Security enforced server-side.'
  },
  {
    icon: Layers,
    color: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-950/60',
    title: 'Dual-Pane Attendee View',
    desc: 'Beautiful desktop layout with table of contents, live sync indicator, and an immersive mobile-optimized feed for on-the-go attendees.'
  },
  {
    icon: Download,
    color: 'from-emerald-400 to-lime-500',
    glow: 'shadow-lime-950/60',
    title: 'Multi-Format Export',
    desc: 'Export session notes as PDF, copy as Markdown, share to WhatsApp, or cast to a fullscreen Projector Display in one click.'
  }
]

const STATS = [
  { value: 342, suffix: '+', label: 'Live Attendees / Session', color: 'text-emerald-400' },
  { value: 98,  suffix: '%', label: 'Transcription Accuracy',  color: 'text-cyan-400'    },
  { value: 30,  suffix: 's', label: 'Chunk Processing Interval', color: 'text-violet-400' },
  { value: 5,   suffix: '$', prefix: '<', label: 'Cost Per 60-min Seminar', color: 'text-amber-400' }
]

const WORKFLOW_STEPS = [
  { num: '01', icon: Radio,    title: 'Create Seminar',  desc: 'Fill in session details, speaker info, and sponsor. Auto-approves or enters admin review queue.' },
  { num: '02', icon: Mic,      title: 'Start Podium',    desc: 'Launch the Podium Studio. Whisper + GPT-4o processes every 30-second audio chunk automatically.' },
  { num: '03', icon: Zap,      title: 'Notes Go Live',   desc: 'Bullet points appear on attendee screens in real time via Supabase Realtime WebSocket channels.' },
  { num: '04', icon: Download, title: 'Export & Share',  desc: 'Attendees export a beautifully formatted PDF or copy Markdown notes with a single click.' }
]

export default function LandingPage({ currentUser }) {
  const statsRef = useRef(null)
  const [statsVisible, setStatsVisible] = useState(false)
  const [heroBlobPos, setHeroBlobPos] = useState({ x: 60, y: 40 })

  // Parallax blob on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      setHeroBlobPos({
        x: 50 + (e.clientX / window.innerWidth - 0.5) * 20,
        y: 40 + (e.clientY / window.innerHeight - 0.5) * 20
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Intersection observer for stats counter trigger
  useEffect(() => {
    if (!statsRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true) },
      { threshold: 0.3 }
    )
    observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  const count0 = useCountUp(342, 1800, statsVisible)
  const count1 = useCountUp(98,  1800, statsVisible)
  const count2 = useCountUp(30,  1200, statsVisible)
  const count3 = useCountUp(5,   1000, statsVisible)
  const counts  = [count0, count1, count2, count3]

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 overflow-x-hidden">
      {/* ─── NAVBAR ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#080c14]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-950/40">
              <div className="w-full h-full bg-[#080c14] rounded-[10px] flex items-center justify-center">
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">SmartSync</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 font-mono">BETA</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features"     className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing"      className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <Link
                to={currentUser.role === 'admin' ? '/admin' : '/dashboard'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all"
              >
                <Activity className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-xs font-bold text-white shadow-md shadow-emerald-950/50 transition-all"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO ───────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Animated gradient blob */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{
            background: `radial-gradient(ellipse 70% 55% at ${heroBlobPos.x}% ${heroBlobPos.y}%, rgba(16,185,129,0.13) 0%, rgba(6,182,212,0.07) 40%, transparent 70%)`
          }}
        />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            Powered by Whisper · GPT-4o · Supabase Realtime
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] text-white mb-6">
            AI-Powered
            <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Live Seminar Notes
            </span>
            <span className="block text-4xl sm:text-5xl text-slate-300 font-bold mt-2">
              Synced to Every Attendee
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed mb-10">
            SmartSync captures your spoken words in 30-second chunks, converts them to structured
            bullet-point takeaways, and broadcasts them to attendee screens in real time —
            no typing, no lag.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="group flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-sm font-bold text-white shadow-xl shadow-emerald-950/60 transition-all hover:scale-[1.02] active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              Start Your First Seminar — Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/live/jijiga-2026"
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-slate-600 text-sm font-semibold text-slate-200 hover:text-white transition-all"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              Watch Live Demo
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-8 text-xs text-slate-500">
            {['No credit card required', 'Supabase RLS security', 'Own API key model', 'PWA installable'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
                {t}
              </span>
            ))}
          </div>

          {/* Live feed preview */}
          <div className="mt-16 mx-auto max-w-2xl glass-panel rounded-2xl border border-slate-700/80 p-4 shadow-2xl text-left">
            <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-800">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase">Live Session · jijiga-2026</span>
              <span className="ml-auto text-[10px] text-slate-500 font-mono">342 attendees</span>
            </div>
            {[
              { h: 'SAR Telemetry & Root-Zone Moisture Indexing', b: 'Sub-50cm precision using Sentinel-1 radar bands coupled with IoT probes.' },
              { h: 'Edge-Inference Quantization', b: '4-bit quantized transformers cut latency from 1.4s to 42ms at perimeter nodes.' },
              { h: 'Decentralized Agricultural Data Trusts', b: 'Cooperative data pools generate $140/hectare annual dividends for smallholders.' }
            ].map((note, i) => (
              <div key={i} className="flex gap-2.5 items-start py-2 border-b border-slate-800/50 last:border-0">
                <span className="mt-0.5 text-[10px] font-mono font-bold text-slate-600 flex-shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                <div>
                  <p className="text-xs font-bold text-slate-200">{note.h}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{note.b}</p>
                </div>
              </div>
            ))}
            <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-600">
              <span className="flex items-center gap-1 text-emerald-500"><Sparkles className="w-3 h-3" /> 9 key insights extracted</span>
              <span className="font-mono text-cyan-500/70">Whisper + GPT-4o · $0.18</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ──────────────────────────────────────────── */}
      <section ref={statsRef} className="border-y border-slate-800/60 bg-slate-950/40">
        <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <div key={i}>
              <div className={`text-4xl font-black font-mono ${s.color}`}>
                {s.prefix || ''}{counts[i]}{s.suffix}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES GRID ──────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold mb-4 uppercase">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Everything for Live AI Notes</h2>
          <p className="text-slate-400 mt-3 text-base max-w-xl mx-auto">
            Built end-to-end for enterprise seminars, academic lectures, and industry conferences.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div key={i} className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800/80 group">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg ${f.glow} group-hover:scale-110 transition-transform`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-slate-800/60 bg-slate-950/30 py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-mono font-bold mb-4 uppercase">
              Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Live in 4 Simple Steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={i} className="relative">
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(100%-8px)] w-full h-px bg-gradient-to-r from-slate-700 to-transparent z-0" />
                )}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800 relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl font-black font-mono text-slate-700">{step.num}</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <step.icon className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ────────────────────────────────────────────── */}
      <section id="pricing" className="border-t border-slate-800/60 py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold mb-4 uppercase">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">Pay Only for What You Use</h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto mb-10">
            SmartSync uses your own OpenAI API key — no markup, no hidden fees.
            A typical 60-minute seminar costs under $5 in Whisper + GPT-4o tokens.
          </p>

          <div className="glass-panel rounded-3xl border border-slate-700 p-8 text-left shadow-2xl">
            <div className="grid sm:grid-cols-3 gap-6 text-sm mb-6">
              {[
                { model: 'Whisper v2',   cost: '$0.006/min',    use: 'Audio Transcription' },
                { model: 'GPT-4o',       cost: '$2.50/M tokens', use: 'Structured Summarization' },
                { model: 'Supabase',     cost: 'Free tier',     use: 'Realtime Sync + Auth' }
              ].map((p) => (
                <div key={p.model} className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 mb-1 uppercase">{p.use}</div>
                  <div className="font-bold text-white text-base">{p.model}</div>
                  <div className="text-emerald-400 font-mono text-sm font-bold mt-1">{p.cost}</div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-300">
                Built-in quota guards prevent runaway costs — set max audio minutes and max
                budget per session from the Podium Studio controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FOOTER ─────────────────────────────────────────── */}
      <section className="border-t border-slate-800/60 bg-gradient-to-b from-slate-950/60 to-[#080c14] py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-2xl shadow-emerald-950/60">
            <div className="w-full h-full bg-[#080c14] rounded-[14px] flex items-center justify-center">
              <Radio className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">Ready to Go Live?</h2>
          <p className="text-slate-400 text-base mb-10 max-w-xl mx-auto">
            Register as an organizer and run your first AI-powered live seminar in minutes.
            No credit card, no setup fees.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-sm font-bold text-white shadow-xl shadow-emerald-950/60 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              Create Organizer Account
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/live/jijiga-2026"
              className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-slate-700 hover:border-emerald-500/40 text-sm font-semibold text-slate-300 hover:text-white transition-all"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              View Demo Session
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/40 py-8 px-4 text-center text-xs text-slate-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Radio className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-bold text-slate-500">SmartSync</span>
        </div>
        <p>AI-Powered Live Seminar Platform · Built with Whisper, GPT-4o, Supabase &amp; React</p>
      </footer>
    </div>
  )
}
