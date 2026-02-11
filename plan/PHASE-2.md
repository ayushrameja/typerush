# Phase 2 — Presence System + Lobby Lifecycle

## Goal

Lobbies are reliable. Dead lobbies are cleaned up automatically. Quick Match never
pairs a player with a ghost. Players get clear feedback when an opponent disconnects.
The sign-in-while-in-lobby flow is handled gracefully.

**Prerequisite:** Phase 1 (anonymous identity system) must be complete.

---

## 1. Convex Schema Changes

### New Table: `presence`

```typescript
// convex/schema.ts

presence: defineTable({
  playerId: v.string(),
  username: v.string(),
  status: v.union(
    v.literal("online"),
    v.literal("idle"),
    v.literal("in_lobby"),
    v.literal("in_race")
  ),
  currentLobbyId: v.optional(v.id("lobbies")),
  lastHeartbeatAt: v.number(),
  connectedAt: v.number(),
  cleanupJobId: v.optional(v.id("_scheduled_functions")),  // deadman's switch job ID
})
  .index("by_player_id", ["playerId"])
  .index("by_status", ["status"])
  .index("by_last_heartbeat", ["lastHeartbeatAt"]),
```

---

## 2. New Convex File: `convex/presence.ts`

### Mutations

#### `registerPresence`

Called when a player enters a multiplayer context (`/race` or `/race/[roomId]`).

```
Args: {
  playerId: v.string(),
  playerToken: v.optional(v.string()),
  username: v.string(),
}
```

**Behavior:**
1. Validate identity (same `resolveAndValidatePlayer` pattern from Phase 1)
2. Upsert presence record: set `status: "online"`, `lastHeartbeatAt: Date.now()`, `connectedAt: Date.now()`
3. Schedule a deadman's switch: `ctx.scheduler.runAfter(30_000, api.presence.expirePresence, { playerId })`
4. Store the scheduled job ID on the presence record (`cleanupJobId`)
5. Return `{ ok: true }`

#### `keepAlive`

Called by the client heartbeat at regular intervals.

```
Args: {
  playerId: v.string(),
  playerToken: v.optional(v.string()),
  status: v.optional(v.union(v.literal("online"), v.literal("idle"), v.literal("in_lobby"), v.literal("in_race"))),
  currentLobbyId: v.optional(v.id("lobbies")),
}
```

**Behavior:**
1. Validate identity
2. Find existing presence record by `playerId`
3. If not found → call `registerPresence` flow instead
4. Cancel the previous deadman's switch: `ctx.scheduler.cancel(record.cleanupJobId)`
5. Schedule a new one: `ctx.scheduler.runAfter(30_000, api.presence.expirePresence, { playerId })`
6. Update record: `lastHeartbeatAt: Date.now()`, status if provided, `cleanupJobId`

#### `expirePresence` (Internal — scheduled function)

The deadman's switch. Runs 30s after the last heartbeat if no `keepAlive` cancels it.

```
Args: { playerId: v.string() }
```

**Behavior:**
1. Find presence record for `playerId`
2. If not found → no-op
3. If `lastHeartbeatAt` is more recent than 25s ago → no-op (a keepAlive raced with this)
4. Read `currentLobbyId` from the presence record
5. If the player was in a lobby:
   a. Fetch the lobby
   b. If player was the **host**:
      - If lobby status is `"waiting"` or `"countdown"`:
        - If a guest exists → set lobby status to `"finished"` with a `hostDisconnected` flag
        - If no guest → delete the lobby
      - If lobby status is `"racing"`:
        - Set lobby status to `"finished"` with `hostDisconnected` flag
   c. If player was the **guest**:
      - Remove `guestId`, `guestProgress`, `guestToken` from lobby
      - If lobby status is `"waiting"` → stays waiting (host can get a new guest)
      - If lobby status is `"racing"` → set `"finished"` with `guestDisconnected` flag
6. Delete the presence record

#### `removePresence`

Called explicitly when player navigates away from multiplayer context.

```
Args: { playerId: v.string() }
```

**Behavior:**
1. Find and delete presence record
2. Cancel the scheduled deadman's switch
3. Handle lobby cleanup same as `expirePresence` if player was in a lobby

### Queries

#### `getPresence`

```
Args: { playerId: v.string() }
Returns: presence record | null
```

#### `getPresenceForLobby`

