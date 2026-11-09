-- ==============================================================================
-- SMARTSYNC PRODUCTION DATABASE SCHEMA WITH SUPABASE AUTH & ROW-LEVEL SECURITY
-- ==============================================================================

-- 1. Create User Profiles Table linked to Supabase auth.users
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  organization_name text not null,
  role text not null check (role in ('admin', 'organizer', 'attendee')) default 'organizer',
  is_authorized boolean default true not null,
  is_suspended boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index on email and role
create index if not exists idx_user_profiles_email on public.user_profiles (email);
create index if not exists idx_user_profiles_role on public.user_profiles (role);

-- 2. Helper Security Function: Check if current authenticated user is an administrator
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid()
      and role = 'admin'
      and is_suspended = false
  );
$$;

-- 3. Helper Security Function: Check if current authenticated user is an authorized organizer
create or replace function public.is_authorized_organizer()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid()
      and role in ('organizer', 'admin')
      and is_authorized = true
      and is_suspended = false
  );
$$;

-- 4. Automatically create user_profile when a new user signs up through Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_profiles (
    id,
    email,
    full_name,
    organization_name,
    role,
    is_authorized,
    is_suspended
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Seminar Organizer'),
    coalesce(new.raw_user_meta_data->>'organization_name', 'Independent Organization'),
    'organizer', -- Default role is strictly organizer; NEVER admin from signup
    true,        -- In TEST MODE, automatically activated; set to false for production review
    false
  );
  return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- 5. SEMINAR SESSIONS TABLE
-- ==============================================================================

create table if not exists public.seminar_sessions (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  speaker_name text not null,
  speaker_role text,
  organizer_id uuid references public.user_profiles(id) on delete set null,
  organizer_name text not null,
  schedule_time timestamp with time zone,
  location text,
  description text,
  sponsor_name text,
  sponsor_logo_url text,
  qr_code_url text,
  short_code text unique not null,
  status text default 'published' check (status in ('pending_approval', 'published', 'completed', 'cancelled')),
  is_active boolean default true,
  is_approved boolean default true,
  attendee_count integer default 0,
  
  -- Cost Control & Quotas
  max_audio_minutes integer default 60 not null,
  audio_minutes_used numeric(6, 2) default 0 not null,
  max_budget_usd numeric(6, 2) default 5.00 not null,
  cost_usd_accumulated numeric(6, 2) default 0 not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_seminar_sessions_short_code on public.seminar_sessions (short_code);
create index if not exists idx_seminar_sessions_organizer on public.seminar_sessions (organizer_id);

-- ==============================================================================
-- 6. LECTURE NOTES TABLE
-- ==============================================================================

create table if not exists public.lecture_notes (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.seminar_sessions(id) on delete cascade not null,
  sequence_number integer not null default 1,
  idempotency_hash text,
  heading text not null,
  bullet_points jsonb not null,
  timestamp_marker text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_session_idempotency unique (session_id, idempotency_hash)
);

create index if not exists idx_lecture_notes_seq on public.lecture_notes (session_id, sequence_number asc);
alter publication supabase_realtime add table public.lecture_notes;

-- ==============================================================================
-- 7. ADMIN NOTIFICATIONS TABLE
-- ==============================================================================

create table if not exists public.admin_notifications (
  id uuid default gen_random_uuid() primary key,
  event_type text not null,
  session_id uuid references public.seminar_sessions(id) on delete cascade,
  event_title text not null,
  organizer_name text not null,
  presenter_name text,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.user_profiles enable row level security;
alter table public.seminar_sessions enable row level security;
alter table public.lecture_notes enable row level security;
alter table public.admin_notifications enable row level security;

-- A. USER PROFILES POLICIES
-- Users can read their own profile
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id or public.is_admin() = true);

-- Users can update their own name/organization, but CANNOT change role/authorization/suspension
create policy "Users can update own name and organization"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Ensure non-admins cannot elevate role or change suspension status
    and (role = (select role from public.user_profiles where id = auth.uid()))
    and (is_authorized = (select is_authorized from public.user_profiles where id = auth.uid()))
    and (is_suspended = (select is_suspended from public.user_profiles where id = auth.uid()))
  );

-- Admins can update any user profile (promote, authorize, suspend)
create policy "Admins can update any profile"
  on public.user_profiles for update
  using (public.is_admin() = true)
  with check (public.is_admin() = true);

-- B. SEMINAR SESSIONS POLICIES
-- Public/Attendees can only read published and active sessions
create policy "Public can read published active sessions"
  on public.seminar_sessions for select
  using (
    (status = 'published' and is_active = true)
    or organizer_id = auth.uid()
    or public.is_admin() = true
  );

-- Only authorized organizers and admins can create sessions
create policy "Authorized organizers can insert sessions"
  on public.seminar_sessions for insert
  with check (
    (public.is_authorized_organizer() = true and organizer_id = auth.uid())
    or public.is_admin() = true
  );

-- Organizers can update only their own sessions; Admins can update any session
create policy "Organizers can update own sessions"
  on public.seminar_sessions for update
  using (organizer_id = auth.uid() or public.is_admin() = true)
  with check (organizer_id = auth.uid() or public.is_admin() = true);

-- Organizers can delete only their own sessions; Admins can delete any session
create policy "Organizers can delete own sessions"
  on public.seminar_sessions for delete
  using (organizer_id = auth.uid() or public.is_admin() = true);

-- C. LECTURE NOTES POLICIES
-- Public can read notes only for active published sessions
create policy "Public can read notes of published active sessions"
  on public.lecture_notes for select
  using (
    exists (
      select 1 from public.seminar_sessions
      where id = lecture_notes.session_id
        and ((status = 'published' and is_active = true) or organizer_id = auth.uid() or public.is_admin() = true)
    )
  );

-- Organizers can insert notes only for their own sessions; Admins can insert on any session
create policy "Organizers can insert notes for own sessions"
  on public.lecture_notes for insert
  with check (
    exists (
      select 1 from public.seminar_sessions
      where id = lecture_notes.session_id
        and (organizer_id = auth.uid() or public.is_admin() = true)
    )
  );

-- D. ADMIN NOTIFICATIONS POLICIES
-- Only admins can view and update notifications
create policy "Only admins can view notifications"
  on public.admin_notifications for select
  using (public.is_admin() = true);

create policy "Admins can update notification read status"
  on public.admin_notifications for update
  using (public.is_admin() = true);

-- Authenticated organizers can insert notifications upon event creation
create policy "Organizers can trigger notifications"
  on public.admin_notifications for insert
  with check (auth.uid() is not null);

-- ==============================================================================
-- 9. SECURE INITIAL ADMINISTRATOR PROMOTION
-- (Run this with your administrator email after signing up)
-- ==============================================================================
-- update public.user_profiles
-- set role = 'admin', is_authorized = true
-- where email = 'admin@smartsync.io';
