# Phase 3 — Race History, Merge Flow, Tiered Features

## Goal

Race results persist (server for auth, localStorage for anonymous). Signing in triggers
a merge prompt. Tiered features reward authenticated users. Recently played opponents
are surfaced. Conversion prompts encourage sign-in at natural moments.

**Prerequisites:** Phase 1 (anonymous identity) and Phase 2 (presence + lobby lifecycle).

---

## 1. Convex Schema Changes

### New Table: `raceHistory`

```typescript
// convex/schema.ts

raceHistory: defineTable({
  playerId: v.string(),
  playerUsername: v.string(),
  opponentId: v.string(),
  opponentUsername: v.string(),
  lobbyId: v.id("lobbies"),
  wpm: v.number(),
  accuracy: v.number(),
  mistakes: v.number(),
  progress: v.number(),
  won: v.boolean(),
  opponentDisconnected: v.boolean(),
  completedAt: v.number(),
})
  .index("by_player_id", ["playerId"])
  .index("by_player_completed", ["playerId", "completedAt"])
  .index("by_lobby_id", ["lobbyId"]),
```

### Update Table: `stats`

Currently `stats` is only updated by practice. We'll update it after multiplayer races too.

No schema change needed — the existing fields (`totalRaces`, `wins`, `avgWpm`, `bestWpm`,
`accuracy`) cover multiplayer use cases. We just need to write to them.

---

## 2. New Convex File: `convex/raceHistory.ts`

### Mutations

#### `saveRaceResult`

Called when a race finishes. Saves a result record for each participant.

```
Args: {
  lobbyId: v.id("lobbies"),
  playerId: v.string(),
  playerToken: v.optional(v.string()),
}
```

**Behavior:**
1. Validate identity
2. Fetch the lobby by `lobbyId`
3. Determine this player's role (host or guest)
4. Extract their stats from `hostProgress` / `guestProgress`
5. Determine winner
6. Calculate accuracy: `correctChars / (correctChars + mistakes) * 100`
   - NOTE: We need to add `totalChars` to the `playerProgress` object in the lobby
     OR calculate accuracy from `progress` and `mistakes`. Simplest: `accuracy = progress > 0 ? Math.max(0, 100 - (mistakes / (textToType.length * progress / 100)) * 100) : 0`
7. Insert a `raceHistory` record for this player
8. If the player is authenticated (no `playerToken`), also update their `stats`:
   - Increment `totalRaces` by 1
   - If won, increment `wins` by 1
   - Recalculate `avgWpm` as running average
   - Update `bestWpm` if this race's WPM is higher
   - Update `accuracy` as running average
   - Set `updatedAt: Date.now()`

```typescript
// Stats update logic:
const oldStats = await getStats(ctx, playerId)
if (oldStats) {
  const newTotalRaces = oldStats.totalRaces + 1
  const newAvgWpm = ((oldStats.avgWpm * oldStats.totalRaces) + raceWpm) / newTotalRaces
  const newBestWpm = Math.max(oldStats.bestWpm, raceWpm)
  const newWins = won ? oldStats.wins + 1 : oldStats.wins
  const newAccuracy = ((oldStats.accuracy * oldStats.totalRaces) + raceAccuracy) / newTotalRaces

  await ctx.db.patch(oldStats._id, {
    totalRaces: newTotalRaces,
    avgWpm: Math.round(newAvgWpm),
    bestWpm: newBestWpm,
    wins: newWins,
    accuracy: Math.round(newAccuracy * 100) / 100,
    updatedAt: Date.now(),
  })
} else {
  // Create initial stats record
  await ctx.db.insert("stats", {
    userId: playerId as Id<"users">,
    totalRaces: 1,
    avgWpm: raceWpm,
    bestWpm: raceWpm,
    wins: won ? 1 : 0,
    accuracy: raceAccuracy,
    totalSessions: 0,
    updatedAt: Date.now(),
  })
}
```

