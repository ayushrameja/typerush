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

### Phase 2 — Presence System + Lobby Lifecycle (NOT STARTED)
> **Goal:** Lobbies are reliable — dead lobbies are cleaned up, Quick Match never matches a ghost.

- `presence` table + heartbeat mutations
- Client-side `HeartbeatManager` hook (adaptive intervals, idle detection, visibility API)
- Deadman's switch via Convex scheduled functions
- Lobby cleanup cron (stale lobbies with no active host)
- `findOrCreateMatch` filters by host presence
- Lobby abandonment handling (host leaves → lobby closes, guest notified)
- Sign-in while in lobby: warning modal + clean lobby exit
- UI: idle overlay, "Host left" notification, lobby status indicators

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

### Phase 2 — Not Started

| File | Status | Changes |
|------|--------|---------|
| `convex/schema.ts` | Pending | Add `presence` table, add disconnect flags to `lobbies` |
| `convex/presence.ts` | Pending | **NEW** — heartbeat, keepAlive, expirePresence mutations |
| `convex/crons.ts` | Pending | **NEW** — scheduled cleanup jobs |
| `lib/hooks/useHeartbeat.ts` | Pending | **NEW** — adaptive heartbeat with idle detection |
| `components/race/IdleOverlay.tsx` | Pending | **NEW** — idle warning overlay |
| `components/auth/LobbyLeaveWarning.tsx` | Pending | **NEW** — sign-in warning modal |

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