```
Args: { lobbyId: v.id("lobbies") }
Returns: { hostPresent: boolean, guestPresent: boolean }
```

Uses the lobby to get hostId/guestId, then checks presence records.

---

## 3. Update `convex/lobbies.ts` — Presence-Aware Matchmaking

### `findOrCreateMatch` — Updated

Add presence validation when finding a waiting lobby:

```typescript
// Inside findOrCreateMatch handler, replace the lobby search:

const waiting = await ctx.db
  .query("lobbies")
  .withIndex("by_status_created_at", (q) => q.eq("status", "waiting"))
  .collect()

const availableLobbies = waiting.filter(
  (lobby) => !lobby.guestId && lobby.hostId !== args.playerId
)

// Check presence for each candidate
let matchedLobby = null
for (const candidate of availableLobbies) {
  const hostPresence = await ctx.db
    .query("presence")
    .withIndex("by_player_id", (q) => q.eq("playerId", candidate.hostId))
    .unique()

  const isHostAlive = hostPresence &&
    (Date.now() - hostPresence.lastHeartbeatAt) < 45_000  // 45s grace

  if (isHostAlive) {
    matchedLobby = candidate
    break
  }
}

if (matchedLobby) {
  // join this lobby
} else {
  // create a new one
}
```

### Lobby Schema Addition: Disconnect Flags

```typescript
// Add to lobbies table in schema.ts:
hostDisconnected: v.optional(v.boolean()),
guestDisconnected: v.optional(v.boolean()),
```

These flags let the UI show appropriate messaging ("Opponent left" vs "Race finished").

---

## 4. New Convex File: `convex/crons.ts`

Convex supports cron jobs via `cronJobs()`. Set up periodic cleanup.

```typescript
import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

// Clean up stale lobbies every 5 minutes
crons.interval(
  "cleanup stale lobbies",
  { minutes: 5 },
  internal.lobbies.cleanupStaleLobbies
)

// Clean up old anonymous players daily
crons.interval(
  "cleanup anonymous players",
  { hours: 24 },
  internal.anonymous.cleanupExpiredAnonymousPlayers
)

export default crons
```

### `lobbies.cleanupStaleLobbies` (Internal Mutation)

```
Behavior:
1. Query all lobbies with status "waiting" and createdAt < (now - 10 minutes)
2. For each:
   a. Check if host has an active presence record
   b. If no → delete the lobby
3. Query all lobbies with status "countdown" and createdAt < (now - 5 minutes)
   → These are stuck countdowns. Set to "finished" or delete.
4. Query all lobbies with status "finished" and createdAt < (now - 1 hour)
   → Delete old finished lobbies (data preserved in raceHistory by Phase 3)
```

### `anonymous.cleanupExpiredAnonymousPlayers` (Internal Mutation)

```
Behavior:
1. Query all anonymousPlayers where lastSeenAt < (now - 30 days)
2. For each:
   a. If claimedByUserId is set → skip (this was merged, keep for audit)
   b. Delete the record
   c. (Phase 3: also delete their raceHistory records)
```

---

## 5. New Client Hook: `lib/hooks/useHeartbeat.ts`

Client-side heartbeat manager with adaptive intervals and idle detection.

### Interface

```typescript
interface UseHeartbeatOptions {
  playerId: string
  playerToken?: string
  username: string
  enabled: boolean             // only true on /race and /race/[roomId]
  lobbyId?: string             // set when in a room
  status?: "online" | "in_lobby" | "in_race"
}
```

### Behavior

```
1. If !enabled → do nothing, clean up any existing intervals

2. On mount (when enabled):
   a. Call registerPresence mutation
   b. Start heartbeat interval

3. Heartbeat interval (adaptive):
   - Active (mouse/key within last 30s): every 10 seconds
   - Idle (no activity for 30s-5min): every 25 seconds
   - Very idle (no activity for 5min+): stop heartbeat, let deadman's switch fire

4. Idle detection:
   - Track mousemove, keydown, touchstart events on document
   - Store last activity timestamp in a ref
   - Check against current time each heartbeat tick

5. Visibility API:
   - Listen for document.visibilitychange
   - When tab becomes hidden → stop heartbeat immediately
   - When tab becomes visible → resume heartbeat, send immediate keepAlive

6. On unmount (or enabled → false):
   - Call removePresence mutation
   - Clear all intervals and event listeners

7. Each heartbeat tick:
   - Call keepAlive mutation with current status and lobbyId
   - If mutation fails (network error), retry once after 5s
```