**When to call:** From the client, after the race status changes to `"finished"`.
Each player calls this once for themselves. Idempotency: check if a `raceHistory`
record already exists for this `(lobbyId, playerId)` pair before inserting.

### Queries

#### `getPlayerHistory`

```
Args: {
  playerId: v.string(),
  playerToken: v.optional(v.string()),
  limit: v.optional(v.number()),  // default 50
}
Returns: Array<raceHistory record>, sorted by completedAt descending
```

#### `getRecentOpponents`

Derives the "recently played" list from raceHistory.

```
Args: {
  playerId: v.string(),
  playerToken: v.optional(v.string()),
  limit: v.optional(v.number()),  // default 20
}
Returns: Array<{
  opponentId: string,
  opponentUsername: string,
  lastPlayedAt: number,
  totalGames: number,
  wins: number,
  losses: number,
  lastResult: "win" | "loss",
}>
```

**Implementation:**
1. Query `raceHistory` by `playerId`, ordered by `completedAt` desc
2. Group by `opponentId`
3. For each opponent, compute: total games, wins, losses, last played timestamp
4. Sort by `lastPlayedAt` desc
5. Return top N

---

## 3. New Client Hook: `lib/hooks/useLocalHistory.ts`

Manages localStorage-based history for anonymous players (and as offline cache for auth).

### Interface

```typescript
interface LocalRaceResult {
  opponentUsername: string
  opponentId: string
  wpm: number
  accuracy: number
  won: boolean
  completedAt: number
  lobbyId: string
}

interface LocalPracticeResult {
  wpm: number
  accuracy: number
  duration: number
  difficulty: string
  completedAt: number
}

interface UseLocalHistoryReturn {
  raceHistory: LocalRaceResult[]
  practiceHistory: LocalPracticeResult[]
  addRaceResult: (result: LocalRaceResult) => void
  addPracticeResult: (result: LocalPracticeResult) => void
  clearAll: () => void
  exportForMerge: () => { races: LocalRaceResult[], practices: LocalPracticeResult[] }
}
```

### Storage

- **Key:** `typerush_race_history` — array of `LocalRaceResult`, max 20, FIFO
- **Key:** `typerush_practice_history` — array of `LocalPracticeResult`, max 20, FIFO

### Behavior

```typescript
function addRaceResult(result: LocalRaceResult) {
  const existing = JSON.parse(localStorage.getItem("typerush_race_history") || "[]")
  const updated = [result, ...existing].slice(0, 20)  // prepend, cap at 20
  localStorage.setItem("typerush_race_history", JSON.stringify(updated))
}
```

### When Results Are Saved

- **Anonymous players:** Always save to localStorage via this hook
- **Authenticated players:** Save to Convex `raceHistory` table via `saveRaceResult` mutation.
  Optionally ALSO save to localStorage as an offline cache (nice-to-have, not required).

---

## 4. Triggering Race Result Saves

### Update `app/race/[roomId]/page.tsx`

When `status` changes to `"finished"`:

```tsx
const saveRaceResult = useMutation(api.raceHistory.saveRaceResult)
const { addRaceResult } = useLocalHistory()

useEffect(() => {
  if (status !== "finished" || !lobby || !identity) return
  if (hasCalledSaveRef.current) return
  hasCalledSaveRef.current = true

  const isPlayerHost = lobby.hostId === identity.playerId
  const myProgress = isPlayerHost ? lobby.hostProgress : lobby.guestProgress
  const opponentProgress = isPlayerHost ? lobby.guestProgress : lobby.hostProgress
  const winner = getWinner()
  const didWin = winner === myProgress?.username

  if (identity.isAuthenticated) {
    // Save to Convex
    void saveRaceResult({
      lobbyId: lobby._id,
      playerId: identity.playerId,
      playerToken: undefined,
    })
  }

  // Always save locally (for anonymous, this is their primary store;
  // for auth, this is an optional cache)
  addRaceResult({
    opponentUsername: opponentProgress?.username || "Unknown",
    opponentId: isPlayerHost ? (lobby.guestId || "") : lobby.hostId,
    wpm: myProgress?.wpm || 0,
    accuracy: calculateAccuracy(myProgress),
    won: didWin,
    completedAt: Date.now(),
    lobbyId: roomId,
  })
}, [status])
```

