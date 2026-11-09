# SmartSync · Live AI Seminar Note-Taking Platform

SmartSync is an enterprise-grade Progressive Web Application (PWA) designed to eliminate manual note-taking during live seminars, academic lectures, and industry conferences.

---

## 🔐 Authentication & Role-Based Entry Routes

SmartSync utilizes **one unified Supabase Auth system** with strictly segregated entry routes and server-enforced role verification:

| Route | Role | Purpose | Post-Login Destination |
| :--- | :---: | :--- | :--- |
| **`/register`** | `organizer` | Registration collecting Full Name, Organization, Email, and Password | `/dashboard` |
| **`/login`** | `organizer` | Dedicated login for seminar organizers | `/dashboard` |
| **`/admin/login`** | `admin` | Dedicated login portal restricted to platform administrators | `/admin` |
| **`/dashboard`** | `organizer` | Organizer Dashboard: Manage own events, launch podium studio, view analytics | — |
| **`/admin`** | `admin` | Admin Command Center: Platform monitoring, user management, suspension, moderation | — |
| **`/forgot-password`** | Any | Password reset request triggering Supabase Auth verification email | `/login` |
| **`/`** | Public | Public landing page & live attendee feed | — |
| **`/live/:shortCode`** | Public | Direct attendee link to a specific seminar's live notes feed | — |

---

## ⚡ Instant Test Accounts

You can test any role instantly on the respective login page or via the navbar account pill:

| Account Name | Email | Password | Role | Access Route |
| :--- | :--- | :--- | :---: | :--- |
| **Dr. Sarah Chen** | `admin@smartsync.io` | `Admin@123456` | `admin` | [`/admin/login`](http://127.0.0.1:5173/admin/login) → [`/admin`](http://127.0.0.1:5173/admin) |
| **Dr. Almaz Kebede** | `organizer@smartsync.io` | `Organizer@123` | `organizer` | [`/login`](http://127.0.0.1:5173/login) → [`/dashboard`](http://127.0.0.1:5173/dashboard) |
| **Marcus Vance** | `marcus@smartsync.io` | `Organizer@123` | `organizer` | [`/login`](http://127.0.0.1:5173/login) → [`/dashboard`](http://127.0.0.1:5173/dashboard) |
| **Public Attendee** | *(No login required)* | — | `attendee` | [`/`](http://127.0.0.1:5173/) or [`/live/jijiga-2026`](http://127.0.0.1:5173/live/jijiga-2026) |

---

## 🛡️ Security & Role-Based Access Control Architecture

1. **Disabled Public Admin Registration**:
   - Public registration (`/register`) is strictly constrained to the `organizer` role.
   - Administrative privileges can never be granted from client-side code or user-editable profile fields.
   - The initial admin is promoted through the secure setup script: [`scripts/setup-admin-and-rls.sql`](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/smartsync/scripts/setup-admin-and-rls.sql).

2. **Server-Side Authorization & Row-Level Security (RLS)**:
   - Protected tables: `user_profiles`, `seminar_sessions`, `lecture_notes`, `admin_notifications`.
   - Security functions: `is_admin()` and `is_authorized_organizer()`.
   - Organizers can ONLY create, update, or delete their own sessions.
   - Public attendees can only view published and active sessions (`status = 'published' and is_active = true`).

3. **Account Suspension Protection**:
   - When an administrator toggles account suspension, the user's active session is invalidated immediately, and subsequent login attempts are rejected with an explicit suspension error.

4. **Test Mode Auto-Activation & Approval Toggle**:
   - During Test Mode (`EVENT_APPROVAL_REQUIRED=false`), verified organizers create and publish events immediately, generating vector QR codes and in-app admin notifications.
   - Switching `EVENT_APPROVAL_REQUIRED=true` in the Admin Hub seamlessly restores the production approval workflow without rebuilding the application.

---

## 🛠️ Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
