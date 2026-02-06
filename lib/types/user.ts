export interface AppUser {
  id: string
  isAnonymous: boolean
  name: string
  email: string | null
  avatarUrl: string | null
}

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface Stats {
  id?: string
  user_id: string
  avg_wpm: number
  best_wpm: number
  total_races: number
  wins: number
  accuracy: number
}
