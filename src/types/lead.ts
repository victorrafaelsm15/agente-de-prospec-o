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

  // Sinais técnicos adicionais (V2) — todos extraídos diretamente do HTML
  // retornado pelo site, nunca inferidos ou "avaliados visualmente" (isso
  // exigiria renderização/captura de tela, que esta versão não faz).
  h1Count: number | null;
  wordCount: number | null;
  hasPhoneLink: boolean | null;
  hasWhatsappLink: boolean | null;
  hasEmailLink: boolean | null;
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

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

export interface StatusHistoryEntry {
  status: LeadStatus;
  changedAt: string;
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
  whatsapp: string | null;
  email: string | null;
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
  statusHistory: StatusHistoryEntry[];
  notes: Note[];
  nextAction: string | null;
  nextActionDate: string | null;

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
  hasWebsite?: boolean;
  hasInstagram?: boolean;
  hasPhone?: boolean;
  hasWhatsapp?: boolean;
  outdatedWebsite?: boolean;
  dateFrom?: string;
  dateTo?: string;
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
  interessantes: number;
  contatados: number;
  respondeu: number;
  reuniao: number;
  proposta: number;
  clientes: number;
  altaPrioridade: number;
}

export interface StatusDistributionItem {
  status: LeadStatus;
  count: number;
}

export type ScoreRange = "ALTA" | "MEDIA" | "BAIXA";

export interface ScoreDistributionItem {
  range: ScoreRange;
  count: number;
}

export interface RecentResearchItem {
  query: string;
  count: number;
  lastRunAt: string;
}

export interface ActivityItem {
  id: string;
  message: string;
  createdAt: string;
}
