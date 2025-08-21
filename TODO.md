## Honey Do — Feature Plan

### 🍯 **App Manifesto**

**Household chores suck. We're making them fun.**

Honey Do transforms the most boring part of life—managing household responsibilities—into an engaging game. No more nagging, forgotten tasks, or arguments about who does what.

**For Couples:** Turn chore splitting into playful competition  
**For Families:** Kids actually want to earn Nectar points and climb leaderboards  
**For Everyone:** Clear expectations, accountability, and coordination in one addictive app

**Vision:** Every household task becomes a quest. Every completion earns Nectar. Every family member levels up together.

_Think Duolingo meets chore chart—where maintaining your home feels like playing a game._ 🎮✨

---

## Todos

[x] login doesn't properly redirect
[x] If the time is 11:59, can we hide it? and can we say by not at, it's a due date not a start date
[] needs to be fault resistant for bad signal areas, cache offline and queue results
[] import birthdays from contacts

## Feature Implementation Guide

A comprehensive guide to complete the Honey Do app (gamified household management), aligned to the HoneyDo API and server implementation.

### 🏗️ **Current Architecture Overview**

**Tech Stack:**

- **Frontend**: React Native + Expo Router + TypeScript
- **Backend**: Phoenix/Elixir API (complete, see `HoneyDo_API_Postman_Collection.json`)
- **Auth**: JWT tokens via API
- **Storage**: Expo SecureStore for tokens

**App Structure:**

```
app/
├── (auth)/          # Login, register, family setup screens (TO BUILD)
├── (tabs)/          # Main app: tasks, calendar, family, profile (TO BUILD)
├── _layout.tsx      # Root provider setup (TO BUILD)
components/          # Reusable UI components (TO BUILD)
contexts/
├── AuthContext.tsx  # User/family state, auth methods (TO BUILD)
lib/
├── apiClient.ts     # HTTP client with auth + error handling (TO BUILD)
├── tokenStorage.ts  # Secure token persistence (TO BUILD)
services/
├── taskService.ts   # Task CRUD via API (TO BUILD)
├── eventService.ts  # Event CRUD via API (TO BUILD)
types/index.ts       # TypeScript interfaces (TO BUILD)
```

**Key Types (To Define):**

- `User`: id, familyId, role (parent/member), displayName, email, nectarPoints, level
- `Family`: id, name, settings (theme, notifications, gamification) - represents household
- `Task`: id, familyId, title, assignedTo, dueDate, priority, status, nectarReward
- `Event`: id, familyId, title, startDate, endDate, type, assignedTo, color

**Project Status:**

- ✅ Phoenix/Elixir API backend (complete with full feature set)
- ⏳ React Native frontend (starting from scratch)
- ⏳ API integration layer
- ⏳ UI components and screens

**Role-Based Permissions:**

- **Parents**: Full CRUD on household, tasks, events, members + set Nectar rewards
- **Members**: Complete tasks to earn Nectar, view leaderboards, manage own profile

### 🔧 **Implementation Guidelines**

**Getting Started:**

1. **Set up the foundation**: Start with API client, token storage, and type definitions
2. **Build auth flow**: Login/register screens with JWT token handling
3. **Create main UI**: Tab navigation with tasks, calendar, family, profile screens
4. **Connect to Phoenix API**: Use the `HoneyDo_API_Postman_Collection.json` for endpoint specs

**Phoenix API Contract:**

- **Base URL**: Configure to match your Phoenix server (e.g., `http://localhost:4000/api/v1`)
- **Authentication**: JWT Bearer tokens in Authorization header
- **Task System**: Uses "task-occurrences" for recurring task instances
- **Pagination**: Cursor-based with `limit` and `cursor` parameters
- **Error Format**: Standard HTTP status codes with JSON error details

**Development Tips:**

- Build the app incrementally: auth → core features → advanced features
- Use TypeScript interfaces that match the Phoenix API responses
- Implement proper error handling for API failures
- Test with both parent and child user roles

---

### 0) Foundations

- **API client**: Create a typed API layer (e.g., `lib/apiClient.ts`) with base URL from env, bearer token injection, error normalization, and retry/backoff.
- **Types**: Align client types with server responses (users, families, tasks, task occurrences, events, invites, notifications). Add response mappers.
- **Auth storage**: Persist `authToken` securely; inject into API client.
- **Config**: `.env` for `API_BASE_URL`. Feature flag to switch between API vs Firebase during migration.

### 1) Authentication & Session