---

## 5. Merge Flow on Login

### The Full Sequence

```
1. Anonymous user has been playing (localStorage has race + practice history)
2. User clicks "Sign in with Google"
3. Google OAuth redirect → back to app
4. AuthProvider detects: isAuthenticated=true AND typerush_anon exists in localStorage
5. Show MergePrompt modal
6. User chooses:
   a. "Merge" → call server merge mutation → clear localStorage history
   b. "Start Fresh" → clear localStorage history immediately
7. Clear typerush_anon from localStorage
8. Update identityStore with authenticated identity
9. Dismiss modal
```

### New Component: `components/auth/MergePrompt.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│              Welcome back!                                   │
│                                                              │
│  We found data from your anonymous session:                  │
│                                                              │
│    🏁  7 multiplayer races  (best: 82 WPM)                  │
│    ⌨️  12 practice sessions  (best: 91 WPM)                  │
│                                                              │
│  Would you like to add this to your account?                 │
│                                                              │
│    [ Start Fresh ]              [ Merge & Keep ]             │
│                                                              │
│  ─────────────────────────────────────────────────           │
│  ℹ️  Merging will combine anonymous stats with your          │
│     existing account data. This cannot be undone.            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Props:**

```typescript
interface MergePromptProps {
  anonymousRaceCount: number
  anonymousBestWpm: number
  anonymousPracticeCount: number
  anonymousPracticeBestWpm: number
  onMerge: () => Promise<void>
  onFresh: () => void
  isLoading: boolean
}
```

**Style:** Full-screen modal with backdrop blur. Match the existing arena design —
dark card with border, arena-heading font, arena-button for primary action.

### New Convex Mutation: `convex/users.ts` → `mergeAnonymousData`

```
Args: {
  authUserId: v.id("users"),
  anonymousPlayerId: v.string(),
  anonymousToken: v.string(),
  raceResults: v.array(v.object({
    opponentUsername: v.string(),
    opponentId: v.string(),
    wpm: v.number(),
    accuracy: v.number(),
    won: v.boolean(),
    completedAt: v.number(),
    lobbyId: v.string(),
  })),
  practiceResults: v.array(v.object({
    wpm: v.number(),
    accuracy: v.number(),
    duration: v.number(),
    difficulty: v.string(),
    completedAt: v.number(),
  })),
}
```

**Behavior:**
1. Validate the anonymous token
2. For each race result:
   - Insert a `raceHistory` record with `playerId: authUserId`
3. For each practice result:
   - Insert a `practiceHistory` record with `userId: authUserId`
4. Update `stats` for the auth user:
   - Recalculate totals/averages incorporating the merged data
5. Mark the anonymous player as claimed: `claimedByUserId: authUserId`
6. Transfer the anonymous profile to auth:
   - If the user had a custom anonymous username, optionally keep it as their profile username

### Update `components/auth/AuthProvider.tsx`

Add merge detection logic:

```tsx
useEffect(() => {
  if (!isLoading && isAuthenticated && currentUser) {
    // Check if anonymous data exists to merge
    const anonData = localStorage.getItem("typerush_anon")
    const raceHistory = localStorage.getItem("typerush_race_history")
    const practiceHistory = localStorage.getItem("typerush_practice_history")

    const hasDataToMerge = anonData && (raceHistory || practiceHistory)

    if (hasDataToMerge) {
      // Set a flag in identityStore to trigger MergePrompt
      setShowMergePrompt(true)
    } else {
      // No anonymous data, proceed normally
      if (anonData) {
        // User had anonymous identity but no history — just clear it
        localStorage.removeItem("typerush_anon")
      }
    }
  }
}, [isLoading, isAuthenticated, currentUser])
```

