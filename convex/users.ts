import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"
import type { Id } from "./_generated/dataModel"

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return null
    }
    return await ctx.db.get(userId)
  },
})

export const mergeAnonymousData = mutation({
  args: {
    anonymousPlayerId: v.string(),
    anonymousToken: v.string(),
    raceResults: v.array(
      v.object({
        opponentUsername: v.string(),
        opponentId: v.string(),
        wpm: v.number(),
        accuracy: v.number(),
        won: v.boolean(),
        completedAt: v.number(),
        lobbyId: v.string(),
      })
    ),
    practiceResults: v.array(
      v.object({
        wpm: v.number(),
        accuracy: v.number(),
        duration: v.number(),
        difficulty: v.string(),
        completedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false as const, error: "Not authenticated" }

    const anon = await ctx.db
      .query("anonymousPlayers")
      .withIndex("by_secret_token", (q) => q.eq("secretToken", args.anonymousToken))
      .unique()

    if (!anon || (anon._id as string) !== args.anonymousPlayerId) {
      return { ok: false as const, error: "Invalid anonymous identity" }
    }

    let totalMergedRaceWpm = 0
    let totalMergedRaceAccuracy = 0
    let mergedRaceWins = 0
    let mergedBestWpm = 0

    for (const race of args.raceResults) {
      await ctx.db.insert("raceHistory", {
        playerId: userId as string,
        playerUsername: "Merged",
        opponentId: race.opponentId,
        opponentUsername: race.opponentUsername,
        lobbyId: race.lobbyId as Id<"lobbies">,
        wpm: race.wpm,
        accuracy: race.accuracy,
        mistakes: 0,
        progress: 100,
        won: race.won,
        opponentDisconnected: false,
        completedAt: race.completedAt,
      })

      totalMergedRaceWpm += race.wpm
      totalMergedRaceAccuracy += race.accuracy
      if (race.won) mergedRaceWins += 1
      mergedBestWpm = Math.max(mergedBestWpm, race.wpm)
    }

    let totalMergedPracticeWpm = 0
    let totalMergedPracticeAccuracy = 0
    let practiceBestWpm = 0

    for (const practice of args.practiceResults) {
      await ctx.db.insert("practiceHistory", {
        userId,
        wpm: practice.wpm,
        accuracy: practice.accuracy,
        duration: practice.duration,
        timeUsed: practice.duration,
        totalChars: 0,
        totalWords: 0,
        mistakes: 0,
        difficulty: practice.difficulty,
        completedAt: practice.completedAt,
      })

      totalMergedPracticeWpm += practice.wpm
      totalMergedPracticeAccuracy += practice.accuracy
      practiceBestWpm = Math.max(practiceBestWpm, practice.wpm)
    }

    const existingStats = await ctx.db
      .query("stats")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique()

    const raceCount = args.raceResults.length
    const practiceCount = args.practiceResults.length
    const mergedOverallBest = Math.max(mergedBestWpm, practiceBestWpm)

    if (existingStats) {
      const oldTotalEntries = existingStats.totalRaces + existingStats.totalSessions
      const newTotalEntries = oldTotalEntries + raceCount + practiceCount
      const mergedTotalWpm = totalMergedRaceWpm + totalMergedPracticeWpm
      const mergedTotalAccuracy = totalMergedRaceAccuracy + totalMergedPracticeAccuracy
      const mergedEntries = raceCount + practiceCount

      const newAvgWpm = newTotalEntries > 0
        ? Math.round(((existingStats.avgWpm * oldTotalEntries) + mergedTotalWpm) / newTotalEntries)
        : existingStats.avgWpm

      const newAccuracy = newTotalEntries > 0
        ? Math.round(((existingStats.accuracy * oldTotalEntries) + mergedTotalAccuracy) / newTotalEntries * 100) / 100
        : existingStats.accuracy

      await ctx.db.patch(existingStats._id, {
        totalRaces: existingStats.totalRaces + raceCount,
        totalSessions: existingStats.totalSessions + practiceCount,
        wins: existingStats.wins + mergedRaceWins,
        avgWpm: newAvgWpm,
        bestWpm: Math.max(existingStats.bestWpm, mergedOverallBest),
        accuracy: newAccuracy,
        updatedAt: Date.now(),
      })
    } else if (raceCount + practiceCount > 0) {
      const totalEntries = raceCount + practiceCount
      const totalWpm = totalMergedRaceWpm + totalMergedPracticeWpm
      const totalAccuracy = totalMergedRaceAccuracy + totalMergedPracticeAccuracy

      await ctx.db.insert("stats", {
        userId,
        totalRaces: raceCount,
        totalSessions: practiceCount,
        wins: mergedRaceWins,
        avgWpm: totalEntries > 0 ? Math.round(totalWpm / totalEntries) : 0,
        bestWpm: mergedOverallBest,
        accuracy: totalEntries > 0 ? Math.round((totalAccuracy / totalEntries) * 100) / 100 : 0,
        updatedAt: Date.now(),
      })
    }

    await ctx.db.patch(anon._id, { claimedByUserId: userId })

    return { ok: true as const }
  },
})