- **Register / Login / Logout**: Wire to API
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
- **Me endpoint**: Replace Firestore user bootstrap with `GET /api/v1/me` to fetch profile + families; store in `AuthContext`.
- **Session handling**: Token expiry handling; optional refresh if/when supported by server (not in collection; TODO.md lists `refresh`).

### 2) Onboarding & Families

- **Create family**: UI + API `POST /api/v1/families`; set as active family in context.
- **List families**: `GET /api/v1/families` with pagination (limit/cursor); switch active family.
- **Family details**: `GET /api/v1/families/{familyId}`; show name/timezone.
- **Update family**: `PATCH /api/v1/families/{familyId}` (parent only).
- **Delete family**: `DELETE /api/v1/families/{familyId}` (parent only) with confirmation.
- **Members**: List `GET /api/v1/families/{familyId}/members` (+ pagination), update role/status `PATCH`, remove member `DELETE` (parent only). UI for role badges and actions.

### 3) Invites

- **Create invite**: `POST /api/v1/families/{familyId}/invites` (parent) and share code/deep link.
- **Preview invite**: `GET /api/v1/invites/{code}` (no auth) with accept CTA.
- **Accept invite**: `POST /api/v1/invites/{code}/accept`; update `AuthContext` active family and members list.

### 4) Tasks (Chores)

- **List tasks**: Replace Firestore calls with `GET /api/v1/families/{familyId}/tasks` (+ pagination). Filters for status, priority, assigned user.
- **Create task**: `POST /api/v1/families/{familyId}/tasks` with fields: title, description, assigned_to, `rrule`, due_time, grace_hours, priority/points if supported.
- **Task detail**: `GET /api/v1/tasks/{taskId}`; edit `PATCH /api/v1/tasks/{taskId}`; delete `DELETE /api/v1/tasks/{taskId}` (parent only).
- **Pause/Resume**: `POST /api/v1/tasks/{taskId}/pause` / `POST /api/v1/tasks/{taskId}/resume`.
- **Occurrences**:
  - List: `GET /api/v1/families/{familyId}/task-occurrences` (+ pagination)
  - Complete/Reopen: `PATCH /api/v1/task-occurrences/{occurrenceId}/complete` / `reopen`
  - Reassign: `PATCH /api/v1/task-occurrences/{occurrenceId}/reassign`
- **RRULE UI**: Minimal repeat builder (daily/weekly/monthly + weekdays). Validate with server. Respect family timezone.
- **Child UX**: “My tasks” filter; children can only complete their assigned occurrences; hide admin actions.

### 5) Calendar & Events

- **List events**: `GET /api/v1/families/{familyId}/events?from&to` (+ pagination). Replace Firestore fetch in calendar screen.
- **Create/Update/Delete**: `POST /api/v1/families/{familyId}/events`, `PATCH /api/v1/events/{eventId}`, `DELETE /api/v1/events/{eventId}` (parent only).
- **Recurring events**: Support `rrule` in UI similar to tasks; display generated instances in calendar.
- **Event types/colors**: Render by type; allow color hint; time formatting & timezone.
- **Assignments (optional)**: If supported, allow selecting attendees; show per-user filtering.

### 6) Notifications

- **Device token registration**: `POST /api/v1/me/device-tokens` on app start/sign-in.
- **Test push**: `POST /api/v1/notify/test` from developer menu.
- **Event/Task notifications**: In-app and push for: new assignment, due soon, overdue, event starting soon, reassigned, invite accepted.
- **Settings**: Per-user notification preferences toggle.

### 7) Profile & Settings

- **Profile view**: Name, email, role(s), families membership; avatar if supported (TODO.md includes uploads).
- **Edit profile**: Update display name, photo, timezone, preferences.
- **Account actions**: Sign out; optional deactivate.

### 8) Permissions & Roles

- **Parent vs Child**: Enforce role across UI actions (create/edit/delete tasks/events, manage members, invites). Guard buttons and routes; show helpful errors.

### 9) Pagination, Loading, Errors

- **Wire limit/cursor**: Tasks, task occurrences, events, families, members.
- **UI affordances**: Infinite scroll or “Load more”, skeletons, empty states.
- **Errors**: Normalize server error format and display toasts/banners. Retry where safe.

### 10) Data Layer Migration (from Firebase)

- **AuthContext**: Replace Firestore bootstrap with `GET /me`; remove Firebase auth for production path or keep behind feature flag.
- **Services**: Replace `taskService` and `eventService` methods to call API equivalents; keep local mapping to current UI types.
- **Remove Firestore-specific date conversions**: Use ISO strings or server timestamps; centralize date parsing.

