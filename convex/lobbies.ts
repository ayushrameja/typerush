import { mutation, query, internalMutation } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"
import { v } from "convex/values"

const roomCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

const raceStatus = v.union(
  v.literal("waiting"),
  v.literal("countdown"),
  v.literal("racing"),
  v.literal("finished")
)

const playerProgressArgs = {
  progress: v.number(),
  wpm: v.number(),
  mistakes: v.number(),
  finished: v.boolean(),
}

const RATE_LIMIT_WINDOW = 60 * 60 * 1000
const MAX_LOBBY_CREATES = 10
const MAX_LOBBY_JOINS = 30

function createRoomCode() {
  let code = ""
  for (let i = 0; i < 6; i += 1) {
    code += roomCodeChars[Math.floor(Math.random() * roomCodeChars.length)]
  }
  return code
}

function buildPlayerProgress(userId: string, username: string) {
  return {
    userId,
    username,
    progress: 0,
    wpm: 0,
    mistakes: 0,
    finished: false,
  }
}

async function resolveAndValidatePlayer(
  ctx: MutationCtx,
  playerId: string,
  playerToken?: string
): Promise<{ valid: boolean; username: string }> {
  if (playerToken) {
    const anon = await ctx.db
      .query("anonymousPlayers")
      .withIndex("by_secret_token", (q) => q.eq("secretToken", playerToken))
      .unique()

    if (!anon || (anon._id as string) !== playerId || anon.claimedByUserId) {
      return { valid: false, username: "" }
    }

    await ctx.db.patch(anon._id, { lastSeenAt: Date.now() })
    return { valid: true, username: `${anon.username}#${anon.discriminator}` }
  }

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user_id", (q) => q.eq("userId", playerId))
    .unique()

  return { valid: true, username: profile?.username || "Player" }
}

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

async function upsertProfile(ctx: MutationCtx, userId: string, username: string) {
  const existing = await ctx.db
    .query("profiles")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .unique()

  if (!existing) {
    await ctx.db.insert("profiles", {
      userId,
      username,
      createdAt: Date.now(),
    })
    return
  }

  if (existing.username !== username) {
    await ctx.db.patch(existing._id, { username })
  }
}

async function getUniqueRoomCode(ctx: MutationCtx) {
  for (let i = 0; i < 12; i += 1) {
    const roomCode = createRoomCode()
    const existing = await ctx.db
      .query("lobbies")
      .withIndex("by_room_code", (q) => q.eq("roomCode", roomCode))
      .first()

    if (!existing) {
      return roomCode
    }
  }

  return `${createRoomCode().slice(0, 4)}${Date.now().toString().slice(-2)}`
}

export const createLobby = mutation({
  args: {
    playerId: v.string(),
    playerToken: v.optional(v.string()),
    username: v.string(),
    textToType: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await resolveAndValidatePlayer(ctx, args.playerId, args.playerToken)
    if (!identity.valid) {
      throw new Error("Invalid identity")
    }

    if (args.playerToken) {
      const allowed = await checkRateLimit(ctx, args.playerToken, "create")
      if (!allowed) {
        throw new Error("Rate limit exceeded. Please wait before creating more lobbies.")
      }
    }

    if (!args.playerToken) {
      await upsertProfile(ctx, args.playerId, args.username)
    }

    const roomCode = await getUniqueRoomCode(ctx)
    const lobbyId = await ctx.db.insert("lobbies", {
      hostId: args.playerId,
      hostToken: args.playerToken,
      roomCode,
      status: "waiting",
      textToType: args.textToType,
      createdAt: Date.now(),
      countdown: 3,
      timeLeft: 60,
      hostProgress: buildPlayerProgress(args.playerId, args.username),
    })

    return {
      lobbyId,
      roomCode,
      role: "host" as const,
    }
  },
})

