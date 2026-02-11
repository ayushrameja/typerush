# Phase 1 — Anonymous Identity + Remove Login Gate ✅ COMPLETE

> **Status:** All 15 steps implemented. TypeScript compiles with 0 errors.
> **Branch:** `ayush/anonymous-multiplayer`

## Goal

Any visitor can create, join, or quick-match a multiplayer race without signing in.
A server-issued anonymous identity makes this secure and trackable.

---

## 1. Convex Schema Changes

### New Table: `anonymousPlayers`

```typescript
// convex/schema.ts

anonymousPlayers: defineTable({
  secretToken: v.string(),
  username: v.string(),
  discriminator: v.string(),            // 4-digit display tag e.g. "4829"
  avatarSeed: v.string(),               // seed for deterministic avatar generation
  createdAt: v.number(),
  lastSeenAt: v.number(),
  actionCount: v.number(),              // for rate limiting
  actionWindowStart: v.number(),        // rate limit window start timestamp
  claimedByUserId: v.optional(v.id("users")),
})
  .index("by_secret_token", ["secretToken"])
  .index("by_last_seen", ["lastSeenAt"]),
```

### Update Table: `lobbies`

Add token fields for server-side identity validation:

```typescript
// convex/schema.ts — lobbies table additions

lobbies: defineTable({
  hostId: v.string(),
  hostToken: v.optional(v.string()),     // anonymous host's secret token (null for auth users)
  roomCode: v.string(),
  status: raceStatus,
  guestId: v.optional(v.string()),
  guestToken: v.optional(v.string()),    // anonymous guest's secret token
  textToType: v.string(),
  createdAt: v.number(),
  countdown: v.number(),
  timeLeft: v.number(),
  hostProgress: playerProgress,
  guestProgress: v.optional(playerProgress),
})
  .index("by_room_code", ["roomCode"])
  .index("by_status_created_at", ["status", "createdAt"]),
```

---

## 2. New Convex File: `convex/anonymous.ts`

### Mutations

#### `registerAnonymous`
- Called on first visit when no `typerush_anon` exists in localStorage
- Generates a UUID v4 secret token
- Generates a fun username + 4-digit discriminator
- Generates a random avatar seed
- Creates an `anonymousPlayers` record
- Returns `{ playerId: doc._id, token, username, discriminator, avatarSeed }`

```
Args: none (no auth required)
Returns: { playerId: string, token: string, username: string, discriminator: string, avatarSeed: string }
```

**Rate limit on creation:** Check if the same token was created within the last 60 seconds (prevent spam). Since this is a new identity, use a simple debounce — if the client calls this more than 3 times in 60s from the same connection, reject.

#### `validateToken`
- Takes a token string, returns the anonymous player record if valid and not claimed
- Used internally by lobby mutations to verify identity

```
Args: { token: v.string() }
Returns: anonymousPlayer doc | null
```

#### `refreshLastSeen`
- Updates `lastSeenAt` to `Date.now()`
- Called periodically (on lobby join, race finish, etc.)

```
Args: { token: v.string() }
Returns: void
```

#### `updateUsername`
- Allows anonymous player to change their display name
- Validates name length (2-20 chars), no special chars

```
Args: { token: v.string(), newUsername: v.string() }
Returns: { ok: boolean, error?: string }
```

### Queries

#### `getAnonymousPlayer`
- Fetch anonymous player data by token (for client hydration)

```
Args: { token: v.string() }
Returns: anonymousPlayer doc | null
```

---

## 3. Update Convex File: `convex/lobbies.ts`

### Identity Resolution Pattern

Every lobby mutation that currently accepts a bare `userId` string will now accept an identity object:

```typescript
const identityArgs = {
  playerId: v.string(),          // anonymous player _id or auth user _id
  playerToken: v.optional(v.string()),  // present for anonymous, absent for auth
}
```

**Internal helper: `resolveAndValidatePlayer`**

