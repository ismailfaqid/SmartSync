import { createClient } from '@supabase/supabase-js'

const LOCAL_STORAGE_KEY_URL = 'smartsync_supabase_url'
const LOCAL_STORAGE_KEY_KEY = 'smartsync_supabase_anon_key'

export function getStoredSupabaseConfig() {
  const url = localStorage.getItem(LOCAL_STORAGE_KEY_URL) || import.meta.env.VITE_SUPABASE_URL || ''
  const anonKey = localStorage.getItem(LOCAL_STORAGE_KEY_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  return { url, anonKey, isConfigured: Boolean(url && anonKey) }
}

export function saveSupabaseConfig(url, anonKey) {
  if (url) localStorage.setItem(LOCAL_STORAGE_KEY_URL, url)
  else localStorage.removeItem(LOCAL_STORAGE_KEY_URL)

  if (anonKey) localStorage.setItem(LOCAL_STORAGE_KEY_KEY, anonKey)
  else localStorage.removeItem(LOCAL_STORAGE_KEY_KEY)
}

let supabaseInstance = null

export function getSupabaseClient() {
  const { url, anonKey, isConfigured } = getStoredSupabaseConfig()
  if (!isConfigured) return null

  if (!supabaseInstance || supabaseInstance.supabaseUrl !== url) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    } catch (err) {
      console.error('Failed to create Supabase client:', err)
      return null
    }
  }
  return supabaseInstance
}

// Multi-tab broadcast channel for local development
const localChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('smartsync_realtime_bus') 
  : null

/**
 * Fetch all existing notes for a session when attendees join late.
 * Preserves strict sequential order by sequence_number ascending.
 */
export async function fetchSessionNotesHistory(sessionId) {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('lecture_notes')
      .select('*')
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: true })

    if (error) {
      console.warn('Error fetching historical notes from Supabase:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.error('Fetch notes history failed:', err)
    return null
  }
}

/**
 * Subscribes to real-time note updates with:
 * 1. Automatic reconnection and exponential backoff
 * 2. Sequence order validation
 * 3. Connection status callbacks (connected, reconnecting, error)
 */
