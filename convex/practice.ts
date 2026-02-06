import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"

export const saveSession = mutation({
  args: {
    wpm: v.number(),
    accuracy: v.number(),
    duration: v.number(),
    timeUsed: v.number(),
    totalChars: v.number(),
    totalWords: v.number(),
    mistakes: v.number(),
    difficulty: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    await ctx.db.insert("practiceHistory", {
      userId,
      ...args,
      completedAt: Date.now(),
    })

    const existing = await ctx.db
      .query("stats")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique()

    if (existing) {
      const totalSessions = existing.totalSessions + 1
      const avgWpm = Math.round(
        (existing.avgWpm * existing.totalSessions + args.wpm) / totalSessions
      )
      const bestWpm = Math.max(existing.bestWpm, args.wpm)
      const avgAccuracy = Math.round(
        (existing.accuracy * existing.totalSessions + args.accuracy) / totalSessions
      )

      await ctx.db.patch(existing._id, {
        avgWpm,
        bestWpm,
        totalSessions,
        accuracy: avgAccuracy,
        updatedAt: Date.now(),
      })
    } else {
      await ctx.db.insert("stats", {
        userId,
        avgWpm: args.wpm,
        bestWpm: args.wpm,
        totalSessions: 1,
        totalRaces: 0,
        wins: 0,
        accuracy: args.accuracy,
        updatedAt: Date.now(),
      })
    }

    return { success: true }
  },
})

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    return await ctx.db
      .query("stats")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique()
  },
})

export const getHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const sessions = await ctx.db
      .query("practiceHistory")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50)

    return sessions
  },
})
