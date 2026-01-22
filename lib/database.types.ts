export type Database = {
  public: {
    Tables: {
      event_admins: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          created_at: string;
          event_id: string;
          handicap: number;
          id: string;
          name: string;
          starting_score: number;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          handicap?: number;
          id?: string;
          name: string;
          starting_score?: number;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          handicap?: number;
          id?: string;
          name?: string;
          starting_score?: number;
        };
        Relationships: [];
      };
      rounds: {
        Row: {
          course: string | null;
          created_at: string;
          date: string | null;
          entry_pin: string | null;
          event_id: string;
          id: string;
          par: number;
          round_number: number;
        };
        Insert: {
          course?: string | null;
          created_at?: string;
          date?: string | null;
          entry_pin?: string | null;
          event_id: string;
          id?: string;
          par?: number;
          round_number: number;
        };
        Update: {
          course?: string | null;
          created_at?: string;
          date?: string | null;
          entry_pin?: string | null;
          event_id?: string;
          id?: string;
          par?: number;
          round_number?: number;
        };
        Relationships: [];
      };
      scores: {
        Row: {
          hole_number: number;
          id: string;
          player_id: string;
          round_id: string;
          strokes: number;
          updated_at: string;
        };
        Insert: {
          hole_number: number;
          id?: string;
          player_id: string;
          round_id: string;
          strokes: number;
          updated_at?: string;
        };
        Update: {
          hole_number?: number;
          id?: string;
          player_id?: string;
          round_id?: string;
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
