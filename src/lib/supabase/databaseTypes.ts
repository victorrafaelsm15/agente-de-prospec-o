import type {
  Channel,
  CommercialSettings,
  FollowUpStatus,
  Interaction,
  InteractionDirection,
  InteractionStatus,
  Lead,
  Meeting,
  MeetingStatus,
} from "@/types/lead";

/**
 * Tipagem mínima do schema do Supabase, usada apenas para que o client
 * tipado do @supabase/supabase-js infira corretamente os tipos de
 * insert/update. Deve refletir database/schema.sql.
 */
export type LeadRow = {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
  website_status: Lead["websiteStatus"];
  website_analysis: Lead["websiteAnalysis"];
  opportunities: Lead["opportunities"];
  score: number;
  priority: Lead["priority"];
  ai_analysis: string | null;
  outreach_message: string | null;
  ai_generated: boolean;
  status: Lead["status"];
  status_history: Lead["statusHistory"];
  notes: Lead["notes"];
  next_action: string | null;
  next_action_date: string | null;
  briefing: string | null;
  source: string;
  evidence: Lead["evidence"];
  research_query: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadInsert = Omit<LeadRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type LeadUpdate = Partial<LeadInsert>;

export type InteractionRow = {
  id: string;
  lead_id: string;
  channel: Channel;
  direction: InteractionDirection;
  message: string | null;
  status: InteractionStatus;
  occurred_at: string;
  created_at: string;
};

export type InteractionInsert = Omit<InteractionRow, "id" | "created_at" | "occurred_at"> & {
  id?: string;
  created_at?: string;
  occurred_at?: string;
};

export type MeetingRow = {
  id: string;
  lead_id: string;
  scheduled_at: string;
  notes: string | null;
  status: MeetingStatus;
  created_at: string;
};

export type MeetingInsert = Omit<MeetingRow, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type FollowUpRow = {
  id: string;
  lead_id: string;
  due_date: string;
  reason: string | null;
  status: FollowUpStatus;
  created_at: string;
};

export type FollowUpInsert = Omit<FollowUpRow, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type ActivityLogRow = {
  id: string;
  lead_id: string | null;
  actor: string;
  action: string;
  description: string;
  created_at: string;
};

export type ActivityLogInsert = Omit<ActivityLogRow, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type SettingsRow = {
  id: string;
  business_name: string | null;
  services: string | null;
  differentiator: string | null;
  target_audience: string | null;
  tone: CommercialSettings["tone"];
  email_signature: string | null;
  updated_at: string;
};

export type SettingsUpdate = Partial<Omit<SettingsRow, "id" | "updated_at">>;

export type Database = {
  public: {
    Tables: {
      leads: { Row: LeadRow; Insert: LeadInsert; Update: LeadUpdate; Relationships: [] };
      interactions: {
        Row: InteractionRow;
        Insert: InteractionInsert;
        Update: Partial<InteractionInsert>;
        Relationships: [];
      };
      meetings: {
        Row: MeetingRow;
        Insert: MeetingInsert;
        Update: Partial<MeetingInsert>;
        Relationships: [];
      };
      follow_ups: {
        Row: FollowUpRow;
        Insert: FollowUpInsert;
        Update: Partial<FollowUpInsert>;
        Relationships: [];
      };
      activity_log: {
        Row: ActivityLogRow;
        Insert: ActivityLogInsert;
        Update: Partial<ActivityLogInsert>;
        Relationships: [];
      };
      settings: { Row: SettingsRow; Insert: SettingsRow; Update: SettingsUpdate; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Re-exportado para conveniência de quem só precisa do tipo de domínio.
export type { Interaction, Meeting };
