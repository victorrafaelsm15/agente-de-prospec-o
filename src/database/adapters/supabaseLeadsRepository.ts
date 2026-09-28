import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import type {
  DuplicateMatch,
  LeadsRepository,
  NewLead,
} from "@/database/leadsRepository";
import type {
  DashboardStats,
  Lead,
  LeadFilters,
  LeadListResult,
  LeadStatus,
  RecentResearchItem,
  ScoreDistributionItem,
  StatusDistributionItem,
} from "@/types/lead";
import type { LeadInsert, LeadRow } from "@/lib/supabase/databaseTypes";
import { LEAD_STATUSES } from "@/types/lead";

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
    whatsapp: row.whatsapp,
    email: row.email,
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
    statusHistory: row.status_history ?? [],
    notes: row.notes ?? [],
    nextAction: row.next_action,
    nextActionDate: row.next_action_date,
    source: row.source,
    evidence: row.evidence ?? [],
    researchQuery: row.research_query,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function leadToRow(lead: NewLead): LeadInsert {
  const now = new Date().toISOString();
  return {
    name: lead.name,
    category: lead.category,
    city: lead.city,
    state: lead.state,
    website: lead.website,
    instagram: lead.instagram,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    email: lead.email,
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
    status_history: lead.statusHistory ?? [{ status: lead.status, changedAt: now }],
    notes: lead.notes ?? [],
    next_action: lead.nextAction,
    next_action_date: lead.nextActionDate,
    source: lead.source,
    evidence: lead.evidence,
    research_query: lead.researchQuery,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, filters: LeadFilters): any {
  let q = query;
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.priority) q = q.eq("priority", filters.priority);
  if (filters.category) q = q.ilike("category", `%${filters.category}%`);
  if (filters.search) {
    q = q.or(
      `name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
    );
  }
  if (filters.hasWebsite === true) q = q.not("website", "is", null);
  if (filters.hasWebsite === false) q = q.is("website", null);
  if (filters.hasInstagram === true) q = q.not("instagram", "is", null);
  if (filters.hasInstagram === false) q = q.is("instagram", null);
  if (filters.hasPhone === true) q = q.not("phone", "is", null);
  if (filters.hasPhone === false) q = q.is("phone", null);
  if (filters.hasWhatsapp === true) q = q.not("whatsapp", "is", null);
  if (filters.hasWhatsapp === false) q = q.is("whatsapp", null);
  if (filters.dateFrom) q = q.gte("created_at", filters.dateFrom);
  if (filters.dateTo) q = q.lte("created_at", filters.dateTo);
  return q;
}

export class SupabaseLeadsRepository implements LeadsRepository {
  private client() {
    return getSupabaseAdminClient();
  }

  private filterOutdatedWebsite(leads: Lead[], outdatedWebsite?: boolean): Lead[] {
    if (outdatedWebsite === undefined) return leads;
    return leads.filter((l) => {
      const isOutdated =
        Boolean(l.website) &&
        (l.websiteAnalysis.hasCallToAction === false ||
          l.websiteAnalysis.hasViewportMeta === false ||
          l.websiteStatus === "INACESSIVEL");
      return outdatedWebsite ? isOutdated : !isOutdated;
    });
  }

  async list(filters: LeadFilters): Promise<LeadListResult> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = applyFilters(
      this.client().from("leads").select("*", { count: "exact" }),
      filters
    );

    const sortBy =
      filters.sortBy === "createdAt"
        ? "created_at"
        : filters.sortBy === "name"
          ? "name"
          : "score";
    query = query.order(sortBy, { ascending: filters.sortDir === "asc" });

    // Quando há filtro client-side (site desatualizado), busca sem paginação
    // do banco e pagina depois de filtrar em memória.
    const needsClientFilter = filters.outdatedWebsite !== undefined;
    if (!needsClientFilter) query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(`Erro ao listar leads: ${error.message}`);

    let leads = (data as LeadRow[]).map(rowToLead);
    let total = count ?? 0;

    if (needsClientFilter) {
      leads = this.filterOutdatedWebsite(leads, filters.outdatedWebsite);
      total = leads.length;
      leads = leads.slice(from, to + 1);
    }

    return { leads, total, page, pageSize };
  }

  async listAll(filters: LeadFilters): Promise<Lead[]> {
    const sortBy =
      filters.sortBy === "createdAt"
        ? "created_at"
        : filters.sortBy === "name"
          ? "name"
          : "score";

    let query = applyFilters(this.client().from("leads").select("*"), filters);
    query = query.order(sortBy, { ascending: filters.sortDir === "asc" });

    const { data, error } = await query;
    if (error) throw new Error(`Erro ao listar leads: ${error.message}`);

    let leads = (data as LeadRow[]).map(rowToLead);
    leads = this.filterOutdatedWebsite(leads, filters.outdatedWebsite);
    return leads;
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
    const current = await this.getById(id);
    if (!current) return null;

    const statusHistory = [
      ...current.statusHistory,
      { status, changedAt: new Date().toISOString() },
    ];

    const { data, error } = await this.client()
      .from("leads")
      .update({ status, status_history: statusHistory })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Erro ao atualizar status: ${error.message}`);
    return data ? rowToLead(data as LeadRow) : null;
  }

  async bulkUpdateStatus(ids: string[], status: LeadStatus): Promise<number> {
    const results = await Promise.all(ids.map((id) => this.updateStatus(id, status)));
    return results.filter(Boolean).length;
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

  async updateNextAction(
    id: string,
    nextAction: string | null,
    nextActionDate: string | null
  ): Promise<Lead | null> {
    const { data, error } = await this.client()
      .from("leads")
      .update({ next_action: nextAction, next_action_date: nextActionDate })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Erro ao atualizar próxima ação: ${error.message}`);
    return data ? rowToLead(data as LeadRow) : null;
  }

  async addNote(id: string, text: string): Promise<Lead | null> {
    const current = await this.getById(id);
    if (!current) return null;

    const notes = [
      ...current.notes,
      { id: randomUUID(), text, createdAt: new Date().toISOString() },
    ];

    const { data, error } = await this.client()
      .from("leads")
      .update({ notes })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Erro ao adicionar nota: ${error.message}`);
    return data ? rowToLead(data as LeadRow) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { error, count } = await this.client()
      .from("leads")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) throw new Error(`Erro ao excluir lead: ${error.message}`);
    return (count ?? 0) > 0;
  }

  async bulkDelete(ids: string[]): Promise<number> {
    const { error, count } = await this.client()
      .from("leads")
      .delete({ count: "exact" })
      .in("id", ids);
    if (error) throw new Error(`Erro ao excluir leads: ${error.message}`);
    return count ?? 0;
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

  async getStats(): Promise<DashboardStats> {
    const client = this.client();
    const baseCountQuery = () => client.from("leads").select("*", { count: "exact", head: true });
    type CountQuery = ReturnType<typeof baseCountQuery>;
    const countFor = (build: (q: CountQuery) => CountQuery) =>
      build(baseCountQuery()).then((r) => r.count ?? 0);

    const [
      total,
      novos,
      interessantes,
      contatados,
      respondeu,
      reuniao,
      proposta,
      clientes,
      altaPrioridade,
    ] = await Promise.all([
      countFor((q) => q),
      countFor((q) => q.eq("status", "NOVO")),
      countFor((q) => q.eq("status", "INTERESSANTE")),
      countFor((q) => q.eq("status", "CONTATADO")),
      countFor((q) => q.eq("status", "RESPONDEU")),
      countFor((q) => q.eq("status", "REUNIAO")),
      countFor((q) => q.eq("status", "PROPOSTA")),
      countFor((q) => q.eq("status", "CLIENTE")),
      countFor((q) => q.eq("priority", "ALTA")),
    ]);

    return { total, novos, interessantes, contatados, respondeu, reuniao, proposta, clientes, altaPrioridade };
  }

  async getStatusDistribution(): Promise<StatusDistributionItem[]> {
    const { data, error } = await this.client().from("leads").select("status");
    if (error) throw new Error(`Erro ao calcular distribuição: ${error.message}`);
    const counts = new Map<LeadStatus, number>();
    for (const row of data as { status: LeadStatus }[]) {
      counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    }
    return LEAD_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
  }

  async getScoreDistribution(): Promise<ScoreDistributionItem[]> {
    const { data, error } = await this.client().from("leads").select("score");
    if (error) throw new Error(`Erro ao calcular distribuição de score: ${error.message}`);
    let alta = 0;
    let media = 0;
    let baixa = 0;
    for (const row of data as { score: number }[]) {
      if (row.score >= 60) alta += 1;
      else if (row.score >= 30) media += 1;
      else baixa += 1;
    }
    return [
      { range: "ALTA", count: alta },
      { range: "MEDIA", count: media },
      { range: "BAIXA", count: baixa },
    ];
  }

  async getRecentResearch(limit: number): Promise<RecentResearchItem[]> {
    const { data, error } = await this.client()
      .from("leads")
      .select("research_query, created_at")
      .not("research_query", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(`Erro ao buscar pesquisas recentes: ${error.message}`);

    const map = new Map<string, RecentResearchItem>();
    for (const row of data as { research_query: string | null; created_at: string }[]) {
      if (!row.research_query) continue;
      const existing = map.get(row.research_query);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(row.research_query, {
          query: row.research_query,
          count: 1,
          lastRunAt: row.created_at,
        });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => new Date(b.lastRunAt).getTime() - new Date(a.lastRunAt).getTime())
      .slice(0, limit);
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

  async getTopOpportunities(limit: number): Promise<Lead[]> {
    const { data, error } = await this.client()
      .from("leads")
      .select("*")
      .order("score", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Erro ao buscar leads com maior oportunidade: ${error.message}`);
    return (data as LeadRow[]).map(rowToLead);
  }
}