### Adaptive Interval Logic

```typescript
function getHeartbeatInterval(lastActivityMs: number): number {
  const idleTime = Date.now() - lastActivityMs

  if (idleTime < 30_000) return 10_000       // active: every 10s
  if (idleTime < 300_000) return 25_000       // idle: every 25s
  return -1                                    // very idle: stop
}
```

---

## 6. Idle Overlay UI

### New Component: `components/race/IdleOverlay.tsx`

Shown when the player has been idle for 5+ minutes while in a lobby.

```
┌──────────────────────────────────────┐
│                                      │
│           💤 You're idle             │
│                                      │
│   You'll be removed from the lobby   │
│       in 5 minutes if inactive.      │
│                                      │
│         [ I'm here! ]                │
│                                      │
└──────────────────────────────────────┘
```

**Behavior:**
- Appears as a semi-transparent overlay on the race room page
- "I'm here!" button resets the idle timer and sends an immediate `keepAlive`
- If the player does nothing for another 5 minutes (10 min total idle), the
  deadman's switch fires and removes them from the lobby
- The overlay auto-dismisses on any keyboard/mouse input

**Style:** Match existing race overlays — dark backdrop with blur, centered content,
arena-heading font, arena-button for the CTA.

---

## 7. Lobby Abandonment UI

### Updates to `app/race/[roomId]/page.tsx`

#### Host Disconnected (Guest's View)

When the lobby has `hostDisconnected: true`:

```
┌──────────────────────────────────────┐
│                                      │
│        Host disconnected             │
│                                      │
│   Your opponent left the race.       │
│                                      │
│      [ Back to Lobby ]               │
│                                      │
└──────────────────────────────────────┘
```

Clicking "Back to Lobby" → `router.push("/race")`

#### Guest Disconnected (Host's View)

When the lobby has `guestDisconnected: true`:

- If race was `"waiting"`: revert to waiting state, show "Opponent left. Waiting for a new player..."
  and clear `guestId`/`guestProgress` so someone new can join.
- If race was `"racing"` or `"finished"`: show results overlay with note "Opponent disconnected."

#### React to Lobby Changes

The existing `useQuery(api.lobbies.getLobby, { lobbyId })` will automatically
receive updates when disconnect flags are set. Add conditional rendering:

```tsx
if (lobby.hostDisconnected && !isHost) {
  return <DisconnectOverlay message="Host disconnected" />
}

if (lobby.guestDisconnected && isHost && status === "waiting") {
  // Show "Waiting for opponent..." again
  // The lobby is back to accepting a new guest
}

if (lobby.guestDisconnected && isHost && status !== "waiting") {
  // Show in results: "Opponent disconnected"
}
```

---

## 8. Sign-In While in Lobby — Warning Modal

### New Component: `components/auth/LobbyLeaveWarning.tsx`

Triggered when a user clicks "Sign in" from the navbar while on `/race/[roomId]`.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              ⚠️  Leave this lobby?                   │
│                                                      │
│   Signing in will remove you from the current race.  │
│   Your opponent will appear in your recently played   │
│   list.                                              │
│                                                      │
│       [ Cancel ]          [ Sign in & Leave ]        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Implementation:**

The `FloatingNavbar` is hidden on `/race/[roomId]` routes (line 280-285 of current code).
But the user could still sign in via:
1. Directly navigating to `/login`
2. Opening a new tab

For case 1, intercept navigation to `/login` while in a lobby:
- In `IdentityProvider`, track whether the user is currently in an active lobby
  (read from presence record or a simple zustand flag)
- When `signIn("google")` is about to be called, check this flag
- If in lobby → show `LobbyLeaveWarning` modal
- On confirm → call `removePresence`, then proceed with `signIn("google")`
- On cancel → close modal, stay in lobby

For case 2, the deadman's switch handles it naturally (if they sign in on another tab,
the original tab's heartbeat stops, presence expires, lobby is cleaned up).

---

## 9. Where to Mount the Heartbeat

### Update `app/race/page.tsx` (Lobby Page)

```tsx
useHeartbeat({
  playerId: identity.playerId,
  playerToken: identity.token ?? undefined,
  username: identity.displayName,
  enabled: true,
  status: "online",
})
```

