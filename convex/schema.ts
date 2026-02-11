import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"

const raceStatus = v.union(
  v.literal("waiting"),
  v.literal("countdown"),
  v.literal("racing"),
  v.literal("finished")
)

const playerProgress = v.object({
  userId: v.string(),
  username: v.string(),
  progress: v.number(),
  wpm: v.number(),
  mistakes: v.number(),
  finished: v.boolean(),
})

export default defineSchema({
  ...authTables,

  anonymousPlayers: defineTable({
    secretToken: v.string(),
    username: v.string(),
    discriminator: v.string(),
    avatarSeed: v.string(),
    createdAt: v.number(),
    lastSeenAt: v.number(),
    actionCount: v.number(),
    actionWindowStart: v.number(),
    claimedByUserId: v.optional(v.id("users")),
  })
    .index("by_secret_token", ["secretToken"])
    .index("by_last_seen", ["lastSeenAt"]),

  profiles: defineTable({
    userId: v.string(),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user_id", ["userId"]),

  stats: defineTable({
    userId: v.id("users"),
    avgWpm: v.number(),
    bestWpm: v.number(),
    totalSessions: v.number(),
    totalRaces: v.number(),
    wins: v.number(),
    accuracy: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  practiceHistory: defineTable({
    userId: v.id("users"),
    wpm: v.number(),
    accuracy: v.number(),
    duration: v.number(),
    timeUsed: v.number(),
    totalChars: v.number(),
    totalWords: v.number(),
    mistakes: v.number(),
    difficulty: v.string(),
    completedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  lobbies: defineTable({
    hostId: v.string(),
    hostToken: v.optional(v.string()),
    roomCode: v.string(),
    status: raceStatus,
    guestId: v.optional(v.string()),
    guestToken: v.optional(v.string()),
    textToType: v.string(),
    createdAt: v.number(),
    countdown: v.number(),
    timeLeft: v.number(),
    hostProgress: playerProgress,
    guestProgress: v.optional(playerProgress),
    hostDisconnected: v.optional(v.boolean()),
    guestDisconnected: v.optional(v.boolean()),
  })
    .index("by_room_code", ["roomCode"])
    .index("by_status_created_at", ["status", "createdAt"]),

  presence: defineTable({
    playerId: v.string(),
    username: v.string(),
    status: v.union(
      v.literal("online"),
      v.literal("idle"),
      v.literal("in_lobby"),
      v.literal("in_race")
    ),
    currentLobbyId: v.optional(v.id("lobbies")),
    lastHeartbeatAt: v.number(),
    connectedAt: v.number(),
    cleanupJobId: v.optional(v.id("_scheduled_functions")),
  })
    .index("by_player_id", ["playerId"])
    .index("by_status", ["status"])
    .index("by_last_heartbeat", ["lastHeartbeatAt"]),
})