### 11) QA & Testing

- **Unit tests**: API client, mappers, permission helpers.
- **Integration tests**: Screen ↔ API flows (login, create family, invite, create task, complete occurrence, create event).
- **E2E happy path**: New user → create family → create task & event → child completes task → notifications.

### 12) Gamification & Polish

- **Nectar System**: Points, levels, streaks, achievements, leaderboards
- **Quest Mechanics**: Task completion animations, progress bars, rewards
- **Family Challenges**: Weekly goals, team competitions, bonus Nectar events
- **Search**: Filter tasks/events by text, date, assignee
- **Accessibility**: Larger tap targets, VoiceOver labels, contrast
- **Offline-first (later)**: Cache last data and optimistic complete; background sync

---

### Endpoint Map (quick reference)

- **Auth**: `POST /auth/register`, `POST /auth/login`, `GET /me`, `POST /auth/logout`
- **Families**: `GET/POST /families`, `GET/PATCH/DELETE /families/{familyId}`, `GET /families/{familyId}/members`, `PATCH/DELETE /families/{familyId}/members/{userId}`
- **Invites**: `POST /families/{familyId}/invites`, `GET /invites/{code}`, `POST /invites/{code}/accept`
- **Tasks**: `GET/POST /families/{familyId}/tasks`, `GET/PATCH/DELETE /tasks/{taskId}`, `POST /tasks/{taskId}/pause|resume`
- **Occurrences**: `GET /families/{familyId}/task-occurrences`, `PATCH /task-occurrences/{occurrenceId}/complete|reopen|reassign`
- **Events**: `GET/POST /families/{familyId}/events?from&to`, `GET/PATCH/DELETE /events/{eventId}`
- **Notifications**: `POST /me/device-tokens`, `POST /notify/test`

### 📱 **Target UI Screens (To Build)**

**Auth Flow:**

- `app/(auth)/login.tsx` - Email/password login with Phoenix API
- `app/(auth)/register.tsx` - Account creation with Phoenix API
- `app/(auth)/family-setup.tsx` - Create or join family post-registration

**Main App (Tabs):**

- `app/(tabs)/index.tsx` - Dashboard/home with household overview
- `app/(tabs)/tasks.tsx` - Task list with filters, task-occurrences support
- `app/(tabs)/calendar.tsx` - Calendar view with events from Phoenix API
- `app/(tabs)/household.tsx` - Household members, invite management
- `app/(tabs)/profile.tsx` - User profile, preferences

**Key UI Patterns (To Implement):**

- Role-based button visibility (`user?.role === 'parent'`)
- Filter tabs for tasks and task-occurrences
- Calendar integration with `react-native-calendars`
- Task completion with Phoenix API task-occurrences endpoints
- Priority badges and status indicators
- Invite code sharing and acceptance flow

---

### 🚀 **Development Priorities**

**Phase 1 (Foundation & Auth):**

1. Set up API client and token storage
2. Build auth screens (login/register)
3. Implement AuthContext with Phoenix API
4. Create app navigation structure

**Phase 2 (Core Features):** 5. Build task screens with task-occurrences support 6. Build calendar/events integration 7. Add household management and member roles 8. Implement invite system

**Phase 3 (Advanced Features):** 9. Add recurring task/event UI (RRULE) 10. Push notifications setup 11. Polish UX and error handling 12. Add search and filters

**Phase 4 (Gamification & Polish):** 13. Nectar points, levels, and achievement system 14. Leaderboards and family challenges 15. Quest animations and reward mechanics 16. Advanced analytics and insights

---

### 📋 **Acceptance for V1 (MVP)**

- ⏳ Sign in/up/out with Phoenix API; `me` loaded; active household context set
- ⏳ Create/list/switch households; invite + accept flow
- ⏳ Tasks: list/create/complete using task-occurrences; per-role permissions
- ⏳ Calendar: list date range; create/update/delete events
- ⏳ Basic error handling and loading states
- ⏳ Role-based UI permissions enforced

**Testing Checklist:**

- [ ] User can register, create household, invite members
- [ ] Partner/child can register, accept invite, join household
- [ ] Admin can create tasks with assignments and due dates
- [ ] Members can view and complete assigned task-occurrences
- [ ] Admin can create calendar events
- [ ] Calendar shows events with proper date filtering
- [ ] Invite codes work for household joining
- [ ] Role permissions enforced throughout UI
- [ ] Error states display helpful messages
- [ ] Loading states prevent double-actions
- [ ] JWT tokens persist across app restarts
