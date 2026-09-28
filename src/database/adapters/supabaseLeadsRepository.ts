import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import type {
  DuplicateMatch,
  LeadsRepository,
  NewLead,
} from "@/database/leadsRepository";
import type { Lead, LeadFilters, LeadListResult, LeadStatus } from "@/types/lead";
import type { LeadInsert, LeadRow } from "@/lib/supabase/databaseTypes";

function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    city: row.city,
    state: row.state,
    website: row.website,
    instagram: row.instagram,
    phone: row.phone,
    address: row.address,
    description: row.description,
    websiteStatus: row.website_status,
    websiteAnalysis: row.website_analysis,
    opportunities: row.opportunities ?? [],
    score: row.score,
    priority: row.priority,
    aiAnalysis: row.ai_analysis,
    outreachMessage: row.outreach_message,
    aiGenerated: row.ai_generated,
    status: row.status,
    source: row.source,
    evidence: row.evidence ?? [],
    researchQuery: row.research_query,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function leadToRow(lead: NewLead): LeadInsert {
  return {
    name: lead.name,
    category: lead.category,
    city: lead.city,
    state: lead.state,
    website: lead.website,
    instagram: lead.instagram,
    phone: lead.phone,
    address: lead.address,
    description: lead.description,
    website_status: lead.websiteStatus,
    website_analysis: lead.websiteAnalysis,
    opportunities: lead.opportunities,
    score: lead.score,
    priority: lead.priority,
    ai_analysis: lead.aiAnalysis,
    outreach_message: lead.outreachMessage,
    ai_generated: lead.aiGenerated,
    status: lead.status,
    source: lead.source,
    evidence: lead.evidence,
    research_query: lead.researchQuery,
  };
}

export class SupabaseLeadsRepository implements LeadsRepository {
  private client() {
    return getSupabaseAdminClient();
  }

  async list(filters: LeadFilters): Promise<LeadListResult> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client()
      .from("leads")
      .select("*", { count: "exact" });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.priority) query = query.eq("priority", filters.priority);
    if (filters.category) query = query.ilike("category", `%${filters.category}%`);
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
      );
    }

    const sortBy =
      filters.sortBy === "createdAt"
        ? "created_at"
        : filters.sortBy === "name"
          ? "name"
          : "score";
    query = query.order(sortBy, { ascending: filters.sortDir === "asc" });
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(`Erro ao listar leads: ${error.message}`);

    return {
      leads: (data as LeadRow[]).map(rowToLead),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  async getById(id: string): Promise<Lead | null> {
    const { data, error } = await this.client()
      .from("leads")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Erro ao buscar lead: ${error.message}`);
    return data ? rowToLead(data as LeadRow) : null;
  }

  async create(lead: NewLead): Promise<Lead> {
    const { data, error } = await this.client()
      .from("leads")
      .insert(leadToRow(lead))
      .select("*")
      .single();
    if (error) throw new Error(`Erro ao salvar lead: ${error.message}`);
    return rowToLead(data as LeadRow);
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Lead | null> {
    const { data, error } = await this.client()
      .from("leads")
      .update({ status })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Erro ao atualizar status: ${error.message}`);
    return data ? rowToLead(data as LeadRow) : null;
  }

  async updateOutreachMessage(id: string, message: string): Promise<Lead | null> {
    const { data, error } = await this.client()
      .from("leads")
      .update({ outreach_message: message })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Erro ao atualizar mensagem: ${error.message}`);
    return data ? rowToLead(data as LeadRow) : null;
  }

  async findDuplicate(candidate: {
    name: string;
    city: string;
    website: string | null;
    phone: string | null;
  }): Promise<DuplicateMatch | null> {
    if (candidate.website) {
      const { data } = await this.client()
        .from("leads")
        .select("*")
        .ilike("website", candidate.website)
        .maybeSingle();
      if (data) return { lead: rowToLead(data as LeadRow), matchedBy: "website" };
    }

    const { data: nameCityMatch } = await this.client()
      .from("leads")
      .select("*")
      .ilike("name", candidate.name)
      .ilike("city", candidate.city)
      .maybeSingle();
    if (nameCityMatch) {
      return { lead: rowToLead(nameCityMatch as LeadRow), matchedBy: "name_city" };
    }

    return null;
  }

  async getStats() {
    const client = this.client();
    const [{ count: total }, { count: novos }, { count: altaPrioridade }, { count: contatados }, { count: clientes }] =
      await Promise.all([
        client.from("leads").select("*", { count: "exact", head: true }),
        client.from("leads").select("*", { count: "exact", head: true }).eq("status", "NOVO"),
        client.from("leads").select("*", { count: "exact", head: true }).eq("priority", "ALTA"),
        client
          .from("leads")
          .select("*", { count: "exact", head: true })
          .in("status", ["CONTATADO", "RESPONDEU", "REUNIAO", "PROPOSTA"]),
        client.from("leads").select("*", { count: "exact", head: true }).eq("status", "CLIENTE"),
      ]);

    return {
      total: total ?? 0,
      novos: novos ?? 0,
      altaPrioridade: altaPrioridade ?? 0,
      contatados: contatados ?? 0,
      clientes: clientes ?? 0,
    };
  }

  async getRecent(limit: number): Promise<Lead[]> {
    const { data, error } = await this.client()
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Erro ao buscar atividade recente: ${error.message}`);
    return (data as LeadRow[]).map(rowToLead);
  }
}
