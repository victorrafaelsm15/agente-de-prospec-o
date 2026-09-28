import type { Lead, LeadFilters, LeadListResult } from "@/types/lead";

export type NewLead = Omit<Lead, "id" | "createdAt" | "updatedAt">;

export interface DuplicateMatch {
  lead: Lead;
  matchedBy: "website" | "name_city";
}

export interface LeadsRepository {
  list(filters: LeadFilters): Promise<LeadListResult>;
  getById(id: string): Promise<Lead | null>;
  create(lead: NewLead): Promise<Lead>;
  updateStatus(id: string, status: Lead["status"]): Promise<Lead | null>;
  updateOutreachMessage(id: string, message: string): Promise<Lead | null>;
  findDuplicate(candidate: {
    name: string;
    city: string;
    website: string | null;
    phone: string | null;
  }): Promise<DuplicateMatch | null>;
  getStats(): Promise<{
    total: number;
    novos: number;
    altaPrioridade: number;
    contatados: number;
    clientes: number;
  }>;
  getRecent(limit: number): Promise<Lead[]>;
}
