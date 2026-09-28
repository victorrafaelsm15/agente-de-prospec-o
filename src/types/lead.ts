export type LeadStatus =
  | "NOVO"
  | "ANALISADO"
  | "INTERESSANTE"
  | "QUALIFICADO"
  | "CONTATO_PENDENTE"
  | "CONTATADO"
  | "RESPONDEU"
  | "REUNIAO"
  | "PROPOSTA"
  | "NEGOCIACAO"
  | "CLIENTE"
  | "DESCARTADO";

/** Ordem do pipeline comercial (V3) — também define a ordem das colunas do Kanban. */
export const LEAD_STATUSES: LeadStatus[] = [
  "NOVO",
  "ANALISADO",
  "INTERESSANTE",
  "QUALIFICADO",
  "CONTATO_PENDENTE",
  "CONTATADO",
  "RESPONDEU",
  "REUNIAO",
  "PROPOSTA",
  "NEGOCIACAO",
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
  briefing: string | null;

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

// ---------------------------------------------------------------------------
// V3 — SDR AI: canais de contato, reuniões, follow-ups, auditoria e config.
// ---------------------------------------------------------------------------

export type Channel = "WHATSAPP" | "EMAIL" | "INSTAGRAM" | "TELEFONE" | "OUTRO";
export const CHANNELS: Channel[] = ["WHATSAPP", "EMAIL", "INSTAGRAM", "TELEFONE", "OUTRO"];

export type InteractionDirection = "SAIDA" | "ENTRADA";
export type InteractionStatus = "RASCUNHO" | "ENVIADO" | "FALHOU" | "RECEBIDO";

export interface Interaction {
  id: string;
  leadId: string;
  channel: Channel;
  direction: InteractionDirection;
  message: string | null;
  status: InteractionStatus;
  occurredAt: string;
  createdAt: string;
}

export type MeetingStatus = "AGENDADA" | "REALIZADA" | "CANCELADA";

export interface Meeting {
  id: string;
  leadId: string;
  scheduledAt: string;
  notes: string | null;
  status: MeetingStatus;
  createdAt: string;
}

export type FollowUpStatus = "PENDENTE" | "CONCLUIDO" | "IGNORADO";

export interface FollowUp {
  id: string;
  leadId: string;
  dueDate: string;
  reason: string | null;
  status: FollowUpStatus;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  leadId: string | null;
  actor: "ia" | "usuario" | "sistema";
  action: string;
  description: string;
  createdAt: string;
}

export interface CommercialSettings {
  businessName: string | null;
  services: string | null;
  differentiator: string | null;
  targetAudience: string | null;
  tone: "profissional" | "consultivo" | "direto" | "casual" | null;
  emailSignature: string | null;
  updatedAt: string;
}

export type OutreachStyle = "DIRETA" | "CONSULTIVA" | "CASUAL" | "PROFISSIONAL";

/** Recomendação de próxima ação calculada por regras — sempre com o motivo explícito. */
export interface NextActionRecommendation {
  action: string;
  reason: string;
}

export interface AttentionItem {
  leadId: string;
  leadName: string;
  reason: string;
}

export interface AttentionSummary {
  readyForContact: AttentionItem[];
  followUpsDueToday: AttentionItem[];
  awaitingResponse: AttentionItem[];
  responded: AttentionItem[];
  upcomingMeetings: AttentionItem[];
}

export interface CommercialRates {
  contactRate: { value: number | null; numerator: number; denominator: number };
  responseRate: { value: number | null; numerator: number; denominator: number };
  meetingRate: { value: number | null; numerator: number; denominator: number };
  conversionRate: { value: number | null; numerator: number; denominator: number };
}

export interface Insight {
  label: string;
}