### Where to Render MergePrompt

In `components/providers/IdentityProvider.tsx` or `app/layout.tsx`:

```tsx
{showMergePrompt && (
  <MergePrompt
    anonymousRaceCount={raceHistory.length}
    anonymousBestWpm={Math.max(...raceHistory.map(r => r.wpm), 0)}
    anonymousPracticeCount={practiceHistory.length}
    anonymousPracticeBestWpm={Math.max(...practiceHistory.map(r => r.wpm), 0)}
    onMerge={handleMerge}
    onFresh={handleFresh}
    isLoading={isMerging}
  />
)}
```

---

## 6. Recently Played Feature

### For Authenticated Users

Query `raceHistory` via `getRecentOpponents`. Display on the history page and
optionally on the race lobby page.

### For Anonymous Users

Derive from localStorage `typerush_race_history`:

```typescript
function getRecentOpponents(history: LocalRaceResult[]): RecentOpponent[] {
  const map = new Map<string, {
    opponentUsername: string
    games: number
    wins: number
    lastPlayedAt: number
  }>()

  for (const race of history) {
    const existing = map.get(race.opponentId) || {
      opponentUsername: race.opponentUsername,
      games: 0,
      wins: 0,
      lastPlayedAt: 0,
    }
    existing.games += 1
    if (race.won) existing.wins += 1
    existing.lastPlayedAt = Math.max(existing.lastPlayedAt, race.completedAt)
    map.set(race.opponentId, existing)
  }

  return Array.from(map.entries())
    .map(([id, data]) => ({ opponentId: id, ...data }))
    .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
}
```

### UI: Recently Played Section

Add to `app/race/page.tsx` below the lobby cards:

```
┌──────────────────────────────────────────────────────┐
│  Recently Played                                     │
│  ────────────────────────────────────────────         │
│                                                      │
│  ┌──────────────────────────────────────────┐        │
│  │  SwiftFox#4829       3 games  │  2W 1L  │        │
│  │  Last played: 2 hours ago                │        │
│  └──────────────────────────────────────────┘        │
│                                                      │
│  ┌──────────────────────────────────────────┐        │
│  │  NeonRacer#7712      1 game   │  0W 1L  │        │
│  │  Last played: Yesterday                  │        │
│  └──────────────────────────────────────────┘        │
│                                                      │
│  ┌──────────────────────────────────────────┐        │
│  │  GhostByte#3341      1 game   │  1W 0L  │        │
│  │  Last played: 3 days ago                 │        │
│  └──────────────────────────────────────────┘        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Style:** Use existing `Card` component. Each opponent row shows:
- Avatar (generated from avatarSeed for anon, Google avatar for auth)
- Username with discriminator
- Total games played together
- Win/loss record
- Relative time since last game

---

## 7. History Page Redesign: `app/history/page.tsx`

### Current State
- Only shows practice history
- Requires authentication

### New State
- Tab navigation: **Practice** | **Multiplayer**
- Works for both anonymous and authenticated users
- Anonymous sees localStorage data (max 20 per tab)
- Authenticated sees Convex data (unlimited)

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  History                                                  │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐                      │
│  │  Practice ●  │  │  Multiplayer │   ← tab navigation   │
│  └─────────────┘  └──────────────┘                      │
│                                                          │
│  ── Practice History ──────────────────────────────       │
│                                                          │
│  │ Date       │ WPM │ Accuracy │ Duration │ Difficulty │ │
│  │ Feb 11     │  78 │  96.2%   │    60s   │   Medium   │ │
│  │ Feb 10     │  82 │  97.1%   │    30s   │   Hard     │ │
│  │ ...        │     │          │          │            │ │
│                                                          │
│  ── When Multiplayer tab is active: ──────────────       │
│                                                          │
│  │ Date       │ Opponent       │ WPM │ Result │         │
│  │ Feb 11     │ SwiftFox#4829  │  82 │  Win ✓ │         │
│  │ Feb 10     │ NeonRacer#7712 │  71 │  Loss  │         │
│  │ ...        │                │     │        │         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### For Anonymous Users

Show a banner at the top:

```
┌──────────────────────────────────────────────────────┐
│  ℹ️  Showing your last 20 results (stored locally).   │
│     Sign in to keep unlimited history.               │
│     Your local data expires in X days.        [→]    │
└──────────────────────────────────────────────────────┘
```

The "X days" is calculated from the anonymous player's `createdAt` + 30 days.

### Data Source Logic

```tsx
const { isAuthenticated } = useConvexAuth()
const { identity } = useIdentityStore()

