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
import type {
  DiscountType,
  ProposalBriefing,
  ProposalDiagnosis,
  ProposalStatus,
} from "@/types/proposal";

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
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  social_links: CommercialSettings["socialLinks"];
  contact_phone: string | null;
  contact_email: string | null;
  updated_at: string;
};

export type SettingsUpdate = Partial<Omit<SettingsRow, "id" | "updated_at">>;

export type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  default_price: number | null;
  unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceInsert = Omit<ServiceRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProposalRow = {
  id: string;
  lead_id: string;
  title: string;
  status: ProposalStatus;
  tone: string | null;
  briefing: ProposalBriefing;
  diagnosis: ProposalDiagnosis;
  scope_notes: string | null;
  next_steps: string[];
  terms: string | null;
  payment_terms: string | null;
  timeline: string | null;
  validity_days: number;
  expires_at: string | null;
  discount_type: DiscountType | null;
  discount_value: number;
  subtotal: number;
  total: number;
  rejection_reason: string | null;
  accepted_at: string | null;
  current_version: number;
  created_at: string;
  updated_at: string;
};

export type ProposalInsert = Omit<
  ProposalRow,
  | "id"
  | "created_at"
  | "updated_at"
  | "scope_notes"
  | "terms"
  | "payment_terms"
  | "timeline"
  | "rejection_reason"
  | "accepted_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  scope_notes?: string | null;
  terms?: string | null;
  payment_terms?: string | null;
  timeline?: string | null;
  rejection_reason?: string | null;
  accepted_at?: string | null;
};

export type ProposalUpdate = Partial<ProposalInsert>;

export type ProposalItemRow = {
  id: string;
  proposal_id: string;
  service_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  position: number;
  created_at: string;
};

export type ProposalItemInsert = Omit<ProposalItemRow, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type ProposalVersionRow = {
  id: string;
  proposal_id: string;
  version_number: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot: any;
  total: number;
  note: string | null;
  created_at: string;
};

export type ProposalVersionInsert = Omit<ProposalVersionRow, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type ProposalEventRow = {
  id: string;
  proposal_id: string;
  event: string;
  actor: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ProposalEventInsert = Omit<ProposalEventRow, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type ProposalTokenRow = {
  id: string;
  proposal_id: string;
  token: string;
  created_at: string;
  revoked_at: string | null;
};

export type ProposalTokenInsert = Omit<ProposalTokenRow, "id" | "created_at" | "revoked_at"> & {
  id?: string;
  created_at?: string;
  revoked_at?: string | null;
};

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
      services: { Row: ServiceRow; Insert: ServiceInsert; Update: Partial<ServiceInsert>; Relationships: [] };
      proposals: { Row: ProposalRow; Insert: ProposalInsert; Update: ProposalUpdate; Relationships: [] };
      proposal_items: {
        Row: ProposalItemRow;
        Insert: ProposalItemInsert;
        Update: Partial<ProposalItemInsert>;
        Relationships: [];
      };
      proposal_versions: {
        Row: ProposalVersionRow;
        Insert: ProposalVersionInsert;
        Update: Partial<ProposalVersionInsert>;
        Relationships: [];
      };
      proposal_events: {
        Row: ProposalEventRow;
        Insert: ProposalEventInsert;
        Update: Partial<ProposalEventInsert>;
        Relationships: [];
      };
      proposal_tokens: {
        Row: ProposalTokenRow;
        Insert: ProposalTokenInsert;
        Update: Partial<ProposalTokenInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Re-exportado para conveniência de quem só precisa do tipo de domínio.
export type { Interaction, Meeting };
