import { action, internalMutation, mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { anyApi } from "convex/server"

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
