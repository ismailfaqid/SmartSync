import React, { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import DualPaneLayout from './components/DualPaneLayout'
import MobileFeedView from './components/MobileFeedView'
import PodiumStudio from './components/PodiumStudio'
import ProjectorDisplay from './components/ProjectorDisplay'
import QRCodeModal from './components/QRCodeModal'
import SettingsModal from './components/SettingsModal'
import CreateEventModal from './components/CreateEventModal'
import EventSuccessModal from './components/EventSuccessModal'
import AdminDashboard from './components/AdminDashboard'
import LoginModal from './components/LoginModal'

// Dedicated Authentication & Dashboard Pages
import RegisterPage from './pages/RegisterPage'
import OrganizerLoginPage from './pages/OrganizerLoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import OrganizerDashboardPage from './pages/OrganizerDashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import LandingPage from './pages/LandingPage'

import {
  getStoredSessions,
  getStoredActiveSessionId,
  setStoredActiveSessionId
} from './lib/storage'
import {
  subscribeToSessionNotes,
  fetchSessionNotesHistory,
  getStoredSupabaseConfig
} from './lib/supabase'
import { getCurrentSession, setCurrentSession, signOutUser } from './lib/authService'
import { getUnreadNotificationCount } from './lib/notifications'
import { ShieldAlert, Ban, Clock } from 'lucide-react'

// Main Live Seminar View Component
function LiveSeminarFeed({
  sessions,
  activeSessionId,
  setActiveSessionId,
  currentUser,
  currentView,
  setCurrentView,
  isMobile,
  supabaseConfig,
  connectionStatus,
  catchupToast,
  unreadNotifsCount,
  onOpenQR,
  onOpenSettings,
  onOpenProjector,
  onOpenCreateEvent,
  onOpenAdminDashboard,
  onOpenLogin,
  onNoteCreated,
  onRefreshData
}) {
  const { shortCode } = useParams()
  const navigate = useNavigate()

  // Match session from route params /live/:shortCode or activeSessionId
  useEffect(() => {
    if (shortCode) {
      const match = sessions.find(
        (s) => s.short_code.toLowerCase() === shortCode.toLowerCase() || s.id === shortCode
      )
      if (match && match.id !== activeSessionId) {
        setActiveSessionId(match.id)
        setStoredActiveSessionId(match.id)
      }
    }
  }, [shortCode, sessions, activeSessionId, setActiveSessionId])

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null
  const notes = activeSession?.initial_notes || []
  const latestNote = notes.length > 0 ? notes[notes.length - 1] : null

  // Access guard: if cancelled or pending approval and not organizer/admin, block public access
  const isEventCancelled = activeSession?.status === 'cancelled' || !activeSession?.is_active
  const isEventPending = activeSession?.status === 'pending_approval'
  const isOrganizerOrAdmin =
    currentUser?.role === 'admin' ||
    (currentUser?.role === 'organizer' && currentUser?.id === activeSession?.organizer_id)
  const isBlockedForAttendee = (isEventCancelled || isEventPending) && !isOrganizerOrAdmin

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      {/* Toast Notice */}
      {catchupToast && (
        <div className="fixed top-18 right-6 z-50 px-4 py-2 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 text-xs font-semibold shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{catchupToast}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id)
          setStoredActiveSessionId(id)
          const sess = sessions.find((s) => s.id === id)
          if (sess) {
            window.location.hash = sess.short_code
          }
        }}
        onOpenQR={onOpenQR}
        onOpenSettings={onOpenSettings}
        onOpenProjector={onOpenProjector}
        onOpenCreateEvent={onOpenCreateEvent}
        onOpenAdminDashboard={onOpenAdminDashboard}
        onOpenLogin={onOpenLogin}
        currentUser={currentUser}
        unreadNotifsCount={unreadNotifsCount}
        isSupabase={supabaseConfig.isConfigured}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {isBlockedForAttendee ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center glass-panel rounded-3xl border border-slate-800 shadow-2xl max-w-xl mx-auto my-12">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
              {isEventPending ? <Clock className="w-8 h-8" /> : <Ban className="w-8 h-8" />}
            </div>
            <h2 className="text-xl font-bold text-white">
              {isEventPending ? 'Seminar Pending Admin Approval' : 'Seminar Unpublished or Cancelled'}
            </h2>
            <p className="text-xs text-slate-400 max-w-md mt-2 leading-relaxed">
              {isEventPending
                ? 'This event has been submitted and is currently awaiting administrator review. Live notes will become accessible immediately once approved.'
                : 'This seminar session has been unpublished by the administrator. Live note synchronization and recordings are temporarily unavailable.'}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => {
                  const published = sessions.find((s) => s.is_active && s.status === 'published')
                  if (published) {
                    setActiveSessionId(published.id)
                    setStoredActiveSessionId(published.id)
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors"
              >
                Browse Active Seminars
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={currentView === 'podium' ? 'block' : 'hidden'}>
              <PodiumStudio
                session={activeSession}
                onNoteCreated={onNoteCreated}
                isSupabase={supabaseConfig.isConfigured}
                onOpenProjector={onOpenProjector}
                onOpenSettings={onOpenSettings}
                onRefreshData={onRefreshData}
              />
            </div>
            <div className={currentView === 'feed' ? 'block' : 'hidden'}>
              {isMobile ? (
                <MobileFeedView
                  session={activeSession}
                  notes={notes}
                  isSupabase={supabaseConfig.isConfigured}
                  connectionState={connectionStatus}
                  onOpenQR={onOpenQR}
                />
              ) : (
                <DualPaneLayout
                  session={activeSession}
                  notes={notes}
                  isSupabase={supabaseConfig.isConfigured}
                  connectionState={connectionStatus}
                  onOpenQR={onOpenQR}
                />
              )}
            </div>
          </>
        )}
      </main>

      {/* Fullscreen Projector Screen View */}
      {currentView === 'projector' && (
        <ProjectorDisplay
          session={activeSession}
          latestNote={latestNote}
          onClose={() => setCurrentView('feed')}
        />
      )}
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const [currentUser, setCurrentUser] = useState(() => getCurrentSession())
  const [sessions, setSessions] = useState(() => getStoredSessions())
  const [activeSessionId, setActiveSessionId] = useState(() => getStoredActiveSessionId())
  const [currentView, setCurrentView] = useState('feed')

  // Modals state
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [newlyCreatedSession, setNewlyCreatedSession] = useState(null)

  const [isMobile, setIsMobile] = useState(false)
  const [supabaseConfig, setSupabaseConfig] = useState(() => getStoredSupabaseConfig())
  const [connectionStatus, setConnectionStatus] = useState('connected')
  const [catchupToast, setCatchupToast] = useState('')
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(() => getUnreadNotificationCount())

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null

  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth < 1024)
    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  const refreshNotifications = () => {
    setUnreadNotifsCount(getUnreadNotificationCount())
  }

  // Handle incoming note from Supabase Realtime or Podium
  const handleNewNoteReceived = useCallback((newNote) => {
    if (!newNote) return

    setSessions((prevSessions) => {
      return prevSessions.map((sess) => {
        if (sess.id === newNote.session_id || sess.short_code === newNote.session_id) {
          const existing = sess.initial_notes || []
          if (existing.some((n) => n.id === newNote.id || (n.idempotency_hash && n.idempotency_hash === newNote.idempotency_hash))) {
            return sess
          }
          const updated = [...existing, newNote].sort(
            (a, b) => (a.sequence_number || 0) - (b.sequence_number || 0)
          )
          return {
            ...sess,
            initial_notes: updated,
          }
        }
        return sess
      })
    })
  }, [])

  // Subscribe to real-time sync with automatic reconnection
  useEffect(() => {
    if (!activeSession) return

    const unsubscribe = subscribeToSessionNotes(
      activeSession.id,
      (note) => handleNewNoteReceived(note),
      (status) => setConnectionStatus(status.state)
    )

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [activeSession?.id, handleNewNoteReceived])

  const handleEventCreated = (newSession) => {
    setIsCreateEventOpen(false)
    setNewlyCreatedSession(newSession)
    setIsSuccessModalOpen(true)

    const fresh = getStoredSessions()
    setSessions(fresh)
    setActiveSessionId(newSession.id)
    setStoredActiveSessionId(newSession.id)
    refreshNotifications()
  }

  const handleRefreshData = () => {
    const fresh = getStoredSessions()
    setSessions(fresh)
    refreshNotifications()
  }

  const handleUserAuthenticated = (user) => {
    setCurrentUser(user)
    refreshNotifications()
  }

  const handleLogout = async () => {
    await signOutUser()
    setCurrentUser(null)
  }

  return (
    <>
      <Routes>
        {/* 1. Organizer Registration Route */}
        <Route
          path="/register"
          element={<RegisterPage onUserAuthenticated={handleUserAuthenticated} />}
        />

        {/* 2. Organizer Login Route */}
        <Route
          path="/login"
          element={<OrganizerLoginPage onUserAuthenticated={handleUserAuthenticated} />}
        />

        {/* 3. Administrator Login Route */}
        <Route
          path="/admin/login"
          element={<AdminLoginPage onUserAuthenticated={handleUserAuthenticated} />}
        />

        {/* 4. Password Reset Route */}
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        {/* 5. Organizer Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <OrganizerDashboardPage
              currentUser={currentUser}
              sessions={sessions}
              onSelectSession={(id) => {
                setActiveSessionId(id)
                setStoredActiveSessionId(id)
              }}
              onOpenCreateEvent={() => setIsCreateEventOpen(true)}
              onOpenQR={(session) => {
                setNewlyCreatedSession(session)
                setIsQRModalOpen(true)
              }}
              onLogout={handleLogout}
            />
          }
        />

        {/* 6. Administrator Dashboard Route */}
        <Route
          path="/admin"
          element={
            <AdminDashboardPage
              currentUser={currentUser}
              sessions={sessions}
              onSelectSession={(id) => {
                setActiveSessionId(id)
                setStoredActiveSessionId(id)
              }}
              onRefreshData={handleRefreshData}
              onLogout={handleLogout}
            />
          }
        />

        {/* 7. Public Seminar Live View by shortCode */}
        <Route
          path="/live/:shortCode"
          element={
            <LiveSeminarFeed
              sessions={sessions}
              activeSessionId={activeSessionId}
              setActiveSessionId={setActiveSessionId}
              currentUser={currentUser}
              currentView={currentView}
              setCurrentView={setCurrentView}
              isMobile={isMobile}
              supabaseConfig={supabaseConfig}
              connectionStatus={connectionStatus}
              catchupToast={catchupToast}
              unreadNotifsCount={unreadNotifsCount}
              onOpenQR={() => setIsQRModalOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenProjector={() => setCurrentView('projector')}
              onOpenCreateEvent={() => setIsCreateEventOpen(true)}
              onOpenAdminDashboard={() => navigate('/admin')}
              onOpenLogin={() => setIsLoginModalOpen(true)}
              onNoteCreated={handleNewNoteReceived}
              onRefreshData={handleRefreshData}
            />
          }
        />

        {/* 8. Public Landing / Marketing Page */}
        <Route
          path="/"
          element={<LandingPage currentUser={currentUser} />}
        />

        {/* 9. Live Feed Route (formerly root) */}
        <Route
          path="/feed"
          element={
            <LiveSeminarFeed
              sessions={sessions}
              activeSessionId={activeSessionId}
              setActiveSessionId={setActiveSessionId}
              currentUser={currentUser}
              currentView={currentView}
              setCurrentView={setCurrentView}
              isMobile={isMobile}
              supabaseConfig={supabaseConfig}
              connectionStatus={connectionStatus}
              catchupToast={catchupToast}
              unreadNotifsCount={unreadNotifsCount}
              onOpenQR={() => setIsQRModalOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenProjector={() => setCurrentView('projector')}
              onOpenCreateEvent={() => setIsCreateEventOpen(true)}
              onOpenAdminDashboard={() => navigate('/admin')}
              onOpenLogin={() => setIsLoginModalOpen(true)}
              onNoteCreated={handleNewNoteReceived}
              onRefreshData={handleRefreshData}
            />
          }
        />
      </Routes>

      {/* Global Modals */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        session={newlyCreatedSession || activeSession}
      />

      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        currentUser={currentUser}
        onEventCreated={handleEventCreated}
      />

      <EventSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        session={newlyCreatedSession}
        onOpenPodium={(sessionId) => {
          setActiveSessionId(sessionId)
          setCurrentView('podium')
          navigate('/feed')
        }}
        onOpenFeed={(sessionId) => {
          setActiveSessionId(sessionId)
          setCurrentView('feed')
          navigate('/feed')
        }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={handleUserAuthenticated}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={() => setSupabaseConfig(getStoredSupabaseConfig())}
        onResetData={handleRefreshData}
      />
    </>
  )
}