export const joinLobbyByCode = mutation({
  args: {
    playerId: v.string(),
    playerToken: v.optional(v.string()),
    username: v.string(),
    roomCode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await resolveAndValidatePlayer(ctx, args.playerId, args.playerToken)
    if (!identity.valid) {
      return { ok: false as const, error: "Invalid identity" }
    }

    if (args.playerToken) {
      const allowed = await checkRateLimit(ctx, args.playerToken, "join")
      if (!allowed) {
        return { ok: false as const, error: "Rate limit exceeded. Please wait before joining more lobbies." }
      }
    }

    if (!args.playerToken) {
      await upsertProfile(ctx, args.playerId, args.username)
    }

    const normalizedCode = args.roomCode.trim().toUpperCase()
    const candidates = await ctx.db
      .query("lobbies")
      .withIndex("by_room_code", (q) => q.eq("roomCode", normalizedCode))
      .collect()

    const lobby = candidates
      .filter((entry) => entry.status === "waiting")
      .sort((a, b) => a.createdAt - b.createdAt)[0]

    if (!lobby) {
      return {
        ok: false as const,
        error: "Room not found or already started",
      }
    }

    if (lobby.hostId === args.playerId) {
      return {
        ok: false as const,
        error: "You cannot join your own room",
      }
    }

    if (lobby.guestId && lobby.guestId !== args.playerId) {
      return {
        ok: false as const,
        error: "Room is already full",
      }
    }

    if (!lobby.guestId) {
      await ctx.db.patch(lobby._id, {
        guestId: args.playerId,
        guestToken: args.playerToken,
        guestProgress: buildPlayerProgress(args.playerId, args.username),
      })
    }

    return {
      ok: true as const,
      lobbyId: lobby._id,
    }
  },
})

export const findOrCreateMatch = mutation({
  args: {
    playerId: v.string(),
    playerToken: v.optional(v.string()),
    username: v.string(),
    textToType: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await resolveAndValidatePlayer(ctx, args.playerId, args.playerToken)
    if (!identity.valid) {
      throw new Error("Invalid identity")
    }

    if (args.playerToken) {
      const allowed = await checkRateLimit(ctx, args.playerToken, "join")
      if (!allowed) {
        throw new Error("Rate limit exceeded. Please wait before finding more matches.")
      }
    }

    if (!args.playerToken) {
      await upsertProfile(ctx, args.playerId, args.username)
    }

    const waiting = await ctx.db
      .query("lobbies")
      .withIndex("by_status_created_at", (q) => q.eq("status", "waiting"))
      .collect()

    const candidates = waiting.filter(
      (lobby) => !lobby.guestId && lobby.hostId !== args.playerId
    )

    let matchedLobby = null
    for (const candidate of candidates) {
      const hostPresence = await ctx.db
        .query("presence")
        .withIndex("by_player_id", (q) => q.eq("playerId", candidate.hostId))
        .unique()

      const isHostAlive =
        hostPresence && Date.now() - hostPresence.lastHeartbeatAt < 45_000

      if (isHostAlive) {
        matchedLobby = candidate
        break
      }
    }

    if (matchedLobby) {
      await ctx.db.patch(matchedLobby._id, {
        guestId: args.playerId,
        guestToken: args.playerToken,
        guestProgress: buildPlayerProgress(args.playerId, args.username),
      })

      return {
        lobbyId: matchedLobby._id,
        roomCode: matchedLobby.roomCode,
        role: "guest" as const,
      }
    }

    const roomCode = await getUniqueRoomCode(ctx)
    const lobbyId = await ctx.db.insert("lobbies", {
      hostId: args.playerId,
      hostToken: args.playerToken,
      roomCode,
      status: "waiting",
      textToType: args.textToType,
      createdAt: Date.now(),
      countdown: 3,
      timeLeft: 60,
      hostProgress: buildPlayerProgress(args.playerId, args.username),
    })

    return {
      lobbyId,
      roomCode,
      role: "host" as const,
    }
  },
})

export const getLobby = query({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.lobbyId)
  },
})

export const startRace = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    actorId: v.string(),
    actorToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await resolveAndValidatePlayer(ctx, args.actorId, args.actorToken)
    if (!identity.valid) return { ok: false as const }

    const lobby = await ctx.db.get(args.lobbyId)
    if (!lobby || lobby.hostId !== args.actorId) {
      return { ok: false as const }
    }

    const hostProgress = {
      ...lobby.hostProgress,
      progress: 0,
      wpm: 0,
      mistakes: 0,
      finished: false,
    }

    const guestProgress = lobby.guestProgress
      ? {
          ...lobby.guestProgress,
          progress: 0,
          wpm: 0,
          mistakes: 0,
          finished: false,
        }
      : undefined

    await ctx.db.patch(args.lobbyId, {
      status: "countdown",
      countdown: 3,
      timeLeft: 60,
      hostProgress,
      ...(guestProgress ? { guestProgress } : {}),
    })

    return { ok: true as const }
  },
})

export const setCountdown = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    actorId: v.string(),
    actorToken: v.optional(v.string()),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await resolveAndValidatePlayer(ctx, args.actorId, args.actorToken)
    if (!identity.valid) return { ok: false as const }

    const lobby = await ctx.db.get(args.lobbyId)
    if (!lobby || lobby.hostId !== args.actorId) {
      return { ok: false as const }
    }

    const status = args.count <= 0 ? "racing" : "countdown"
    await ctx.db.patch(args.lobbyId, {
      countdown: args.count,
      status,
    })

    return { ok: true as const }
  },
})

