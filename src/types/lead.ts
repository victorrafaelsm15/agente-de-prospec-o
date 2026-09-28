export type LeadStatus =
  | "NOVO"
  | "ANALISADO"
  | "INTERESSANTE"
  | "CONTATADO"
  | "RESPONDEU"
  | "REUNIAO"
  | "PROPOSTA"
  | "CLIENTE"
  | "DESCARTADO";

export const LEAD_STATUSES: LeadStatus[] = [
  "NOVO",
  "ANALISADO",
  "INTERESSANTE",
  "CONTATADO",
  "RESPONDEU",
  "REUNIAO",
  "PROPOSTA",
  "CLIENTE",
  "DESCARTADO",
];

export type LeadPriority = "BAIXA" | "MEDIA" | "ALTA";

export type WebsiteStatus =
  | "NAO_ENCONTRADO"
  | "ACESSIVEL"
  | "INACESSIVEL"
  | "NAO_VERIFICADO";

export interface WebsiteAnalysis {
  status: WebsiteStatus;
  hasHttps: boolean | null;
  title: string | null;
  metaDescription: string | null;
  hasViewportMeta: boolean | null;
  hasCallToAction: boolean | null;
  statusCode: number | null;
  responseTimeMs: number | null;
  notes: string[];
  checkedAt: string | null;
}

export interface Opportunity {
  label: string;
  points: number;
  category: "necessidade_de_site" | "presenca_comercial" | "oportunidade";
}

export interface Evidence {
  field: string;
  description: string;
  source: string;
  url?: string;
}

export interface Lead {
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

  websiteStatus: WebsiteStatus;
  websiteAnalysis: WebsiteAnalysis;

  opportunities: Opportunity[];
  score: number;
  priority: LeadPriority;

  aiAnalysis: string | null;
  outreachMessage: string | null;
  aiGenerated: boolean;

  status: LeadStatus;

  source: string;
  evidence: Evidence[];
  researchQuery: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface LeadFilters {
  search?: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  category?: string;
  sortBy?: "score" | "createdAt" | "name";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface LeadListResult {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardStats {
  total: number;
  novos: number;
  altaPrioridade: number;
  contatados: number;
  clientes: number;
}

export interface ActivityItem {
  id: string;
  message: string;
  createdAt: string;
}