// Practice history
const serverPracticeHistory = useQuery(
  api.practice.getHistory,
  isAuthenticated ? { userId: identity.playerId } : "skip"
)
const { practiceHistory: localPracticeHistory } = useLocalHistory()

const practiceData = isAuthenticated ? serverPracticeHistory : localPracticeHistory

// Race history
const serverRaceHistory = useQuery(
  api.raceHistory.getPlayerHistory,
  isAuthenticated ? { playerId: identity.playerId } : "skip"
)
const { raceHistory: localRaceHistory } = useLocalHistory()

const raceData = isAuthenticated ? serverRaceHistory : localRaceHistory
```

---

## 8. Data Expiry Banner

### New Component: `components/ui/DataExpiryBanner.tsx`

For anonymous users, show a gentle reminder about data expiration.

**Where it appears:**
- History page (top)
- Race lobby page (below the recently played section, if the user has history)
- Profile page (if we add one for anonymous)

**Content:**
```
┌───────────────────────────────────────────────────────────┐
│  ⏱  Your anonymous data expires in 23 days.               │
│     Sign in with Google to keep your history permanently. │
│                                        [ Sign in ]        │
└───────────────────────────────────────────────────────────┘
```

**Calculation:**
```typescript
const anonData = JSON.parse(localStorage.getItem("typerush_anon") || "{}")
const createdAt = anonData.createdAt || Date.now()
const expiresAt = createdAt + (30 * 24 * 60 * 60 * 1000) // 30 days
const daysRemaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
```

**Style:** Subtle, non-intrusive. Border with amber/yellow tone for urgency when < 7 days.
Blue/neutral when > 7 days.

---

## 9. Conversion Prompts

### Post-Race Conversion (Anonymous Only)

After a race finishes, show a conversion prompt below the results:

```
┌──────────────────────────────────────────────┐
│                 Victory!                      │
│                                              │
│   You: 82 WPM    Opponent: 71 WPM           │
│                                              │
│         [ Race Again ]                       │
│                                              │
│  ─────────────────────────────────           │
│  🏆 Great race! Sign in to save this         │
│     to your permanent record.                │
│                       [ Sign in ]            │
└──────────────────────────────────────────────┘
```

**Trigger conditions:**
- Player is anonymous
- Race just finished
- Player won (higher conversion moment) OR it's their 3rd+ race (show regardless)

**Implementation:** Add to `components/race/RaceUI.tsx` in the finished overlay.

```tsx
{status === "finished" && !identity.isAuthenticated && (
  <div className="mt-6 border-t border-white/12 pt-4">
    <p className="text-sm text-white/60">
      Great race! Sign in to save this to your permanent record.
    </p>
    <Link href="/login" className="arena-button mt-2 inline-block px-6 py-2 text-sm">
      Sign in
    </Link>
  </div>
)}
```

### Milestone Conversion (Future Enhancement)

After N races (5, 10, 25...) show a milestone prompt:
> "You've played 10 races! Sign in to track your progress and climb the leaderboard."

This can be deferred to a later iteration but is worth noting in the architecture.

---

## 10. Ghost Indicator for Anonymous Players

### Visual Cue in Race

During and after a race, anonymous opponents get a subtle ghost icon next to their name.

**In `RaceUI.tsx` and `RaceScene.tsx`:**
- Check if the opponent's ID matches an anonymous player pattern
  (anonymous IDs are Convex document IDs from the `anonymousPlayers` table)
- If so, render a small 👻 or a ghost SVG icon next to their username

**Simple approach:** Store `isAnonymous` in `playerProgress`:

```typescript
// Update playerProgress schema:
const playerProgress = v.object({
  userId: v.string(),
  username: v.string(),
  progress: v.number(),
  wpm: v.number(),
  mistakes: v.number(),
  finished: v.boolean(),
  isAnonymous: v.optional(v.boolean()),  // NEW
})
```

Set it when creating lobby progress:

```typescript
function buildPlayerProgress(userId: string, username: string, isAnonymous: boolean) {
  return {
    userId,
    username,
    progress: 0,
    wpm: 0,
    mistakes: 0,
    finished: false,
    isAnonymous,
  }
}
```

**UI rendering:**

```tsx
<span className="text-sm font-semibold text-white/75">
  {player2.isAnonymous && (
    <span className="mr-1 opacity-50" title="Anonymous player">👻</span>
  )}
  {player2.username}
