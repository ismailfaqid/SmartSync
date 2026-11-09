import React, { useState } from 'react'
import {
  X,
  User,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  Building,
  Mail,
  Check
} from 'lucide-react'
import {
  DEFAULT_USERS,
  getRegisteredUsers,
  loginUser,
  registerOrganizer,
  switchTestUser,
  logoutUser
} from '../lib/auth'

export default function LoginModal({ isOpen, onClose, currentUser, onUserChanged }) {
  if (!isOpen) return null

  const [activeTab, setActiveTab] = useState('switch') // 'switch' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [organization, setOrganization] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleTestSwitch = (roleOrEmail) => {
    const user = switchTestUser(roleOrEmail)
    if (onUserChanged) onUserChanged(user)
    onClose()
  }

  const handleRegister = (e) => {
    e.preventDefault()
    setErrorMsg('')
    try {
      const user = registerOrganizer({ email, fullName, organization, password })
      setSuccessMsg('Organizer account registered and authorized for test mode!')
      setTimeout(() => {
        if (onUserChanged) onUserChanged(user)
        onClose()
      }, 1000)
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.')
    }
  }

  const handleLogout = () => {
    logoutUser()
    if (onUserChanged) onUserChanged(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-[#0b111e] p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Organizer &amp; Admin Access</h3>
          <p className="text-xs text-slate-400 mt-1">
            Sign in as an authorized organizer to create seminars, stream audio, or moderate as an administrator.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
          <button
            onClick={() => setActiveTab('switch')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'switch'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Instant Test Accounts
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Organizer
          </button>
        </div>

        {/* TAB 1: 1-CLICK INSTANT TEST ACCOUNTS */}
        {activeTab === 'switch' && (
          <div className="space-y-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Click an account to switch instantly:
            </span>

            {DEFAULT_USERS.map((u) => {
              const isCurrent = currentUser?.id === u.id
              return (
                <button
                  key={u.id}
                  onClick={() => handleTestSwitch(u.email)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-emerald-950/60 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">{u.full_name}</span>
                      <span className={`px-2 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">{u.email}</span>
                  </div>

                  <div className="flex-shrink-0">
                    {isCurrent ? (
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Active
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                        Select <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              )
            })}

            {/* Public Attendee / Guest Mode Option */}
            <button
              onClick={() => handleLogout()}
              className="w-full text-left p-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 hover:bg-slate-900/40 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-between"
            >
              <span>Browse as Public Attendee (No Login)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB 2: REGISTER NEW ORGANIZER */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 text-xs">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs">
                {successMsg}
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="Dr. Almaz Kebede"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="organizer@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Organization / Department</label>
              <input
                type="text"
                placeholder="Department of Computer Science"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition-colors shadow-lg shadow-emerald-950/50"
            >
              Register &amp; Start Testing
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