### Update `app/race/[roomId]/page.tsx` (Race Room)

```tsx
const heartbeatStatus = useMemo(() => {
  if (status === "racing") return "in_race" as const
  return "in_lobby" as const
}, [status])

useHeartbeat({
  playerId: identity.playerId,
  playerToken: identity.token ?? undefined,
  username: identity.displayName,
  enabled: true,
  lobbyId: lobbyId,
  status: heartbeatStatus,
})
```

### Cleanup on Navigation

When the user navigates away from `/race/*` pages, the hook unmount will
call `removePresence`. React's cleanup guarantees this runs on route change.

For hard closes (tab close, browser quit), the deadman's switch handles cleanup
within 30 seconds.

---

## 10. Updates to Existing Race Components

### `components/race/RaceUI.tsx`

Add disconnect state to the results overlay:

```tsx
interface RaceUIProps {
  status: "waiting" | "countdown" | "racing" | "finished"
  countdown: number
  timeLeft: number
  player1: { username: string; progress: number; wpm: number }
  player2?: { username: string; progress: number; wpm: number }
  winner?: string
  onRestart?: () => void
  hostDisconnected?: boolean     // NEW
  guestDisconnected?: boolean    // NEW
}
```

When `hostDisconnected` or `guestDisconnected`:
- In the finished overlay, show "Opponent disconnected" instead of "Defeat"
- The race is treated as a void/no-contest (or auto-win for the remaining player —
  your call, but auto-win feels fairer)

### `components/race/RaceScene.tsx`

When an opponent disconnects mid-race:
- Their `PlayerOrb` could fade out with an animation
- Or show a ghost/transparent effect

This is a polish item — can be deferred to after core logic works.

---

## 11. Implementation Order (within Phase 2)

```
Step 1:  convex/schema.ts           — add presence table, add disconnect flags to lobbies
Step 2:  convex/presence.ts         — registerPresence, keepAlive, expirePresence, removePresence
Step 3:  convex/crons.ts            — lobby cleanup cron, anonymous cleanup cron
Step 4:  convex/lobbies.ts          — presence check in findOrCreateMatch, cleanupStaleLobbies internal mutation
Step 5:  lib/hooks/useHeartbeat.ts  — heartbeat hook with adaptive intervals + idle detection
Step 6:  app/race/page.tsx          — mount heartbeat hook
Step 7:  app/race/[roomId]/page.tsx — mount heartbeat hook, add disconnect handling UI
Step 8:  components/race/RaceUI.tsx — disconnect state rendering
Step 9:  components/race/IdleOverlay.tsx — idle warning overlay
Step 10: components/auth/LobbyLeaveWarning.tsx — sign-in warning modal
Step 11: Integration with FloatingNavbar for sign-in intercept
```

---

## 12. Testing Checklist

- [ ] Player enters `/race` → presence record created with status "online"
- [ ] Player creates lobby → presence updates to "in_lobby" with lobbyId
- [ ] Player closes tab → deadman's switch fires within 30s → presence deleted
- [ ] Host closes tab while in "waiting" lobby with no guest → lobby deleted
- [ ] Host closes tab while in "waiting" lobby with guest → lobby set to finished, guest sees "Host disconnected"
- [ ] Guest closes tab while in "waiting" lobby → guest removed, lobby stays open for new guest
- [ ] Guest closes tab while "racing" → lobby finishes, host sees "Opponent disconnected"
- [ ] Quick Match never matches with a host whose presence is stale (> 45s old)
- [ ] Player goes idle for 5 min → idle overlay appears
- [ ] Player goes idle for 10 min in lobby → removed from lobby automatically
- [ ] Tab goes to background → heartbeat stops → tab returns → heartbeat resumes immediately
- [ ] Sign-in from lobby page → warning modal appears → confirm → player removed from lobby → sign-in proceeds
- [ ] Sign-in from lobby page → warning modal → cancel → stays in lobby
- [ ] Lobby cleanup cron: "waiting" lobby older than 10 min with no host presence → deleted
- [ ] Finished lobbies older than 1 hour → deleted by cron
- [ ] Heartbeat adaptive intervals: active = 10s, idle = 25s, very idle = stopped
- [ ] No heartbeat sent on non-race pages (home, practice, history)
