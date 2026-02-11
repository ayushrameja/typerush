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

### Phase 1 — Anonymous Identity + Remove Login Gate
> **Goal:** Any visitor can create/join/quick-match a multiplayer race without signing in.

- Server-issued anonymous identity (Convex `anonymousPlayers` table)
- `localStorage` token persistence (`typerush_anon`)
- Fun name generator with 4-digit discriminator
- Remove all login gates from `/race` and `/race/[roomId]`
- Update `AuthProvider` + `userStore` + `identityStore` to support dual identity
- Update lobby mutations to accept anonymous player tokens with server validation
- Token-based rate limiting on lobby mutations
- UI: remove sign-in warning banner, enable all buttons for anonymous, add username editor

### Phase 2 — Presence System + Lobby Lifecycle
> **Goal:** Lobbies are reliable — dead lobbies are cleaned up, Quick Match never matches a ghost.

- `presence` table + heartbeat mutations
- Client-side `HeartbeatManager` hook (adaptive intervals, idle detection, visibility API)
- Deadman's switch via Convex scheduled functions
- Lobby cleanup cron (stale lobbies with no active host)
- `findOrCreateMatch` filters by host presence
- Lobby abandonment handling (host leaves → lobby closes, guest notified)
- Sign-in while in lobby: warning modal + clean lobby exit
- UI: idle overlay, "Host left" notification, lobby status indicators

### Phase 3 — Race History, Merge Flow, Tiered Features
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

## Files That Will Be Modified

### Convex Backend
| File | Changes |
|------|---------|
| `convex/schema.ts` | Add `anonymousPlayers`, `presence`, `raceHistory` tables; update `lobbies` |
| `convex/lobbies.ts` | Accept anonymous tokens, validate identity, rate limiting, presence check in matchmaking |
| `convex/anonymous.ts` | **NEW** — register, validate, refresh, cleanup mutations |
| `convex/presence.ts` | **NEW** — heartbeat, keepAlive, expirePresence mutations |
| `convex/raceHistory.ts` | **NEW** — saveResult, getHistory, getRecentOpponents queries |
| `convex/crons.ts` | **NEW** — scheduled cleanup jobs |
| `convex/users.ts` | Add merge mutation for anonymous → auth data transfer |

### Client State & Hooks
| File | Changes |
|------|---------|
| `lib/stores/userStore.ts` | Support anonymous user shape, dual identity |
| `lib/stores/identityStore.ts` | **NEW** — anonymous token management, localStorage sync |
| `lib/hooks/useHeartbeat.ts` | **NEW** — adaptive heartbeat with idle detection |
| `lib/hooks/useAnonymousIdentity.ts` | **NEW** — register/load anonymous identity on mount |
| `lib/hooks/useLocalHistory.ts` | **NEW** — localStorage race/practice history (20, FIFO) |
| `lib/types/user.ts` | Extend `AppUser` for anonymous fields |
| `lib/utils/nameGenerator.ts` | **NEW** — fun name + discriminator generator |

### UI Components
| File | Changes |
|------|---------|
| `components/auth/AuthProvider.tsx` | Handle anonymous fallback on logout/token expiry, trigger merge prompt |
| `components/auth/MergePrompt.tsx` | **NEW** — modal for merge vs. fresh start on login |
| `components/auth/LobbyLeaveWarning.tsx` | **NEW** — modal warning when signing in from a lobby |
| `app/race/page.tsx` | Remove login gate, use anonymous identity, add username editor |
| `app/race/[roomId]/page.tsx` | Remove login redirect, use anonymous identity, handle lobby abandonment |
| `app/(auth)/login/page.tsx` | Update copy, remove "multiplayer requires login" messaging |
| `components/ui/FloatingNavbar.tsx` | "Friends" link → `/race` always (no login redirect), show anonymous user info |
| `components/home/HeroLobby.tsx` | Show anonymous name, "Add friends" → `/race` always |
| `components/race/RaceUI.tsx` | Add ghost indicator for anonymous opponents, conversion prompt on finish |
| `components/ui/UsernameEditor.tsx` | **NEW** — inline click-to-edit username component |
| `components/ui/DataExpiryBanner.tsx` | **NEW** — "Your data expires in X days" banner for anonymous |
| `app/history/page.tsx` | Add multiplayer tab, show localStorage results for anonymous |

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
