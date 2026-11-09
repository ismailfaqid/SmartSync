import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  Radio,
  KeyRound,
  ArrowRight
} from 'lucide-react'
import { signInUser } from '../lib/authService'

export default function AdminLoginPage({ onUserAuthenticated }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setIsSubmitting(true)

    try {
      const user = await signInUser({
        email,
        password,
        requiredRole: 'admin'
      })

      if (user.role !== 'admin') {
        throw new Error('Access Denied: This portal is strictly restricted to system administrators.')
      }

      if (onUserAuthenticated) onUserAuthenticated(user)
      navigate('/admin')
    } catch (err) {
      setErrorMsg(err.message || 'Administrator authentication failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillTestAdmin = () => {
    setEmail('admin@smartsync.io')
    setPassword('Admin@123456')
  }

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* High-security indigo ambient background */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 p-0.5 shadow-lg shadow-indigo-950/60">
            <div className="w-full h-full bg-[#060913] rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <span className="text-2xl font-black text-white tracking-tight">SmartSync</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[11px] font-mono font-bold uppercase mb-2">
          <Lock className="w-3 h-3" />
          Restricted Portal · Role-Based Security
        </div>

        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          System Administrator Access
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Root platform management, event moderation, user suspension, and approval policies.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="py-8 px-6 sm:px-10 rounded-3xl border border-indigo-500/30 bg-[#090e1c] shadow-2xl space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Test Admin Fill */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> Pre-Seeded Admin Account:
            </span>
            <button
              type="button"
              onClick={fillTestAdmin}
              className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-xs text-white block">Dr. Sarah Chen</span>
                <span className="text-[10px] text-indigo-400 font-mono">admin@smartsync.io</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-mono">
                Click to Quick-Fill
              </span>
            </button>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@smartsync.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-950/60 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Authenticating Admin Role...' : 'Enter Admin Command Center'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>Are you a seminar organizer? </span>
            <Link to="/login" className="text-emerald-400 font-semibold hover:underline">
              Organizer Login
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-500">
          <Link to="/" className="hover:text-slate-300 transition-colors">
            ← Return to Public Seminar Feed
          </Link>
        </div>
      </div>
    </div>
  )
}
