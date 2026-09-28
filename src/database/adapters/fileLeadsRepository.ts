import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
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
import { LEAD_STATUSES } from "@/types/lead";

/**
 * Adapter de desenvolvimento: persiste leads em um arquivo JSON local.
 *
 * Usado automaticamente quando o Supabase não está configurado, para que o
 * restante da aplicação (dashboard, leads, agente) possa ser testado sem
 * depender de um banco externo. NÃO é adequado para produção/Vercel: o
 * sistema de arquivos de funções serverless é efêmero e não é compartilhado
 * entre instâncias. Configure o Supabase (ver database/schema.sql e README)
 * antes de publicar em produção.
 */
export class FileLeadsRepository implements LeadsRepository {
  private filePath = path.join(process.cwd(), ".data", "leads.json");
  private writeQueue: Promise<unknown> = Promise.resolve();

  private async readAll(): Promise<Lead[]> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      return JSON.parse(raw) as Lead[];
    } catch {
      return [];
    }
  }

  private async writeAll(leads: Lead[]): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(leads, null, 2), "utf-8");
  }

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.writeQueue.then(fn);
    this.writeQueue = result.catch(() => undefined);
    return result;
  }

  private applyFilters(leads: Lead[], filters: LeadFilters): Lead[] {
    let result = leads;

    if (filters.status) result = result.filter((l) => l.status === filters.status);
    if (filters.priority) result = result.filter((l) => l.priority === filters.priority);
    if (filters.category) {
      const q = filters.category.toLowerCase();
      result = result.filter((l) => l.category.toLowerCase().includes(q));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      );
    }
    if (filters.hasWebsite !== undefined) {
      result = result.filter((l) => Boolean(l.website) === filters.hasWebsite);
    }
    if (filters.hasInstagram !== undefined) {
      result = result.filter((l) => Boolean(l.instagram) === filters.hasInstagram);
    }
    if (filters.hasPhone !== undefined) {
      result = result.filter((l) => Boolean(l.phone) === filters.hasPhone);
    }
    if (filters.hasWhatsapp !== undefined) {
      result = result.filter((l) => Boolean(l.whatsapp) === filters.hasWhatsapp);
    }
    if (filters.outdatedWebsite !== undefined) {
      result = result.filter((l) => {
        const isOutdated =
          Boolean(l.website) &&
          (l.websiteAnalysis.hasCallToAction === false ||
            l.websiteAnalysis.hasViewportMeta === false ||
            l.websiteStatus === "INACESSIVEL");
        return filters.outdatedWebsite ? isOutdated : !isOutdated;
      });
    }
    if (filters.dateFrom) {
      result = result.filter((l) => l.createdAt >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter((l) => l.createdAt <= filters.dateTo!);
    }

    return result;
  }

  private sort(leads: Lead[], filters: LeadFilters): Lead[] {
    const sortBy = filters.sortBy ?? "score";
    const sortDir = filters.sortDir ?? "desc";
    const sorted = [...leads].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "score") cmp = a.score - b.score;
      else if (sortBy === "createdAt")
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else cmp = a.name.localeCompare(b.name);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }

  async list(filters: LeadFilters): Promise<LeadListResult> {
    const leads = this.sort(this.applyFilters(await this.readAll(), filters), filters);

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const total = leads.length;
    const start = (page - 1) * pageSize;
    const paginated = leads.slice(start, start + pageSize);

    return { leads: paginated, total, page, pageSize };
  }

  async listAll(filters: LeadFilters): Promise<Lead[]> {
    return this.sort(this.applyFilters(await this.readAll(), filters), filters);
  }

  async getById(id: string): Promise<Lead | null> {
    const leads = await this.readAll();
    return leads.find((l) => l.id === id) ?? null;
  }

  async create(lead: NewLead): Promise<Lead> {
    return this.enqueue(async () => {
      const leads = await this.readAll();
      const now = new Date().toISOString();
      const newLead: Lead = {
        ...lead,
        statusHistory: lead.statusHistory ?? [{ status: lead.status, changedAt: now }],
        notes: lead.notes ?? [],
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      leads.unshift(newLead);
      await this.writeAll(leads);
      return newLead;
    });
  }

  async updateStatus(id: string, status: LeadStatus): Promise<Lead | null> {
    return this.enqueue(async () => {
      const leads = await this.readAll();
      const idx = leads.findIndex((l) => l.id === id);
      if (idx === -1) return null;
      const now = new Date().toISOString();
      leads[idx] = {
        ...leads[idx],
        status,
        statusHistory: [...leads[idx].statusHistory, { status, changedAt: now }],
        updatedAt: now,
      };
      await this.writeAll(leads);
      return leads[idx];
    });
  }

  async bulkUpdateStatus(ids: string[], status: LeadStatus): Promise<number> {
    return this.enqueue(async () => {
      const leads = await this.readAll();
      const now = new Date().toISOString();
      let updated = 0;
      for (const id of ids) {
        const idx = leads.findIndex((l) => l.id === id);
        if (idx === -1) continue;
        leads[idx] = {
          ...leads[idx],
          status,
          statusHistory: [...leads[idx].statusHistory, { status, changedAt: now }],
          updatedAt: now,
        };
        updated += 1;
      }
      await this.writeAll(leads);
      return updated;
    });
  }

  async updateOutreachMessage(id: string, message: string): Promise<Lead | null> {
    return this.enqueue(async () => {
      const leads = await this.readAll();
      const idx = leads.findIndex((l) => l.id === id);
      if (idx === -1) return null;
      leads[idx] = {
        ...leads[idx],
        outreachMessage: message,
        updatedAt: new Date().toISOString(),
      };
      await this.writeAll(leads);
      return leads[idx];
    });
  }

  async updateBriefing(id: string, briefing: string): Promise<Lead | null> {
    return this.enqueue(async () => {
      const leads = await this.readAll();
      const idx = leads.findIndex((l) => l.id === id);
      if (idx === -1) return null;
      leads[idx] = { ...leads[idx], briefing, updatedAt: new Date().toISOString() };
      await this.writeAll(leads);
      return leads[idx];
    });
  }

  async updateNextAction(
    id: string,
    nextAction: string | null,
    nextActionDate: string | null
  ): Promise<Lead | null> {
    return this.enqueue(async () => {
      const leads = await this.readAll();
      const idx = leads.findIndex((l) => l.id === id);
      if (idx === -1) return null;
      leads[idx] = {
        ...leads[idx],
        nextAction,
        nextActionDate,
        updatedAt: new Date().toISOString(),
      };
      await this.writeAll(leads);
      return leads[idx];
    });
  }

  async addNote(id: string, text: string): Promise<Lead | null> {
    return this.enqueue(async () => {
      const leads = await this.readAll();
      const idx = leads.findIndex((l) => l.id === id);
      if (idx === -1) return null;
      const now = new Date().toISOString();
      leads[idx] = {
        ...leads[idx],
        notes: [...leads[idx].notes, { id: randomUUID(), text, createdAt: now }],
        updatedAt: now,
      };
      await this.writeAll(leads);
      return leads[idx];
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.enqueue(async () => {
      const leads = await this.readAll();
      const filtered = leads.filter((l) => l.id !== id);
      const removed = filtered.length !== leads.length;
      if (removed) await this.writeAll(filtered);
      return removed;
    });
  }

  async bulkDelete(ids: string[]): Promise<number> {
    return this.enqueue(async () => {
      const leads = await this.readAll();
      const idSet = new Set(ids);
      const filtered = leads.filter((l) => !idSet.has(l.id));
      const removed = leads.length - filtered.length;
      if (removed > 0) await this.writeAll(filtered);
      return removed;
    });
  }

  async findDuplicate(candidate: {
    name: string;
    city: string;
    website: string | null;
    phone: string | null;
  }): Promise<DuplicateMatch | null> {
    const leads = await this.readAll();

    if (candidate.website) {
      const byWebsite = leads.find(
        (l) => l.website && l.website.toLowerCase() === candidate.website!.toLowerCase()
      );
      if (byWebsite) return { lead: byWebsite, matchedBy: "website" };
    }

    const byNameCity = leads.find(
      (l) =>
        l.name.toLowerCase() === candidate.name.toLowerCase() &&
        l.city.toLowerCase() === candidate.city.toLowerCase()
    );
    if (byNameCity) return { lead: byNameCity, matchedBy: "name_city" };

    return null;
  }

  async getStats(): Promise<DashboardStats> {
    const leads = await this.readAll();
    const countStatus = (s: LeadStatus) => leads.filter((l) => l.status === s).length;
    return {
      total: leads.length,
      novos: countStatus("NOVO"),
      interessantes: countStatus("INTERESSANTE"),
      contatados: countStatus("CONTATADO"),
      respondeu: countStatus("RESPONDEU"),
      reuniao: countStatus("REUNIAO"),
      proposta: countStatus("PROPOSTA"),
      clientes: countStatus("CLIENTE"),
      altaPrioridade: leads.filter((l) => l.priority === "ALTA").length,
    };
  }

  async getStatusDistribution(): Promise<StatusDistributionItem[]> {
    const leads = await this.readAll();
    return LEAD_STATUSES.map((status) => ({
      status,
      count: leads.filter((l) => l.status === status).length,
    }));
  }

  async getScoreDistribution(): Promise<ScoreDistributionItem[]> {
    const leads = await this.readAll();
    return [
      { range: "ALTA" as const, count: leads.filter((l) => l.score >= 60).length },
      {
        range: "MEDIA" as const,
        count: leads.filter((l) => l.score >= 30 && l.score < 60).length,
      },
      { range: "BAIXA" as const, count: leads.filter((l) => l.score < 30).length },
    ];
  }

  async getRecentResearch(limit: number): Promise<RecentResearchItem[]> {
    const leads = await this.readAll();
    const map = new Map<string, RecentResearchItem>();
    for (const lead of leads) {
      if (!lead.researchQuery) continue;
      const existing = map.get(lead.researchQuery);
      if (existing) {
        existing.count += 1;
        if (lead.createdAt > existing.lastRunAt) existing.lastRunAt = lead.createdAt;
      } else {
        map.set(lead.researchQuery, {
          query: lead.researchQuery,
          count: 1,
          lastRunAt: lead.createdAt,
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => new Date(b.lastRunAt).getTime() - new Date(a.lastRunAt).getTime())
      .slice(0, limit);
  }

  async getRecent(limit: number): Promise<Lead[]> {
    const leads = await this.readAll();
    return [...leads]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getTopOpportunities(limit: number): Promise<Lead[]> {
    const leads = await this.readAll();
    return [...leads].sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
