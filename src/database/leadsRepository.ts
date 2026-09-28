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

export type NewLead = Omit<
  Lead,
  "id" | "createdAt" | "updatedAt" | "statusHistory" | "notes"
> & {
  statusHistory?: Lead["statusHistory"];
  notes?: Lead["notes"];
};

export interface DuplicateMatch {
  lead: Lead;
  matchedBy: "website" | "name_city";
}

export interface LeadsRepository {
  list(filters: LeadFilters): Promise<LeadListResult>;
  listAll(filters: LeadFilters): Promise<Lead[]>;
  getById(id: string): Promise<Lead | null>;
  create(lead: NewLead): Promise<Lead>;
  updateStatus(id: string, status: LeadStatus): Promise<Lead | null>;
  bulkUpdateStatus(ids: string[], status: LeadStatus): Promise<number>;
  updateOutreachMessage(id: string, message: string): Promise<Lead | null>;
  updateNextAction(
    id: string,
    nextAction: string | null,
    nextActionDate: string | null
  ): Promise<Lead | null>;
  addNote(id: string, text: string): Promise<Lead | null>;
  delete(id: string): Promise<boolean>;
  bulkDelete(ids: string[]): Promise<number>;
  findDuplicate(candidate: {
    name: string;
    city: string;
    website: string | null;
    phone: string | null;
  }): Promise<DuplicateMatch | null>;
  getStats(): Promise<DashboardStats>;
  getStatusDistribution(): Promise<StatusDistributionItem[]>;
  getScoreDistribution(): Promise<ScoreDistributionItem[]>;
  getRecentResearch(limit: number): Promise<RecentResearchItem[]>;
  getRecent(limit: number): Promise<Lead[]>;
  getTopOpportunities(limit: number): Promise<Lead[]>;
}
