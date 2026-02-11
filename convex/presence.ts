import { mutation, internalMutation, query } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"
import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"

const DEADMAN_DELAY_MS = 30_000
const STALE_THRESHOLD_MS = 25_000

const presenceStatus = v.union(
  v.literal("online"),
  v.literal("idle"),
  v.literal("in_lobby"),
  v.literal("in_race")
)

async function validatePlayer(
  ctx: MutationCtx,
  playerId: string,
  playerToken?: string
): Promise<boolean> {
  if (playerToken) {
    const anon = await ctx.db
      .query("anonymousPlayers")
      .withIndex("by_secret_token", (q) => q.eq("secretToken", playerToken))
      .unique()

    if (!anon || (anon._id as string) !== playerId || anon.claimedByUserId) {
      return false
    }
    return true
  }

  return true
}

async function findPresenceByPlayer(ctx: MutationCtx, playerId: string) {
  return await ctx.db
    .query("presence")
    .withIndex("by_player_id", (q) => q.eq("playerId", playerId))
    .unique()
}

async function handleLobbyDisconnect(ctx: MutationCtx, playerId: string, lobbyId: Id<"lobbies">) {
  const lobby = await ctx.db.get(lobbyId)
  if (!lobby) return

  const isHost = lobby.hostId === playerId
  const isGuest = lobby.guestId === playerId

  if (!isHost && !isGuest) return

  if (isHost) {
    if (lobby.status === "waiting" || lobby.status === "countdown") {
      if (lobby.guestId) {
        await ctx.db.patch(lobby._id, {
          status: "finished",
          hostDisconnected: true,
        })
      } else {
        await ctx.db.delete(lobby._id)
      }
    } else if (lobby.status === "racing") {
      await ctx.db.patch(lobby._id, {
        status: "finished",
        hostDisconnected: true,
      })
    }
  }

  if (isGuest) {
    if (lobby.status === "waiting") {
      await ctx.db.patch(lobby._id, {
        guestId: undefined,
        guestToken: undefined,
        guestProgress: undefined,
        guestDisconnected: undefined,
      })
    } else if (lobby.status === "racing" || lobby.status === "countdown") {
      await ctx.db.patch(lobby._id, {
        status: "finished",
        guestDisconnected: true,
      })
    }
  }
}

export const registerPresence = mutation({
  args: {
    playerId: v.string(),
    playerToken: v.optional(v.string()),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const valid = await validatePlayer(ctx, args.playerId, args.playerToken)
    if (!valid) return { ok: false as const }

    const existing = await findPresenceByPlayer(ctx, args.playerId)
    const now = Date.now()

    if (existing) {
      if (existing.cleanupJobId) {
        await ctx.scheduler.cancel(existing.cleanupJobId)
      }

      const cleanupJobId = await ctx.scheduler.runAfter(
        DEADMAN_DELAY_MS,
        internal.presence.expirePresence,
        { playerId: args.playerId }
      )

      await ctx.db.patch(existing._id, {
        ...(args.playerToken !== undefined ? { playerToken: args.playerToken } : {}),
        username: args.username,
        status: "online",
        lastHeartbeatAt: now,
        cleanupJobId,
      })

      return { ok: true as const }
    }

    const cleanupJobId = await ctx.scheduler.runAfter(
      DEADMAN_DELAY_MS,
      internal.presence.expirePresence,
      { playerId: args.playerId }
    )

    await ctx.db.insert("presence", {
      playerId: args.playerId,
      playerToken: args.playerToken,
      username: args.username,
      status: "online",
      lastHeartbeatAt: now,
      connectedAt: now,
      cleanupJobId,
    })

    return { ok: true as const }
  },
})

export const keepAlive = mutation({
  args: {
    playerId: v.string(),
    playerToken: v.optional(v.string()),
    status: v.optional(presenceStatus),
    currentLobbyId: v.optional(v.id("lobbies")),
  },
  handler: async (ctx, args) => {
    const valid = await validatePlayer(ctx, args.playerId, args.playerToken)
    if (!valid) return { ok: false as const }

    const record = await findPresenceByPlayer(ctx, args.playerId)
    if (!record) {
      const now = Date.now()
      const cleanupJobId = await ctx.scheduler.runAfter(
        DEADMAN_DELAY_MS,
        internal.presence.expirePresence,
        { playerId: args.playerId }
      )

      await ctx.db.insert("presence", {
        playerId: args.playerId,
        playerToken: args.playerToken,
        username: "",
        status: args.status ?? "online",
        currentLobbyId: args.currentLobbyId,
        lastHeartbeatAt: now,
        connectedAt: now,
        cleanupJobId,
      })

      return { ok: true as const }
    }

    if (record.cleanupJobId) {
      await ctx.scheduler.cancel(record.cleanupJobId)
    }

    const cleanupJobId = await ctx.scheduler.runAfter(
      DEADMAN_DELAY_MS,
      internal.presence.expirePresence,
      { playerId: args.playerId }
    )

    await ctx.db.patch(record._id, {
      ...(args.playerToken !== undefined ? { playerToken: args.playerToken } : {}),
      lastHeartbeatAt: Date.now(),
      cleanupJobId,
      ...(args.status ? { status: args.status } : {}),
      ...(args.currentLobbyId !== undefined ? { currentLobbyId: args.currentLobbyId } : {}),
    })

    return { ok: true as const }
  },
})

export const expirePresence = internalMutation({
  args: { playerId: v.string() },
  handler: async (ctx, args) => {
    const record = await findPresenceByPlayer(ctx, args.playerId)
    if (!record) return

    if (Date.now() - record.lastHeartbeatAt < STALE_THRESHOLD_MS) return

    if (record.currentLobbyId) {
      await handleLobbyDisconnect(ctx, args.playerId, record.currentLobbyId)
    }

    await ctx.db.delete(record._id)
  },
})

export const removePresence = mutation({
  args: {
    playerId: v.string(),
    playerToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const valid = await validatePlayer(ctx, args.playerId, args.playerToken)
    if (!valid) return

    const record = await findPresenceByPlayer(ctx, args.playerId)
    if (!record) return

    if (record.cleanupJobId) {
      await ctx.scheduler.cancel(record.cleanupJobId)
    }

    if (record.currentLobbyId) {
      await handleLobbyDisconnect(ctx, args.playerId, record.currentLobbyId)
    }

    await ctx.db.delete(record._id)
  },
})

export const getPresence = query({
  args: { playerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("presence")
      .withIndex("by_player_id", (q) => q.eq("playerId", args.playerId))
      .unique()
  },
})

export const getPresenceForLobby = query({
  args: { lobbyId: v.id("lobbies") },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId)
    if (!lobby) return { hostPresent: false, guestPresent: false }

    const hostPresence = await ctx.db
      .query("presence")
      .withIndex("by_player_id", (q) => q.eq("playerId", lobby.hostId))
      .unique()

    const guestPresence = lobby.guestId
      ? await ctx.db
          .query("presence")
          .withIndex("by_player_id", (q) => q.eq("playerId", lobby.guestId!))
          .unique()
      : null

    const now = Date.now()
    const ALIVE_THRESHOLD = 45_000

    return {
      hostPresent: !!hostPresence && now - hostPresence.lastHeartbeatAt < ALIVE_THRESHOLD,
      guestPresent: !!guestPresence && now - guestPresence.lastHeartbeatAt < ALIVE_THRESHOLD,
    }
  },
})
