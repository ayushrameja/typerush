import { mutation, query } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"
import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"

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

    return { valid: true, username: `${anon.username}#${anon.discriminator}` }
  }

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user_id", (q) => q.eq("userId", playerId))
    .unique()

  return { valid: true, username: profile?.username || "Player" }
}

export const saveRaceResult = mutation({
  args: {
    lobbyId: v.id("lobbies"),
    playerId: v.string(),
    playerToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await resolveAndValidatePlayer(ctx, args.playerId, args.playerToken)
    if (!identity.valid) return { ok: false as const }

    const existing = await ctx.db
      .query("raceHistory")
      .withIndex("by_lobby_id", (q) => q.eq("lobbyId", args.lobbyId))
      .collect()

    const alreadySaved = existing.some((r) => r.playerId === args.playerId)
    if (alreadySaved) return { ok: true as const, duplicate: true }

    const lobby = await ctx.db.get(args.lobbyId)
    if (!lobby) return { ok: false as const }

    const isHost = lobby.hostId === args.playerId
    const myProgress = isHost ? lobby.hostProgress : lobby.guestProgress
    const opponentProgress = isHost ? lobby.guestProgress : lobby.hostProgress

    if (!myProgress) return { ok: false as const }

    const opponentId = isHost ? (lobby.guestId || "") : lobby.hostId
    const opponentUsername = opponentProgress?.username || "Unknown"

    const myWpm = myProgress.wpm
    const myMistakes = myProgress.mistakes
    const myProgressPct = myProgress.progress
    const textLength = lobby.textToType.length

    const charsTyped = Math.round((myProgressPct / 100) * textLength)
    const accuracy = charsTyped > 0
      ? Math.round(Math.max(0, (1 - myMistakes / (charsTyped + myMistakes)) * 100) * 100) / 100
      : 0

    const opponentDisconnected = isHost
      ? !!lobby.guestDisconnected
      : !!lobby.hostDisconnected

    let won = false
    if (opponentDisconnected) {
      won = true
    } else if (myProgress.finished && !opponentProgress?.finished) {
      won = true
    } else if (myProgress.finished && opponentProgress?.finished) {
      won = myWpm > (opponentProgress?.wpm ?? 0)
    } else {
      won = myProgressPct > (opponentProgress?.progress ?? 0)
    }

    await ctx.db.insert("raceHistory", {
      playerId: args.playerId,
      playerUsername: identity.username,
      opponentId,
      opponentUsername,
      lobbyId: args.lobbyId,
      wpm: myWpm,
      accuracy,
      mistakes: myMistakes,
      progress: myProgressPct,
      won,
      opponentDisconnected,
      completedAt: Date.now(),
    })

    if (!args.playerToken) {
      const statsRecord = await ctx.db
        .query("stats")
        .withIndex("by_user_id", (q) => q.eq("userId", args.playerId as Id<"users">))
        .unique()

      if (statsRecord) {
        const newTotalRaces = statsRecord.totalRaces + 1
        const newAvgWpm = Math.round(
          ((statsRecord.avgWpm * statsRecord.totalRaces) + myWpm) / newTotalRaces
        )
        const newBestWpm = Math.max(statsRecord.bestWpm, myWpm)
        const newWins = won ? statsRecord.wins + 1 : statsRecord.wins
        const newAccuracy = Math.round(
          ((statsRecord.accuracy * statsRecord.totalRaces) + accuracy) / newTotalRaces * 100
        ) / 100

        await ctx.db.patch(statsRecord._id, {
          totalRaces: newTotalRaces,
          avgWpm: newAvgWpm,
          bestWpm: newBestWpm,
          wins: newWins,
          accuracy: newAccuracy,
          updatedAt: Date.now(),
        })
      } else {
        await ctx.db.insert("stats", {
          userId: args.playerId as Id<"users">,
          totalRaces: 1,
          avgWpm: myWpm,
          bestWpm: myWpm,
          wins: won ? 1 : 0,
          accuracy,
          totalSessions: 0,
          updatedAt: Date.now(),
        })
      }
    }

    return { ok: true as const }
  },
})

export const getPlayerHistory = query({
  args: {
    playerId: v.string(),
    playerToken: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.playerToken) {
      const anon = await ctx.db
        .query("anonymousPlayers")
        .withIndex("by_secret_token", (q) => q.eq("secretToken", args.playerToken!))
        .unique()

      if (!anon || (anon._id as string) !== args.playerId || anon.claimedByUserId) {
        return []
      }
    }

    const limit = args.limit ?? 50

    return await ctx.db
      .query("raceHistory")
      .withIndex("by_player_completed", (q) => q.eq("playerId", args.playerId))
      .order("desc")
      .take(limit)
  },
})

export const getRecentOpponents = query({
  args: {
    playerId: v.string(),
    playerToken: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.playerToken) {
      const anon = await ctx.db
        .query("anonymousPlayers")
        .withIndex("by_secret_token", (q) => q.eq("secretToken", args.playerToken!))
        .unique()

      if (!anon || (anon._id as string) !== args.playerId || anon.claimedByUserId) {
        return []
      }
    }

    const limit = args.limit ?? 20

    const history = await ctx.db
      .query("raceHistory")
      .withIndex("by_player_completed", (q) => q.eq("playerId", args.playerId))
      .order("desc")
      .take(200)

    const opponentMap = new Map<string, {
      opponentId: string
      opponentUsername: string
      lastPlayedAt: number
      totalGames: number
      wins: number
      losses: number
      lastResult: "win" | "loss"
    }>()

    for (const race of history) {
      const existing = opponentMap.get(race.opponentId)

      if (existing) {
        existing.totalGames += 1
        if (race.won) existing.wins += 1
        else existing.losses += 1
        if (race.completedAt > existing.lastPlayedAt) {
          existing.lastPlayedAt = race.completedAt
          existing.lastResult = race.won ? "win" : "loss"
          existing.opponentUsername = race.opponentUsername
        }
      } else {
        opponentMap.set(race.opponentId, {
          opponentId: race.opponentId,
          opponentUsername: race.opponentUsername,
          lastPlayedAt: race.completedAt,
          totalGames: 1,
          wins: race.won ? 1 : 0,
          losses: race.won ? 0 : 1,
          lastResult: race.won ? "win" : "loss",
        })
      }
    }

    return Array.from(opponentMap.values())
      .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
      .slice(0, limit)
  },
})
