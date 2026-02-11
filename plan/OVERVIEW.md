# TypeRush Multiplayer Redesign — Master Plan

## Vision

Remove the Google login requirement for multiplayer so any visitor can instantly race.
Introduce a server-issued anonymous identity, a presence/heartbeat layer for lobby
reliability, race history storage, and a tiered feature model that rewards signing in
without punishing anonymous players.

---

## Finalized Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Anonymous identity approach | **Server-Issued (Option B)** — Convex creates an `anonymousPlayers` record and returns a secret token stored in `localStorage` |
| 2 | Merge on login | **Prompt the user** — modal asks "Merge anonymous history into your account?" with Merge / Start Fresh options |
| 3 | Sign-in while in a lobby | **Warn and leave** — modal warns user they will leave the lobby; opponent goes to "recently played" |
| 4 | Anonymous usernames | **Auto-generated fun names** (e.g. `SwiftFox_4829`) — editable anytime |
| 5 | Username uniqueness | **Not enforced** — auto-appended 4-digit discriminator for display |
| 6 | Anonymous data cleanup | **30-day inactivity TTL** — cron deletes stale records; UI shows expiry notice |
| 7 | Local storage limit | **20 results each** (practice + multiplayer separate), FIFO eviction |
| 8 | Rate limiting | **Token-based** — per-anonymous-token action counts, enforced server-side |
| 9 | Race history | **In scope** — new `raceHistory` Convex table + localStorage fallback for anonymous |
| 10 | Recently played | **Derived from `raceHistory`** — no extra table; query groups by opponent |
| 11 | Host disconnect from lobby | **Lobby closes** — guest sees "Host left" and is redirected (Phase 1 simplicity; host promotion deferred) |
| 12 | Heartbeat scope | **Multiplayer contexts only** — `/race` and `/race/[roomId]` pages |
| 13 | Online indicators on recently played | **Not in Phase 1** — requires app-wide presence |
| 14 | Background tab heartbeat | **Stop entirely** — use `visibilitychange` to pause/resume |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT                                │
│                                                               │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐ │
│  │ IdleDetector  │  │  Heartbeat    │  │   localStorage     │ │
│  │ (mouse/key/   │──│  Manager      │  │  - typerush_anon   │ │
│  │  visibility)  │  │  (adaptive)   │  │  - typerush_race   │ │
│  └──────────────┘  └───────┬───────┘  │  - typerush_prefs  │ │
│                            │          └────────────────────┘ │
│  ┌──────────────┐  ┌──────┴────────┐                         │
│  │  userStore    │  │ identityStore │                         │
│  │  (zustand)    │  │ (zustand)     │                         │
│  └──────────────┘  └───────────────┘                         │
└────────────────────────────┼─────────────────────────────────┘
                             │  Convex mutations / reactive queries
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                         CONVEX                                │
│                                                               │
│  Tables:                                                      │
│  ┌───────────────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │ anonymousPlayers   │  │ lobbies  │  │   raceHistory     │ │
│  │ (token, username,  │  │ (updated │  │   (new table)     │ │
│  │  rateLimit, TTL)   │  │  schema) │  │                   │ │
│  └───────────────────┘  └──────────┘  └───────────────────┘ │
│  ┌───────────────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │ presence           │  │ profiles │  │   stats           │ │
│  │ (new table)        │  │ (exists) │  │   (exists)        │ │
│  └───────────────────┘  └──────────┘  └───────────────────┘ │
│                                                               │
│  Scheduled Functions:                                         │
│  - expirePresence (deadman's switch, per-player, 30s)        │
│  - cleanupAnonPlayers (daily cron, 30-day TTL)               │
│  - cleanupStaleLobbies (every 5min, 10min TTL)               │
└──────────────────────────────────────────────────────────────┘
```

---

## Player Identity State Machine

```
┌─────────────┐     first visit       ┌───────────────────┐
│  No Identity │ ────────────────────► │  Anonymous Player  │
│  (new user)  │  server issues token  │  (localStorage     │
└─────────────┘  + fun username        │   + Convex record) │
                                       └─────────┬─────────┘
                                                  │
                                        signs in with Google
                                                  │
                                                  ▼
                                       ┌────────────────────┐
                                       │  Merge Prompt       │
                                       │  "Import anon data?"│
                                       └─────────┬──────────┘
                                          ┌───────┴───────┐
                                          ▼               ▼
                                    ┌──────────┐   ┌───────────┐
                                    │  Merge   │   │  Fresh    │
                                    │  history │   │  start    │
                                    └────┬─────┘   └─────┬─────┘
                                         │               │
                                         ▼               ▼
                                       ┌──────────────────┐
                                       │  Authenticated    │
                                       │  (Convex user ID) │
                                       └─────────┬────────┘
                                                  │
                                        token expires / logout
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │  Returning Anonymous  │
                                       │  (silent fallback to  │
                                       │   anonymous identity) │
                                       │  Soft banner: "Sign   │
                                       │  in to save progress" │
                                       └──────────────────────┘
```

---

## Tiered Feature Matrix

| Feature | Anonymous | Authenticated |
|---------|-----------|---------------|
| Practice mode | Full | Full |
| Multiplayer (create/join/quick match) | Full | Full |
| Username customization | Yes (local + lobby) | Yes (server-synced) |
| Card / Title customization | Local only (future) | Server-synced (future) |
| Practice history | Last 20 (localStorage, FIFO) | Unlimited (Convex) |
| Multiplayer history | Last 20 (localStorage, FIFO) | Unlimited (Convex) |
| Recently played opponents | localStorage (last 20) | Derived from `raceHistory` |
| Add friends | No | Future feature |
| Leaderboards | View only | Full participation |
| Cross-device sync | No | Yes |
| Public profile | No | Yes |
| Stats tracking | Local only | Server + badges |
| Data retention | 30-day TTL (shown in UI) | Permanent |

---

## Phased Implementation

### Phase 1 — Anonymous Identity + Remove Login Gate ✅ COMPLETE
> **Goal:** Any visitor can create/join/quick-match a multiplayer race without signing in.

- ✅ Server-issued anonymous identity (Convex `anonymousPlayers` table)
- ✅ `localStorage` token persistence (`typerush_anon`)
- ✅ Fun name generator with 4-digit discriminator
- ✅ Remove all login gates from `/race` and `/race/[roomId]`
- ✅ Update `AuthProvider` + `userStore` + `identityStore` to support dual identity
- ✅ Update lobby mutations to accept anonymous player tokens with server validation
- ✅ Token-based rate limiting on lobby mutations
- ✅ UI: remove sign-in warning banner, enable all buttons for anonymous, add username editor

**Branch:** `ayush/anonymous-multiplayer`

### Phase 2 — Presence System + Lobby Lifecycle ✅ COMPLETE
> **Goal:** Lobbies are reliable — dead lobbies are cleaned up, Quick Match never matches a ghost.

- ✅ `presence` table + heartbeat mutations (`convex/presence.ts`)
- ✅ Client-side `useHeartbeat` hook (adaptive intervals, idle detection, visibility API)
- ✅ Deadman's switch via Convex scheduled functions (30s expiry)
- ✅ Lobby cleanup cron + anonymous cleanup cron (`convex/crons.ts`)
- ✅ `findOrCreateMatch` filters by host presence (45s alive threshold)
- ✅ Lobby abandonment handling (host leaves → lobby closes, guest notified; guest leaves → lobby reopens)
- ✅ Sign-in while in lobby: `LobbyLeaveWarning` modal + clean lobby exit
- ✅ UI: `IdleOverlay` (5min idle warning), "Host disconnected" screen, "Opponent Left" in results
- ✅ Disconnect flags on lobbies (`hostDisconnected`, `guestDisconnected`)

### Phase 3 — Race History, Merge Flow, Tiered Features (NOT STARTED)
> **Goal:** Race results persist, anonymous data merges on login, tiered feature model is live.

- `raceHistory` Convex table + write on race finish
- localStorage fallback for anonymous (20 results, FIFO)
- Merge prompt modal on login (merge vs. fresh start)
- Server-side merge mutation (copies anonymous raceHistory → auth account)
- Recently played: query derived from `raceHistory` grouped by opponent
- History page: unified practice + multiplayer tab view
- Anonymous data expiry notice in UI ("Your data expires in X days. Sign in to keep it.")
- Conversion prompts ("Great race! Sign in to save this to your record.")
- 30-day anonymous cleanup cron
- Update `stats` table on race finish for authenticated users

---

## Phase 2 Guardrails (Learnings From Phase 1 Reviews)

Use this as a pre-merge checklist so we do not reintroduce the same bugs with new features.

### 1) Convex Determinism + Token Security

- Never generate auth/session-like tokens inside a Convex mutation.
- Do non-deterministic/secure generation in an `action` (for example `crypto.randomUUID()`).
- Keep DB writes deterministic via mutation/internalMutation calls from that action.
- Avoid `Math.random()` for security-sensitive values. It is fast, weak, and eventually embarrassing.

### 2) Identity Contract Must Stay Explicit

- In lobby flows, `playerToken` present means anonymous identity path; `playerToken` absent means authenticated profile path.
- Only upsert `profiles` for authenticated identities.
- Anonymous player IDs must not create rows in `profiles`.
- Re-validate this invariant whenever mutation args or identity plumbing changes.

### 3) Anonymous Hook State Must Be Reactive (Not Stale)

- Do not treat storage reads as stable by default (`useMemo(loadStoredAnon)` can go stale).
- Keep anonymous token in React state (`anonToken`) and drive queries from that state.
- When calling `saveStoredAnon`, `clearStoredAnon`, or successful `registerAnonymous`, update `anonToken` state in the same flow.

### 4) Initialization Guard Rules

- `hasInitialized` must not block invalid-token handling.
- Early-return guards should still allow the `serverPlayer === null` branch to run, so expired tokens can be cleared and re-registration can happen.
- Reset `hasInitialized.current` when auth status changes (`authLoading` / `isAuthenticated`) to allow re-init after login/logout transitions.

### 5) Async Race Safety in `useAnonymousIdentity`

- Always handle `registerAnonymous` rejection (`.catch` or `try/catch`).
- On failure: log, reset `hasInitialized.current = false`, avoid persisting partial identity state.
- Guard in-flight `registerAnonymous` resolution with latest auth state ref.
- If auth becomes authenticated while request is in flight, ignore stale anon results (do not call `saveStoredAnon`, `setAnonToken`, or overwrite identity).

### 6) Lint/Type Safety Notes

- React hook lint rules may reject synchronous `setState` inside effects; use a deferred update or restructure effect control flow.
- Run lint and targeted typecheck after each identity/auth hook change:
  - `pnpm exec eslint lib/hooks/useAnonymousIdentity.ts`
  - `pnpm exec tsc --noEmit --project convex/tsconfig.json`

---

## Files Changed

### Phase 1 — Completed

#### Convex Backend
| File | Status | Changes |
|------|--------|---------|
| `convex/schema.ts` | ✅ Done | Added `anonymousPlayers` table, added `hostToken`/`guestToken` to `lobbies` |
| `convex/lobbies.ts` | ✅ Done | All mutations accept `playerToken`, identity validation, rate limiting |
| `convex/anonymous.ts` | ✅ Done | **NEW** — `registerAnonymous`, `getAnonymousPlayer`, `refreshLastSeen`, `updateUsername` |

#### Client State & Hooks
| File | Status | Changes |
|------|--------|---------|
| `lib/types/user.ts` | ✅ Done | Extended `AppUser` with `displayName`, `avatarSeed`, `token`; added `AnonymousIdentity` |
| `lib/stores/identityStore.ts` | ✅ Done | **NEW** — zustand store for unified identity, localStorage helpers |
| `lib/hooks/useAnonymousIdentity.ts` | ✅ Done | **NEW** — auto-registers/hydrates anonymous identity on mount |
| `lib/utils/nameGenerator.ts` | ✅ Done | **NEW** — fun name + discriminator generator |

#### UI Components
| File | Status | Changes |
|------|--------|---------|
| `components/auth/AuthProvider.tsx` | ✅ Done | Updated to set new `AppUser` fields for dual identity |
| `components/providers/IdentityProvider.tsx` | ✅ Done | **NEW** — bridges auth and anonymous identity systems |
| `app/layout.tsx` | ✅ Done | Added `IdentityProvider` to component tree |
| `app/race/page.tsx` | ✅ Done | Removed login gate, uses identity store, anonymous banner + username editor |
| `app/race/[roomId]/page.tsx` | ✅ Done | Removed login redirect, uses identity store for all mutations |
| `components/ui/UsernameEditor.tsx` | ✅ Done | **NEW** — inline click-to-edit username component |
| `components/ui/FloatingNavbar.tsx` | ✅ Done | "Friends" → `/race` always, shows anonymous identity in side panel |
| `components/home/HeroLobby.tsx` | ✅ Done | Uses identity display name, "Add friends" → `/race` always |
| `app/(auth)/login/page.tsx` | ✅ Done | Updated copy, added "Play multiplayer as guest" link |

### Phase 2 — Completed

| File | Status | Changes |
|------|--------|---------|
| `convex/schema.ts` | ✅ Done | Added `presence` table, added `hostDisconnected`/`guestDisconnected` to `lobbies` |
| `convex/presence.ts` | ✅ Done | **NEW** — registerPresence, keepAlive, expirePresence, removePresence, getPresence, getPresenceForLobby |
| `convex/crons.ts` | ✅ Done | **NEW** — stale lobby cleanup (5min), anonymous player cleanup (24h) |
| `convex/lobbies.ts` | ✅ Done | Presence-aware `findOrCreateMatch`, `cleanupStaleLobbies` internal mutation |
| `convex/anonymous.ts` | ✅ Done | Added `cleanupExpiredAnonymousPlayers` internal mutation (30-day TTL) |
| `lib/hooks/useHeartbeat.ts` | ✅ Done | **NEW** — adaptive heartbeat (10s/25s/stop), idle detection, visibility API |
| `lib/stores/identityStore.ts` | ✅ Done | Added `currentLobbyId` tracking for sign-in interception |
| `app/race/page.tsx` | ✅ Done | Mounted heartbeat hook with `status: "online"` |
| `app/race/[roomId]/page.tsx` | ✅ Done | Mounted heartbeat hook, idle overlay, host-disconnect screen, guest-disconnect handling |
| `components/race/RaceUI.tsx` | ✅ Done | Disconnect state in finished overlay ("Opponent Left" messaging) |
| `components/race/IdleOverlay.tsx` | ✅ Done | **NEW** — idle warning overlay (5min threshold) |
| `components/auth/LobbyLeaveWarning.tsx` | ✅ Done | **NEW** — sign-in warning modal for lobby exit |
| `app/(auth)/login/page.tsx` | ✅ Done | Integrated `LobbyLeaveWarning` + presence cleanup on sign-in |

### Phase 3 — Not Started

| File | Status | Changes |
|------|--------|---------|
| `convex/raceHistory.ts` | Pending | **NEW** — saveResult, getHistory, getRecentOpponents |
| `lib/hooks/useLocalHistory.ts` | Pending | **NEW** — localStorage race/practice history (20, FIFO) |
| `components/auth/MergePrompt.tsx` | Pending | **NEW** — modal for merge vs. fresh start on login |
| `convex/users.ts` | Pending | Add merge mutation for anonymous → auth data transfer |
| `components/ui/DataExpiryBanner.tsx` | Pending | **NEW** — data expiry banner for anonymous |
| `components/race/RaceUI.tsx` | Pending | Ghost indicator, conversion prompt |
| `app/history/page.tsx` | Pending | Multiplayer tab, dual data source |

---

## localStorage Keys

| Key | Shape | Purpose |
|-----|-------|---------|
| `typerush_anon` | `{ token: string, playerId: string, username: string, avatarSeed: string, createdAt: number }` | Anonymous identity persistence |
| `typerush_race_history` | `Array<{ opponentUsername, opponentId, wpm, accuracy, won, completedAt }>` (max 20) | Anonymous multiplayer results |
| `typerush_practice_history` | `Array<{ wpm, accuracy, duration, difficulty, completedAt }>` (max 20) | Anonymous practice results |
| `typerush_preferences` | `{ duration, difficulty, stopOnError, soundEnabled }` | Existing — no change |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Anonymous token spoofing | Medium — someone impersonates another anon player | Server validates token on every mutation |
| localStorage cleared | Low — player loses anonymous identity | Expected; conversion prompt encourages sign-in |
| Convex function call costs from heartbeat | Medium — high concurrency = high bill | Adaptive intervals, multiplayer-context-only heartbeat, background tab pause |
| Stale lobbies matched in Quick Match | High — terrible UX | Presence check in `findOrCreateMatch`, lobby cleanup cron |
| Merge conflict (anon data + existing auth data) | Low — stats could look weird | User chooses; merge sums totals, recalculates averages |
| Rate limit bypass via new anonymous tokens | Medium — create new identity to circumvent | Short cooldown on token creation, monitor patterns |

---

## Success Criteria

1. A brand-new visitor can play a multiplayer race within 10 seconds of landing on `/race`
2. Quick Match never pairs a player with a dead/ghost lobby
3. Anonymous players see their last 20 race results locally
4. Signing in prompts a clear merge/fresh-start choice
5. Token expiry or logout silently falls back to anonymous — no jarring redirect
6. 30-day inactive anonymous records are cleaned up automatically
7. Authenticated users see full history, stats, and recently played opponents
