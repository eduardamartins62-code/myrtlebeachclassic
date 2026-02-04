export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      event_admins: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      itinerary_items: {
        Row: {
          id: string;
          category: string;
          title: string;
          description: string | null;
          address: string | null;
          website_url: string | null;
          start_time: string | null;
          end_time: string | null;
          day_label: string | null;
          sort_order: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          title: string;
          description?: string | null;
          address?: string | null;
          website_url?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          day_label?: string | null;
          sort_order?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          title?: string;
          description?: string | null;
          address?: string | null;
          website_url?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          day_label?: string | null;
          sort_order?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      past_events: {
        Row: {
          id: string;
          year: number;
          title: string;
          summary: string;
          winner_name: string | null;
          runner_up_name: string | null;
          total_players: number | null;
          notable_courses: string | null;
          highlight_notes: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          year: number;
          title: string;
          summary: string;
          winner_name?: string | null;
          runner_up_name?: string | null;
          total_players?: number | null;
          notable_courses?: string | null;
          highlight_notes?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          year?: number;
          title?: string;
          summary?: string;
          winner_name?: string | null;
          runner_up_name?: string | null;
          total_players?: number | null;
          notable_courses?: string | null;
          highlight_notes?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          nickname: string | null;
          image_url: string | null;
          handicap: number;
          starting_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          nickname?: string | null;
          image_url?: string | null;
          handicap?: number;
          starting_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          nickname?: string | null;
          image_url?: string | null;
          handicap?: number;
          starting_score?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          event_id: string;
          round_number: number;
          course: string | null;
          date: string | null;
          par: number;
          entry_pin: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          round_number: number;
          course?: string | null;
          date?: string | null;
          par?: number;
          entry_pin?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          round_number?: number;
          course?: string | null;
          date?: string | null;
          par?: number;
          entry_pin?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      round_holes: {
        Row: {
          id: string;
          round_id: string;
          hole_number: number;
          par: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          hole_number: number;
          par: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          hole_number?: number;
          par?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      round_players: {
        Row: {
          id: string;
          round_id: string;
          player_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          player_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          player_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      scores: {
        Row: {
          id: string;
          round_id: string;
          player_id: string;
          hole_number: number;
          strokes: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          player_id: string;
          hole_number: number;
          strokes: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          player_id?: string;
          hole_number?: number;
          strokes?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
