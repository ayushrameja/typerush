import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.interval(
  "cleanup stale lobbies",
  { minutes: 5 },
  internal.lobbies.cleanupStaleLobbies
)

crons.interval(
  "cleanup anonymous players",
  { hours: 24 },
  internal.anonymous.cleanupExpiredAnonymousPlayers
)

export default crons