```typescript
async function resolveAndValidatePlayer(
  ctx: MutationCtx,
  playerId: string,
  playerToken?: string
): Promise<{ valid: boolean; username: string }> {
  if (playerToken) {
    // Anonymous path: validate token matches playerId
    const anon = await ctx.db
      .query("anonymousPlayers")
      .withIndex("by_secret_token", (q) => q.eq("secretToken", playerToken))
      .unique()

    if (!anon || anon._id !== playerId || anon.claimedByUserId) {
      return { valid: false, username: "" }
    }

    // Update lastSeenAt
    await ctx.db.patch(anon._id, { lastSeenAt: Date.now() })
    return { valid: true, username: `${anon.username}#${anon.discriminator}` }
  }

  // Auth path: verify user exists
  // (In future Phase, could call getAuthUserId for stricter check)
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user_id", (q) => q.eq("userId", playerId))
    .unique()

  return { valid: true, username: profile?.username || "Player" }
}
```

### Rate Limiting Helper

```typescript
const RATE_LIMIT_WINDOW = 60 * 60 * 1000  // 1 hour
const MAX_LOBBY_CREATES = 10
const MAX_LOBBY_JOINS = 30

async function checkRateLimit(
  ctx: MutationCtx,
  token: string,
  actionType: "create" | "join"
): Promise<boolean> {
  const anon = await ctx.db
    .query("anonymousPlayers")
    .withIndex("by_secret_token", (q) => q.eq("secretToken", token))
    .unique()

  if (!anon) return false

  const now = Date.now()
  const windowExpired = now - anon.actionWindowStart > RATE_LIMIT_WINDOW

  if (windowExpired) {
    await ctx.db.patch(anon._id, {
      actionCount: 1,
      actionWindowStart: now,
    })
    return true
  }

  const limit = actionType === "create" ? MAX_LOBBY_CREATES : MAX_LOBBY_JOINS
  if (anon.actionCount >= limit) return false

  await ctx.db.patch(anon._id, { actionCount: anon.actionCount + 1 })
  return true
}
```

### Updated Mutations

#### `createLobby` — updated signature

```
Args: {
  playerId: v.string(),
  playerToken: v.optional(v.string()),
  username: v.string(),
  textToType: v.string(),
}
```

Changes:
1. Call `resolveAndValidatePlayer` — reject if invalid
2. If `playerToken` is present, call `checkRateLimit("create")` — reject if exceeded
3. Store `hostToken` on the lobby document (for later validation of host actions)
4. Rest of the logic stays the same

#### `joinLobbyByCode` — updated signature

```
Args: {
  playerId: v.string(),
  playerToken: v.optional(v.string()),
  username: v.string(),
  roomCode: v.string(),
}
```

Changes:
1. Call `resolveAndValidatePlayer` — reject if invalid
2. If `playerToken` is present, call `checkRateLimit("join")` — reject if exceeded
3. Store `guestToken` on the lobby document
4. Rest stays the same

#### `findOrCreateMatch` — updated signature

```
Args: {
  playerId: v.string(),
  playerToken: v.optional(v.string()),
  username: v.string(),
  textToType: v.string(),
}
```

Changes:
1. Call `resolveAndValidatePlayer` — reject if invalid
2. Rate limit check
3. Rest stays the same (presence check added in Phase 2)

#### `startRace`, `setCountdown`, `setTimeLeft`, `updatePlayerProgress`, `finishRace`

Update `actorId` / `playerId` args to also accept optional `playerToken`.
Validate identity on each call using `resolveAndValidatePlayer`.

---

## 4. New Client File: `lib/utils/nameGenerator.ts`

Fun name generator that creates memorable, game-appropriate names.

**Pattern:** `{Adjective}{Noun}_{4-digit-number}`

```typescript
const adjectives = [
  "Swift", "Neon", "Shadow", "Blazing", "Cyber", "Frost",
  "Storm", "Hyper", "Turbo", "Pixel", "Phantom", "Quantum",
  "Rapid", "Stealth", "Chrome", "Crimson", "Astral", "Volt",
  "Echo", "Prism", "Onyx", "Titan", "Omega", "Flux",
  "Nova", "Apex", "Zero", "Drift", "Pulse", "Viper",
]

const nouns = [
  "Fox", "Hawk", "Wolf", "Typer", "Racer", "Ghost",
  "Knight", "Runner", "Bolt", "Spark", "Rider", "Claw",
  "Flame", "Arrow", "Blade", "Dash", "Strike", "Raven",
  "Fury", "Comet", "Fang", "Storm", "Lynx", "Jet",
  "Surge", "Wraith", "Phoenix", "Byte", "Glitch", "Core",
]

