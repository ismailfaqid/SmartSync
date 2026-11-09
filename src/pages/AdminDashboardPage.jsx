import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Users,
  Bell,
  Sliders,
  LogOut,
  Ban,
  CheckCircle,
  Radio,
  Search,
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react'
import { signOutUser } from '../lib/authService'
import AdminDashboard from '../components/AdminDashboard'

export default function AdminDashboardPage({
  currentUser,
  sessions,
  onSelectSession,
  onRefreshData,
  onLogout
}) {
  const navigate = useNavigate()

  // Strict Server-Side & Route Guard: Reject unauthorized access to admin dashboard
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#060913] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-rose-500/40 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto mb-4 flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">403 · Unauthorized Administrator Access</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            You do not hold system administrator permissions to access this command center. Public and organizer accounts are strictly barred from this route.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/admin/login"
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors"
            >
              Sign In as Administrator
            </Link>
            <Link
              to="/feed"
              className="py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
            >
              Return to Live Feed
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Render Full Admin Dashboard
  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col">
      <AdminDashboard
        isOpen={true}
        onClose={() => navigate('/feed')}
        sessions={sessions}
        onSelectSession={(id) => {
          if (onSelectSession) onSelectSession(id)
          navigate('/feed')
        }}
        onRefreshData={onRefreshData}
      />
    </div>
  )
}
