import { action, internalMutation, mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { anyApi } from "convex/server"
import { internal } from "./_generated/api"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const CLEANUP_BATCH_SIZE = 200

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

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateUsername(): string {
  return `${randomPick(adjectives)}${randomPick(nouns)}`
}

function generateDiscriminator(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function generateToken(): string {
  return crypto.randomUUID()
}

function generateAvatarSeed(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let seed = ""
  for (let i = 0; i < 12; i++) {
    seed += chars[Math.floor(Math.random() * chars.length)]
  }
  return seed
}

export const registerAnonymousInternal = internalMutation({
  args: {
    token: v.string(),
    username: v.string(),
    discriminator: v.string(),
    avatarSeed: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const playerId = await ctx.db.insert("anonymousPlayers", {
      secretToken: args.token,
      username: args.username,
      discriminator: args.discriminator,
      avatarSeed: args.avatarSeed,
      createdAt: args.now,
      lastSeenAt: args.now,
      actionCount: 0,
      actionWindowStart: args.now,
    })

    return { playerId: playerId as string }
  },
})

export const registerAnonymous = action({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const token = generateToken()
    const username = generateUsername()
    const discriminator = generateDiscriminator()
    const avatarSeed = generateAvatarSeed()

    const { playerId } = await ctx.runMutation(
      // Internal mutation keeps DB writes deterministic while action can use secure RNG.
      anyApi.anonymous.registerAnonymousInternal,
      { token, username, discriminator, avatarSeed, now }
    )

    return {
      playerId,
      token,
      username,
      discriminator,
      avatarSeed,
    }
  },
})

export const getAnonymousPlayer = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("anonymousPlayers")
      .withIndex("by_secret_token", (q) => q.eq("secretToken", args.token))
      .unique()

    if (!player || player.claimedByUserId) return null

    return {
      playerId: player._id as string,
      username: player.username,
      discriminator: player.discriminator,
      avatarSeed: player.avatarSeed,
      createdAt: player.createdAt,
      lastSeenAt: player.lastSeenAt,
    }
  },
})

export const refreshLastSeen = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("anonymousPlayers")
      .withIndex("by_secret_token", (q) => q.eq("secretToken", args.token))
      .unique()

    if (!player || player.claimedByUserId) return

    await ctx.db.patch(player._id, { lastSeenAt: Date.now() })
  },
})

export const updateUsername = mutation({
  args: {
    token: v.string(),
    newUsername: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.newUsername.trim()

    if (trimmed.length < 2 || trimmed.length > 20) {
      return { ok: false as const, error: "Username must be 2-20 characters" }
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return { ok: false as const, error: "Only letters, numbers, and underscores allowed" }
    }

    const player = await ctx.db
      .query("anonymousPlayers")
      .withIndex("by_secret_token", (q) => q.eq("secretToken", args.token))
      .unique()

    if (!player || player.claimedByUserId) {
      return { ok: false as const, error: "Invalid identity" }
    }

    await ctx.db.patch(player._id, {
      username: trimmed,
      lastSeenAt: Date.now(),
    })

    return { ok: true as const }
  },
})

export const cleanupExpiredAnonymousPlayers = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    cutoff: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoff = args.cutoff ?? (Date.now() - THIRTY_DAYS_MS)

    const stalePage = await ctx.db
      .query("anonymousPlayers")
      .withIndex("by_last_seen", (q) => q.lt("lastSeenAt", cutoff))
      .paginate({
        numItems: CLEANUP_BATCH_SIZE,
        cursor: args.cursor ?? null,
      })

    for (const player of stalePage.page) {
      if (player.claimedByUserId) continue

      const playerId = player._id as string

      const raceRecords = await ctx.db
        .query("raceHistory")
        .withIndex("by_player_id", (q) => q.eq("playerId", playerId))
        .collect()

      for (const record of raceRecords) {
        await ctx.db.delete(record._id)
      }

      const presence = await ctx.db
        .query("presence")
        .withIndex("by_player_id", (q) => q.eq("playerId", playerId))
        .unique()

      if (presence) {
        await ctx.db.delete(presence._id)
      }

      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user_id", (q) => q.eq("userId", playerId))
        .unique()

      if (profile) {
        await ctx.db.delete(profile._id)
      }

      await ctx.db.delete(player._id)
    }

    if (!stalePage.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.anonymous.cleanupExpiredAnonymousPlayers,
        {
          cursor: stalePage.continueCursor,
          cutoff,
        }
      )
    }
  },
})