export function generateFunName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj}${noun}`
}

export function generateDiscriminator(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export function formatDisplayName(username: string, discriminator: string): string {
  return `${username}#${discriminator}`
}
```

---

## 5. New Client File: `lib/stores/identityStore.ts`

Zustand store managing the unified player identity (anonymous or authenticated).

```typescript
interface PlayerIdentity {
  playerId: string
  username: string
  discriminator: string
  avatarSeed: string
  isAuthenticated: boolean
  token: string | null           // null when authenticated
  email: string | null           // null when anonymous
  avatarUrl: string | null       // Google avatar for auth, generated for anon
}

interface IdentityState {
  identity: PlayerIdentity | null
  isReady: boolean               // true once identity is resolved (anon or auth)

  setIdentity: (identity: PlayerIdentity) => void
  clear: () => void
  setReady: (ready: boolean) => void
  updateUsername: (username: string) => void
}
```

**localStorage key:** `typerush_anon`

```typescript
interface StoredAnonIdentity {
  token: string
  playerId: string
  username: string
  discriminator: string
  avatarSeed: string
  createdAt: number
}
```

---

## 6. New Client Hook: `lib/hooks/useAnonymousIdentity.ts`

Runs on app mount. Determines whether the user has an existing anonymous identity
in localStorage, validates it with the server, or creates a new one.

**Flow:**

```
1. Check if Convex auth is loading → wait
2. If authenticated → skip anonymous flow (AuthProvider handles identity)
3. If not authenticated:
   a. Read `typerush_anon` from localStorage
   b. If exists → call `getAnonymousPlayer({ token })` to validate
      - If valid → hydrate identityStore with anonymous identity
      - If invalid (expired/claimed) → clear localStorage, go to step c
   c. If no stored identity → call `registerAnonymous` mutation
      - Store returned data in localStorage as `typerush_anon`
      - Hydrate identityStore
4. Set identityStore.isReady = true
```

**Where to mount:** In `AuthProvider.tsx` or a new `IdentityProvider` wrapper that sits
alongside `AuthProvider` in the component tree.

---

## 7. Update Client File: `components/auth/AuthProvider.tsx`

### Current behavior
- Watches `useConvexAuth()` for auth state
- When authenticated, fetches `currentUser` and populates `userStore`
- When not authenticated, clears `userStore`

### New behavior
- When authenticated: same as before, PLUS set `identityStore` with auth identity
- When not authenticated: DON'T clear everything. Instead:
  - Check if an anonymous identity exists in `identityStore`
  - If yes, keep it (silent fallback)
  - If no, the `useAnonymousIdentity` hook will handle registration
- On transition from auth → not-auth (logout/token expiry):
  - Show soft banner: "Signed out. Playing as {anonymousUsername}. Sign in to save progress."
  - Preserve the anonymous identity that was already in localStorage

### New behavior on transition from not-auth → auth (login):
- Check if `typerush_anon` exists in localStorage
- If yes, trigger the merge prompt (Phase 3 — for now, just clear the anon data)
- Set `identityStore` with the authenticated identity

---

## 8. Update Client File: `lib/stores/userStore.ts`

### Current `AppUser`

```typescript
interface AppUser {
  id: string
  isAnonymous: boolean
  name: string
  email: string | null
  avatarUrl: string | null
}
```

### Updated `AppUser`

```typescript
interface AppUser {
  id: string
  isAnonymous: boolean
  name: string
  displayName: string             // "Username#1234" for anon, Google name for auth
  email: string | null
  avatarUrl: string | null
  avatarSeed: string | null       // for generated avatars (anon only)
  token: string | null            // anonymous secret token (null for auth)
}
```

The `userStore` will now be populated for BOTH anonymous and authenticated users.
This means every component that checks `if (!user)` to gate multiplayer will
automatically work once the anonymous identity is loaded.

---

## 9. UI Changes: `app/race/page.tsx`

### Remove Login Gate

**Before:**
```tsx
if (!user) {
  router.push('/login');
  return;
}
```

**After:**
```tsx
// No redirect. Anonymous users have a valid identity via identityStore.
// The identity is always available by the time the user reaches this page.
```

**Specific changes:**

1. **Remove** the `!user` check from `handleCreateRoom`, `handleJoinRoom`, `handleFindMatch`
2. **Remove** the `disabled={!user}` from all buttons
3. **Remove** the red "sign in to play" banner entirely
4. **Add** a softer blue/neutral banner for anonymous users:
   > "Playing as **SwiftFox#4829**. [Sign in] to save your progress and stats."
5. **Add** inline username editor next to the anonymous name (pencil icon, click to edit)
6. **Update** mutation calls to pass `playerToken` from identity:

```tsx
const { identity } = useIdentityStore()