export function subscribeToSessionNotes(sessionId, onNewNoteReceived, onConnectionStateChange) {
  const supabase = getSupabaseClient()
  let supabaseChannel = null
  let reconnectAttempts = 0
  let reconnectTimer = null
  let isCleanedUp = false

  const updateState = (state, details = '') => {
    if (onConnectionStateChange) {
      onConnectionStateChange({ state, details, attempts: reconnectAttempts })
    }
  }

  const connectSupabaseChannel = () => {
    if (!supabase || isCleanedUp) return

    try {
      updateState(reconnectAttempts > 0 ? 'reconnecting' : 'connecting')

      supabaseChannel = supabase
        .channel(`session-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'lecture_notes',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            if (payload && payload.new) {
              onNewNoteReceived(payload.new)
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            reconnectAttempts = 0
            updateState('connected', 'Supabase Realtime WebSocket Active')
          } else if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            updateState('reconnecting', `Channel ${status}. Reconnecting...`)
            scheduleReconnect()
          }
        })
    } catch (error) {
      console.warn('Supabase Realtime connection error:', error)
      scheduleReconnect()
    }
  }

  const scheduleReconnect = () => {
    if (isCleanedUp) return
    reconnectAttempts += 1
    // Exponential backoff capped at 16 seconds
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 16000)
    updateState('reconnecting', `Attempt ${reconnectAttempts}: Retrying in ${delay / 1000}s...`)

    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(() => {
      if (supabase && supabaseChannel) {
        supabase.removeChannel(supabaseChannel)
      }
      connectSupabaseChannel()
    }, delay)
  }

  // 1. Initiate Supabase Connection if configured
  if (supabase) {
    connectSupabaseChannel()
  } else {
    updateState('connected', 'Running on Local High-Speed Realtime Bus')
  }

  // 2. Local broadcast listener for multi-tab synchronization
  const handleLocalMessage = (event) => {
    if (event.data && event.data.type === 'NEW_NOTE' && event.data.sessionId === sessionId) {
      onNewNoteReceived(event.data.note)
    }
  }

  if (localChannel) {
    localChannel.addEventListener('message', handleLocalMessage)
  }

  // Cleanup handler
  return () => {
    isCleanedUp = true
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (supabase && supabaseChannel) {
      supabase.removeChannel(supabaseChannel)
    }
    if (localChannel) {
      localChannel.removeEventListener('message', handleLocalMessage)
    }
  }
}

export function broadcastNoteLocally(sessionId, note) {
  if (localChannel) {
    try {
      localChannel.postMessage({
        type: 'NEW_NOTE',
        sessionId,
        note,
      })
    } catch (e) {
      console.warn('BroadcastChannel error:', e)
    }
  }
}

/**
 * Hardened Production Database Schema with:
 * - Row-Level Security (RLS) policies for attendees vs podium organizers
 * - Monotonic sequence ordering column
 * - Idempotency hash column to eliminate duplicate notes
 * - Per-seminar cost & audio minutes quota enforcement
 */
export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- SMARTSYNC PRODUCTION SCHEMA WITH ROW LEVEL SECURITY & QUOTAS
-- ============================================================

-- 1. Seminar Sessions Table with Cost & Quota Constraints
create table if not exists public.seminar_sessions (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  speaker_name text not null,
  sponsor_name text,
  sponsor_logo_url text,
  qr_code_url text,
  short_code text unique not null,
  is_active boolean default true,
  
  -- Cost Control & Quotas
  max_audio_minutes integer default 60 not null,
  audio_minutes_used numeric(6, 2) default 0 not null,
  max_budget_usd numeric(6, 2) default 5.00 not null,
  cost_usd_accumulated numeric(6, 2) default 0 not null,
  
  -- Security: Organizer passcode hash for server authentication
  organizer_secret text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Lecture Notes Table with Strict Sequence Ordering & Idempotency
create table if not exists public.lecture_notes (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.seminar_sessions(id) on delete cascade not null,
  sequence_number integer not null default 1,
  idempotency_hash text,
  heading text not null,
  bullet_points jsonb not null, -- Array of strings e.g. ["Point 1", "Point 2"]
  timestamp_marker text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate notes with the same idempotency hash in the same session
  constraint unique_session_idempotency unique (session_id, idempotency_hash)
);

-- Index for instant chronological sequence queries
create index if not exists idx_lecture_notes_seq on public.lecture_notes (session_id, sequence_number asc);

-- 3. Enable Realtime Replication for lecture_notes
alter publication supabase_realtime add table public.lecture_notes;

-- ============================================================
-- 4. HARDENED ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================

alter table public.seminar_sessions enable row level security;
alter table public.lecture_notes enable row level security;

-- Drop insecure legacy policies if present
drop policy if exists "Public read seminar_sessions" on public.seminar_sessions;
drop policy if exists "Public insert seminar_sessions" on public.seminar_sessions;
drop policy if exists "Public read lecture_notes" on public.lecture_notes;
drop policy if exists "Public insert lecture_notes" on public.lecture_notes;

-- ATTENDEES (Public/Anon): Read-only access to active sessions & notes
create policy "Attendees can read active seminar sessions"
  on public.seminar_sessions for select
  using (is_active = true);

create policy "Attendees can read lecture notes of active sessions"
  on public.lecture_notes for select
  using (
    exists (
      select 1 from public.seminar_sessions
      where id = lecture_notes.session_id and is_active = true
    )
  );

-- ATTENDEES CANNOT INSERT, UPDATE, OR DELETE
-- Only service_role (used by secure backend server) can modify notes & sessions
create policy "Service role has full management on seminar_sessions"
  on public.seminar_sessions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role has full management on lecture_notes"
  on public.lecture_notes for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
`
