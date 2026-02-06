import { mutation, query } from "./_generated/server"
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
    hostId: v.string(),
    username: v.string(),
    textToType: v.string(),
  },
  handler: async (ctx, args) => {
    await upsertProfile(ctx, args.hostId, args.username)

    const roomCode = await getUniqueRoomCode(ctx)
    const lobbyId = await ctx.db.insert("lobbies", {
      hostId: args.hostId,
      roomCode,
      status: "waiting",
      textToType: args.textToType,
      createdAt: Date.now(),
      countdown: 3,
      timeLeft: 60,
      hostProgress: buildPlayerProgress(args.hostId, args.username),
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
    userId: v.string(),
    username: v.string(),
    roomCode: v.string(),
  },
  handler: async (ctx, args) => {
    await upsertProfile(ctx, args.userId, args.username)

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

    if (lobby.hostId === args.userId) {
      return {
        ok: false as const,
        error: "You cannot join your own room",
      }
    }

    if (lobby.guestId && lobby.guestId !== args.userId) {
      return {
        ok: false as const,
        error: "Room is already full",
      }
    }

    if (!lobby.guestId) {
      await ctx.db.patch(lobby._id, {
        guestId: args.userId,
        guestProgress: buildPlayerProgress(args.userId, args.username),
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
    userId: v.string(),
    username: v.string(),
    textToType: v.string(),
  },
  handler: async (ctx, args) => {
    await upsertProfile(ctx, args.userId, args.username)

    const waiting = await ctx.db
      .query("lobbies")
      .withIndex("by_status_created_at", (q) => q.eq("status", "waiting"))
      .collect()

    const availableLobby = waiting.find(
      (lobby) => !lobby.guestId && lobby.hostId !== args.userId
    )

    if (availableLobby) {
      await ctx.db.patch(availableLobby._id, {
        guestId: args.userId,
        guestProgress: buildPlayerProgress(args.userId, args.username),
      })

      return {
        lobbyId: availableLobby._id,
        roomCode: availableLobby.roomCode,
        role: "guest" as const,
      }
    }

    const roomCode = await getUniqueRoomCode(ctx)
    const lobbyId = await ctx.db.insert("lobbies", {
      hostId: args.userId,
      roomCode,
      status: "waiting",
      textToType: args.textToType,
      createdAt: Date.now(),
      countdown: 3,
      timeLeft: 60,
      hostProgress: buildPlayerProgress(args.userId, args.username),
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
  },
  handler: async (ctx, args) => {
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
    count: v.number(),
  },
  handler: async (ctx, args) => {
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
    timeLeft: v.number(),
  },
  handler: async (ctx, args) => {
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
    ...playerProgressArgs,
  },
  handler: async (ctx, args) => {
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
  },
  handler: async (ctx, args) => {
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
    status: raceStatus,
  },
  handler: async (ctx, args) => {
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