</span>
```

---

## 11. Practice History for Anonymous

### Current State

Practice sessions are saved to Convex `practiceHistory` table only when authenticated.
`app/practice/page.tsx` lines 86-99 check `isAuthenticated` before saving.

### New State

- **Authenticated:** Save to Convex (existing behavior) AND optionally to localStorage
- **Anonymous:** Save to localStorage only (via `useLocalHistory`)

### Update `app/practice/page.tsx`

```tsx
const { addPracticeResult } = useLocalHistory()
const { identity } = useIdentityStore()

useEffect(() => {
  if (flowState !== "results") return
  if (hasSavedRef.current) return
  hasSavedRef.current = true

  if (isAuthenticated) {
    // Existing: save to Convex
    saveSession({ wpm, accuracy, duration, timeUsed, totalChars, totalWords, mistakes, difficulty })
  }

  // Always save to localStorage (works for both anon and auth as cache)
  addPracticeResult({
    wpm,
    accuracy,
    duration,
    difficulty: settings.difficulty,
    completedAt: Date.now(),
  })
}, [flowState])
```

---

## 12. 30-Day Cleanup Cron — Detailed Logic

### `anonymous.cleanupExpiredAnonymousPlayers`

Already defined in Phase 2's `convex/crons.ts`. Here's the detailed implementation:

```typescript
export const cleanupExpiredAnonymousPlayers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)

    const expiredPlayers = await ctx.db
      .query("anonymousPlayers")
      .withIndex("by_last_seen", (q) => q.lt("lastSeenAt", thirtyDaysAgo))
      .collect()

    for (const player of expiredPlayers) {
      // Skip if this identity was claimed by an auth user
      if (player.claimedByUserId) continue

      // Delete their race history
      const history = await ctx.db
        .query("raceHistory")
        .withIndex("by_player_id", (q) => q.eq("playerId", player._id))
        .collect()

      for (const record of history) {
        await ctx.db.delete(record._id)
      }

      // Delete their presence (should already be gone, but safety)
      const presence = await ctx.db
        .query("presence")
        .withIndex("by_player_id", (q) => q.eq("playerId", player._id))
        .unique()

      if (presence) {
        await ctx.db.delete(presence._id)
      }

      // Delete their profile
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user_id", (q) => q.eq("userId", player._id))
        .unique()

      if (profile) {
        await ctx.db.delete(profile._id)
      }

      // Finally delete the anonymous player record
      await ctx.db.delete(player._id)
    }
  },
})
```

---

## 13. Implementation Order (within Phase 3)

```
Step 1:  convex/schema.ts             — add raceHistory table, update playerProgress
Step 2:  convex/raceHistory.ts         — saveRaceResult, getPlayerHistory, getRecentOpponents
Step 3:  lib/hooks/useLocalHistory.ts  — localStorage history management
Step 4:  app/race/[roomId]/page.tsx    — trigger saveRaceResult on race finish
Step 5:  app/practice/page.tsx         — save practice results to localStorage for anonymous
Step 6:  convex/users.ts              — mergeAnonymousData mutation
Step 7:  components/auth/MergePrompt.tsx — merge/fresh modal
Step 8:  components/auth/AuthProvider.tsx — trigger merge prompt on login
Step 9:  app/history/page.tsx          — redesign with tabs, dual data source
Step 10: app/race/page.tsx             — add recently played section
Step 11: components/ui/DataExpiryBanner.tsx — expiry notice for anonymous
Step 12: components/race/RaceUI.tsx    — conversion prompt after race, ghost indicator
Step 13: convex/anonymous.ts           — cleanupExpiredAnonymousPlayers detailed logic
Step 14: convex/lobbies.ts             — add isAnonymous to playerProgress
Step 15: Integration testing — merge flow, history display, cleanup cron
```

---

## 14. Testing Checklist

### Race History
- [ ] Authenticated player finishes a race → `raceHistory` record created in Convex
- [ ] Authenticated player finishes a race → `stats` updated (totalRaces, wins, avgWpm, bestWpm)
- [ ] Anonymous player finishes a race → result saved to localStorage
- [ ] Anonymous player's localStorage shows max 20 race results (21st evicts oldest)
- [ ] Race history correctly identifies winner and records `won: true/false`
- [ ] Opponent disconnect race → `opponentDisconnected: true` in history record
- [ ] Duplicate save prevention: calling saveRaceResult twice for same lobby+player → only 1 record

### Merge Flow
- [ ] Anonymous user with history signs in → MergePrompt modal appears
- [ ] Clicking "Merge & Keep" → anonymous race + practice history transferred to auth account
- [ ] Stats correctly recalculated after merge (averages, totals, bests)
- [ ] Clicking "Start Fresh" → localStorage cleared, no data transferred
- [ ] After merge, `typerush_anon` and history keys removed from localStorage
- [ ] Anonymous player marked as `claimedByUserId` after merge
- [ ] Anonymous user with NO history signs in → no merge prompt, clean login
- [ ] Returning auth user (who logged out, played anon, logged back in) → merge prompt shows with existing data context

### Recently Played
- [ ] After 3 races against different opponents → recently played shows 3 entries
- [ ] Entries sorted by most recent
- [ ] Win/loss count accurate
- [ ] Anonymous recently played derived from localStorage
- [ ] Authenticated recently played derived from Convex `raceHistory`

### History Page
- [ ] Tab navigation between Practice and Multiplayer works
- [ ] Anonymous user sees localStorage data on both tabs
- [ ] Authenticated user sees Convex data on both tabs
- [ ] "Last 20 results" banner shown for anonymous
- [ ] "Sign in to keep unlimited history" CTA present
- [ ] Data expiry banner shows correct days remaining

### Conversion & UI
- [ ] Anonymous player wins a race → conversion prompt appears below results
- [ ] Conversion prompt links to `/login`
- [ ] Ghost icon appears next to anonymous opponent's name
- [ ] Data expiry banner: blue when > 7 days, amber when ≤ 7 days
- [ ] Data expiry banner not shown for authenticated users

### Cleanup
- [ ] Cron runs → anonymous players inactive for 30+ days are deleted
- [ ] Their race history is deleted
- [ ] Their profiles are deleted
- [ ] Claimed anonymous players (merged) are NOT deleted

### Practice for Anonymous
- [ ] Anonymous user completes practice → saved to localStorage
- [ ] localStorage shows max 20 practice results
- [ ] Authenticated user completes practice → saved to BOTH Convex and localStorage
