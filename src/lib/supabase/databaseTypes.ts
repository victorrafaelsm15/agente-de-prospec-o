import type { Lead } from "@/types/lead";

/**
 * Tipagem mínima do schema do Supabase (tabela "leads"), usada apenas para
 * que o client tipado do @supabase/supabase-js infira corretamente os tipos
 * de insert/update. Deve refletir database/schema.sql.
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

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: LeadRow;
        Insert: LeadInsert;
        Update: LeadUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