const result = await createLobby({
  playerId: identity.playerId,
  playerToken: identity.token ?? undefined,
  username: identity.displayName,
  textToType,
})
```

### New Component: Username Editor

Position it in the banner for anonymous users:

```
┌────────────────────────────────────────────────────────┐
│  Playing as  SwiftFox#4829  ✏️  │  Sign in to save →  │
└────────────────────────────────────────────────────────┘
```

Clicking the pencil opens an inline input. On blur/enter, calls `updateUsername` mutation
and updates `identityStore` + localStorage.

---

## 10. UI Changes: `app/race/[roomId]/page.tsx`

### Remove Login Redirect

**Before (line 63-67):**
```tsx
useEffect(() => {
  if (!isLoading && !user) {
    router.push("/login")
  }
}, [isLoading, user, router])
```

**After:**
```tsx
// Remove this effect entirely.
// Anonymous users are now valid players.
// The page works as long as identityStore.isReady is true.
```

### Update Player ID References

Replace all instances of `user.id` with `identity.playerId` and pass
`identity.token` to mutations:

```tsx
const { identity } = useIdentityStore()

// In handleKeyDown callback:
void updatePlayerProgressRemote({
  lobbyId: lobby._id,
  playerId: identity.playerId,
  playerToken: identity.token ?? undefined,
  progress,
  wpm: newWpm,
  mistakes,
  finished,
})
```

Same update for `startRace`, `setCountdown`, `setTimeLeft`, `finishRace`.

### Update Host Check

```tsx
// Before
const isHost = !!user && !!lobby && lobby.hostId === user.id

// After
const isHost = !!identity && !!lobby && lobby.hostId === identity.playerId
```

---

## 11. UI Changes: `components/ui/FloatingNavbar.tsx`

### "Friends" Link

**Before (line 189-201):** Links to `/login` when not authenticated.

**After:** Always links to `/race`. Anonymous users can access multiplayer.

```tsx
<Link
  href="/race"
  aria-label="Friends"
  title="Friends"
  className="core-rail-action"
>
```

### Right Side Panel — Anonymous User Info

When not authenticated but anonymous identity exists, show:

```
┌──────────────────┐
│  SwiftFox#4829   │
│  Anonymous       │
│  ──────────────  │
│  🔓 Sign in     │
└──────────────────┘
```

Instead of just a "Sign in" link, show the anonymous display name with a
"Sign in to unlock all features" prompt.

### Mobile Nav

Same change: Login button becomes "Sign in" with anonymous name visible.

---

## 12. UI Changes: `components/home/HeroLobby.tsx`

### Display Name for Anonymous

**Before (line 20):**
```tsx
const displayName = user?.name?.trim() || fallbackName;
```

**After:**
```tsx
const { identity } = useIdentityStore()
const displayName = identity?.displayName || fallbackName
```

### "Add friends" Link

**Before (line 35):**
```tsx
const addFriendsHref = isAuthenticated ? "/race" : "/login";
```

**After:**
```tsx
const addFriendsHref = "/race"  // Always go to race, login not required
```

### Avatar for Anonymous

When anonymous, don't show a Google avatar. Instead show a generated avatar
using the `avatarSeed` (can use DiceBear or a simple color-based initial avatar).

---

## 13. UI Changes: `app/(auth)/login/page.tsx`

### Update Copy

**Before:** "Multiplayer requires a Google login."

**After:** "Sign in to save your race history, track stats, and unlock all features."

Add a section showing what signing in gives you:
- Permanent race history
- Cross-device sync
- Leaderboard participation
- Public profile

### Add "Continue as Guest" Link

```tsx
<Link href="/race" className="text-white/60 hover:text-white/80 text-sm mt-4">
  Continue as guest →
