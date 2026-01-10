export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      stats: {
        Row: {
          id: string
          user_id: string
          avg_wpm: number
          best_wpm: number
          total_races: number
          wins: number
          accuracy: number
        }
        Insert: {
          id?: string
          user_id: string
          avg_wpm?: number
          best_wpm?: number
          total_races?: number
          wins?: number
          accuracy?: number
        }
        Update: {
          id?: string
          user_id?: string
          avg_wpm?: number
          best_wpm?: number
          total_races?: number
          wins?: number
          accuracy?: number
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          player1_id: string
          player2_id: string
          winner_id: string | null
          player1_wpm: number
          player2_wpm: number
          created_at: string
        }
        Insert: {
          id?: string
          player1_id: string
          player2_id: string
          winner_id?: string | null
          player1_wpm: number
          player2_wpm: number
          created_at?: string
        }
        Update: {
          id?: string
          player1_id?: string
          player2_id?: string
          winner_id?: string | null
          player1_wpm?: number
          player2_wpm?: number
          created_at?: string
        }
        Relationships: []
      }
      lobbies: {
        Row: {
          id: string
          host_id: string
          room_code: string
          status: "waiting" | "playing" | "finished"
          guest_id: string | null
          text_to_type: string
          created_at: string
        }
        Insert: {
          id?: string
          host_id: string
          room_code: string
          status?: "waiting" | "playing" | "finished"
          guest_id?: string | null
          text_to_type: string
          created_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          room_code?: string
          status?: "waiting" | "playing" | "finished"
          guest_id?: string | null
          text_to_type?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Stats = Database["public"]["Tables"]["stats"]["Row"]
export type Match = Database["public"]["Tables"]["matches"]["Row"]
export type Lobby = Database["public"]["Tables"]["lobbies"]["Row"]
