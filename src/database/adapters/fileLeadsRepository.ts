import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  DuplicateMatch,
  LeadsRepository,
  NewLead,
} from "@/database/leadsRepository";
import type { Lead, LeadFilters, LeadListResult, LeadStatus } from "@/types/lead";

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

  async list(filters: LeadFilters): Promise<LeadListResult> {
    let leads = await this.readAll();

    if (filters.status) leads = leads.filter((l) => l.status === filters.status);
    if (filters.priority) leads = leads.filter((l) => l.priority === filters.priority);
    if (filters.category) {
      const q = filters.category.toLowerCase();
      leads = leads.filter((l) => l.category.toLowerCase().includes(q));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      );
    }

    const sortBy = filters.sortBy ?? "score";
    const sortDir = filters.sortDir ?? "desc";
    leads.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "score") cmp = a.score - b.score;
      else if (sortBy === "createdAt")
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else cmp = a.name.localeCompare(b.name);
      return sortDir === "asc" ? cmp : -cmp;
    });

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const total = leads.length;
    const start = (page - 1) * pageSize;
    const paginated = leads.slice(start, start + pageSize);

    return { leads: paginated, total, page, pageSize };
  }

  async getById(id: string): Promise<Lead | null> {
    const leads = await this.readAll();
    return leads.find((l) => l.id === id) ?? null;
  }

  async create(lead: NewLead): Promise<Lead> {
    return this.enqueue(async () => {
      const leads = await this.readAll();
      const now = new Date().toISOString();
      const newLead: Lead = { ...lead, id: randomUUID(), createdAt: now, updatedAt: now };
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
      leads[idx] = { ...leads[idx], status, updatedAt: new Date().toISOString() };
      await this.writeAll(leads);
      return leads[idx];
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

  async getStats() {
    const leads = await this.readAll();
    return {
      total: leads.length,
      novos: leads.filter((l) => l.status === "NOVO").length,
      altaPrioridade: leads.filter((l) => l.priority === "ALTA").length,
      contatados: leads.filter((l) =>
        ["CONTATADO", "RESPONDEU", "REUNIAO", "PROPOSTA"].includes(l.status)
      ).length,
      clientes: leads.filter((l) => l.status === "CLIENTE").length,
    };
  }

  async getRecent(limit: number): Promise<Lead[]> {
    const leads = await this.readAll();
    return [...leads]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}