</Link>
```

---

## 14. New Component: `components/ui/UsernameEditor.tsx`

Inline click-to-edit component for anonymous usernames.

**Props:**
```typescript
interface UsernameEditorProps {
  currentName: string
  discriminator: string
  onSave: (newName: string) => Promise<void>
}
```

**Behavior:**
- Display mode: shows `{name}#{discriminator}` with a pencil icon
- Edit mode (on click): replaces name with an input field, discriminator stays fixed
- Validation: 2-20 characters, alphanumeric + underscore only
- On save: calls `updateUsername` mutation, updates `identityStore` + localStorage
- Loading state while saving

**Visual style:** Match the existing arena design system — dark input with white/60 border,
red accent on focus.

---

## 15. New Component: `components/providers/IdentityProvider.tsx`

Wraps the app alongside `AuthProvider` and `ConvexClientProvider`.

```tsx
// app/layout.tsx component tree:

<ConvexClientProvider>
  <AuthProvider>
    <IdentityProvider>    {/* NEW */}
      <FloatingNavbar />
      {children}
    </IdentityProvider>
  </AuthProvider>
</ConvexClientProvider>
```

**Responsibilities:**
1. On mount, determine identity (auth or anonymous)
2. If auth → identity comes from `AuthProvider` / `userStore`
3. If not auth → run `useAnonymousIdentity` hook
4. Exposes identity via `identityStore` (zustand, no context needed)
5. Sets `identityStore.isReady = true` once resolved

---

## 16. Type Updates: `lib/types/user.ts`

```typescript
export interface AppUser {
  id: string
  isAnonymous: boolean
  name: string
  displayName: string
  email: string | null
  avatarUrl: string | null
  avatarSeed: string | null
  token: string | null
}

export interface AnonymousIdentity {
  token: string
  playerId: string
  username: string
  discriminator: string
  avatarSeed: string
  createdAt: number
}

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface Stats {
  id?: string
  user_id: string
  avg_wpm: number
  best_wpm: number
  total_races: number
  wins: number
  accuracy: number
}
```

---

## Implementation Order (within Phase 1)

```
Step 1:  ✅ convex/schema.ts          — add anonymousPlayers table, update lobbies
Step 2:  ✅ lib/utils/nameGenerator.ts — fun name generator
Step 3:  ✅ convex/anonymous.ts       — register, validate, updateUsername mutations
Step 4:  ✅ lib/types/user.ts         — extend types
Step 5:  ✅ lib/stores/identityStore.ts — new zustand store
Step 6:  ✅ lib/hooks/useAnonymousIdentity.ts — registration/hydration hook
Step 7:  ✅ components/providers/IdentityProvider.tsx — identity provider
Step 8:  ✅ components/auth/AuthProvider.tsx — update for dual identity
Step 9:  ✅ convex/lobbies.ts         — update mutations with identity validation + rate limiting
Step 10: ✅ app/race/page.tsx         — remove login gate, use identity, add banner + editor
Step 11: ✅ app/race/[roomId]/page.tsx — remove redirect, use identity
Step 12: ✅ components/ui/UsernameEditor.tsx — inline name editor
Step 13: ✅ components/ui/FloatingNavbar.tsx — update links + anon user display
Step 14: ✅ components/home/HeroLobby.tsx — update display name + link
Step 15: ✅ app/(auth)/login/page.tsx — update copy + add "continue as guest"
```

---

## Testing Checklist

- [ ] New visitor lands on `/race` → anonymous identity auto-created → can create room
- [ ] New visitor clicks Quick Match → gets matched (or creates lobby) successfully
- [ ] Anonymous player joins by room code → works
- [ ] Anonymous player can edit their username → updates in lobby + localStorage
- [ ] Fun name is auto-generated and looks good (no duplicates in same lobby)
- [ ] Rate limit: creating 11+ lobbies in an hour gets rejected with clear error message
- [ ] Clearing localStorage → next visit gets a new anonymous identity
- [ ] Auth user plays multiplayer → works exactly as before (no regression)
- [ ] Auth user's mutations don't require `playerToken`
- [ ] Lobby document stores `hostToken`/`guestToken` correctly
- [ ] Invalid/expired token → mutation rejects with "Invalid identity" error
- [ ] Page loads: `identityStore.isReady` becomes `true` within ~500ms
- [ ] Lobby buttons are enabled immediately for anonymous users (no disabled state)
- [ ] Sign-in banner shows for anonymous but NOT for authenticated users
