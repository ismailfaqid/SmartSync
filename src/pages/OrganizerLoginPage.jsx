import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LogIn,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Radio,
  UserCheck,
  ShieldAlert
} from 'lucide-react'
import { signInUser } from '../lib/authService'

export default function OrganizerLoginPage({ onUserAuthenticated }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setIsSubmitting(true)

    try {
      const user = await signInUser({
        email,
        password,
        requiredRole: 'organizer'
      })

      if (onUserAuthenticated) onUserAuthenticated(user)

      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillTestAccount = (testEmail) => {
    setEmail(testEmail)
    setPassword('Organizer@123')
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-950/40">
            <div className="w-full h-full bg-[#080c14] rounded-[10px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <span className="text-2xl font-black text-white tracking-tight">SmartSync</span>
        </Link>

        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Organizer Login
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Sign in to manage your seminar sessions, stream audio chunks, and view attendee analytics.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Test Login Buttons */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Quick-Fill Organizer Account:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillTestAccount('organizer@smartsync.io')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors text-left"
              >
                <span className="font-bold block truncate">Dr. Almaz</span>
                <span className="text-[10px] text-emerald-400 font-mono">organizer@...</span>
              </button>
              <button
                type="button"
                onClick={() => fillTestAccount('marcus@smartsync.io')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors text-left"
              >
                <span className="font-bold block truncate">Marcus Vance</span>
                <span className="text-[10px] text-emerald-400 font-mono">marcus@...</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Organizer Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="organizer@smartsync.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[11px] text-emerald-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-lg shadow-emerald-950/60 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying Credentials...' : 'Sign In to Dashboard'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2 text-center text-xs text-slate-400">
            <div>
              <span>Need an organizer account? </span>
              <Link to="/register" className="text-emerald-400 font-semibold hover:underline">
                Register here
              </Link>
            </div>
            <div>
              <Link to="/admin/login" className="text-[11px] text-indigo-400 hover:underline flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Go to Administrator Login Portal</span>
              </Link>
            </div>
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