export const setTimeLeft = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    actorId: v.string(),
    actorToken: v.optional(v.string()),
    timeLeft: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await resolveAndValidatePlayer(ctx, args.actorId, args.actorToken)
    if (!identity.valid) return { ok: false as const }

    const lobby = await ctx.db.get(args.lobbyId)
    if (!lobby || lobby.hostId !== args.actorId) {
      return { ok: false as const }
    }

    const status = args.timeLeft <= 0 ? "finished" : "racing"

    await ctx.db.patch(args.lobbyId, {
      timeLeft: args.timeLeft,
      status,
    })

    return { ok: true as const }
  },
})

export const updatePlayerProgress = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    playerId: v.string(),
    playerToken: v.optional(v.string()),
    ...playerProgressArgs,
  },
  handler: async (ctx, args) => {
    const identity = await resolveAndValidatePlayer(ctx, args.playerId, args.playerToken)
    if (!identity.valid) return { ok: false as const }

    const lobby = await ctx.db.get(args.lobbyId)
    if (!lobby) {
      return { ok: false as const }
    }

    const nextProgress = {
      progress: Math.max(0, Math.min(100, args.progress)),
      wpm: Math.max(0, args.wpm),
      mistakes: Math.max(0, args.mistakes),
      finished: args.finished,
    }

    if (lobby.hostId === args.playerId) {
      await ctx.db.patch(args.lobbyId, {
        hostProgress: {
          ...lobby.hostProgress,
          ...nextProgress,
        },
        ...(args.finished ? { status: "finished" as const } : {}),
      })
      return { ok: true as const }
    }

    if (lobby.guestId === args.playerId && lobby.guestProgress) {
      await ctx.db.patch(args.lobbyId, {
        guestProgress: {
          ...lobby.guestProgress,
          ...nextProgress,
        },
        ...(args.finished ? { status: "finished" as const } : {}),
      })
      return { ok: true as const }
    }

    return { ok: false as const }
  },
})

export const finishRace = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    actorId: v.string(),
    actorToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await resolveAndValidatePlayer(ctx, args.actorId, args.actorToken)
    if (!identity.valid) return { ok: false as const }

    const lobby = await ctx.db.get(args.lobbyId)
    if (!lobby) {
      return { ok: false as const }
    }

    const isParticipant = lobby.hostId === args.actorId || lobby.guestId === args.actorId
    if (!isParticipant) {
      return { ok: false as const }
    }

    await ctx.db.patch(args.lobbyId, {
      status: "finished",
    })

    return { ok: true as const }
  },
})

export const setLobbyStatus = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    actorId: v.string(),
    actorToken: v.optional(v.string()),
    status: raceStatus,
  },
  handler: async (ctx, args) => {
    const identity = await resolveAndValidatePlayer(ctx, args.actorId, args.actorToken)
    if (!identity.valid) return { ok: false as const }

    const lobby = await ctx.db.get(args.lobbyId)
    if (!lobby || lobby.hostId !== args.actorId) {
      return { ok: false as const }
    }

    await ctx.db.patch(args.lobbyId, {
      status: args.status,
    })

    return { ok: true as const }
  },
})

export const cleanupStaleLobbies = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const TEN_MINUTES = 10 * 60 * 1000
    const FIVE_MINUTES = 5 * 60 * 1000
    const ONE_HOUR = 60 * 60 * 1000

    const waitingLobbies = await ctx.db
      .query("lobbies")
      .withIndex("by_status_created_at", (q) => q.eq("status", "waiting"))
      .collect()

    for (const lobby of waitingLobbies) {
      if (now - lobby.createdAt < TEN_MINUTES) continue

      const hostPresence = await ctx.db
        .query("presence")
        .withIndex("by_player_id", (q) => q.eq("playerId", lobby.hostId))
        .unique()

      if (!hostPresence) {
        await ctx.db.delete(lobby._id)
      }
    }

    const countdownLobbies = await ctx.db
      .query("lobbies")
      .withIndex("by_status_created_at", (q) => q.eq("status", "countdown"))
      .collect()

    for (const lobby of countdownLobbies) {
      if (now - lobby.createdAt < FIVE_MINUTES) continue
      await ctx.db.patch(lobby._id, { status: "finished" })
    }

    const finishedLobbies = await ctx.db
      .query("lobbies")
      .withIndex("by_status_created_at", (q) => q.eq("status", "finished"))
      .collect()

    for (const lobby of finishedLobbies) {
      if (now - lobby.createdAt < ONE_HOUR) continue
      await ctx.db.delete(lobby._id)
    }
  },
})
