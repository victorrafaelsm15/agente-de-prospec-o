export type ProposalStatus =
  | "RASCUNHO"
  | "PRONTA"
  | "ENVIADA"
  | "VISUALIZADA"
  | "EM_NEGOCIACAO"
  | "APROVADA"
  | "RECUSADA"
  | "EXPIRADA"
  | "CANCELADA";

export const PROPOSAL_STATUSES: ProposalStatus[] = [
  "RASCUNHO",
  "PRONTA",
  "ENVIADA",
  "VISUALIZADA",
  "EM_NEGOCIACAO",
  "APROVADA",
  "RECUSADA",
  "EXPIRADA",
  "CANCELADA",
];

export type DiscountType = "PERCENTUAL" | "FIXO";

export type ProposalTone = "profissional" | "premium" | "consultivo" | "direto" | "moderno";

export interface ProposalBriefing {
  cliente?: {
    empresa?: string;
    responsavel?: string;
    segmento?: string;
    localizacao?: string;
    contatos?: string;
  };
  projeto?: {
    objetivo?: string;
    problemaAtual?: string;
    publicoAlvo?: string;
    necessidades?: string;
    servicosDesejados?: string;
    referencias?: string;
    funcionalidades?: string;
    observacoes?: string;
  };
  presencaAtual?: {
    site?: string;
    instagram?: string;
    outrosCanais?: string;
    principaisProblemas?: string;
  };
}

export interface ProposalDiagnosis {
  situacaoAtual?: string;
  oportunidades?: string;
  solucaoProposta?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  defaultPrice: number | null;
  unit: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalItem {
  id: string;
  proposalId: string;
  serviceId: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  position: number;
  createdAt: string;
}

export interface Proposal {
  id: string;
  leadId: string;
  title: string;
  status: ProposalStatus;
  tone: ProposalTone | null;

  briefing: ProposalBriefing;
  diagnosis: ProposalDiagnosis;

  scopeNotes: string | null;
  nextSteps: string[];
  terms: string | null;
  paymentTerms: string | null;
  timeline: string | null;

  validityDays: number;
  expiresAt: string | null;

  discountType: DiscountType | null;
  discountValue: number;
  subtotal: number;
  total: number;

  rejectionReason: string | null;
  acceptedAt: string | null;
  currentVersion: number;

  createdAt: string;
  updatedAt: string;
}

export interface ProposalWithItems extends Proposal {
  items: ProposalItem[];
}

export interface ProposalVersion {
  id: string;
  proposalId: string;
  versionNumber: number;
  snapshot: ProposalWithItems;
  total: number;
  note: string | null;
  createdAt: string;
}

export type ProposalEventType =
  | "criada"
  | "editada"
  | "versao_criada"
  | "pdf_gerado"
  | "enviada"
  | "visualizada"
  | "aceita"
  | "recusada"
  | "status_alterado"
  | "cancelada";

export interface ProposalEvent {
  id: string;
  proposalId: string;
  event: string;
  actor: "usuario" | "cliente" | "ia" | "sistema";
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ProposalTokenInfo {
  id: string;
  proposalId: string;
  token: string;
  createdAt: string;
  revokedAt: string | null;
}

/** Visão financeira simples do pipeline de propostas — nunca fabricada. */
export interface ProposalFinancialSummary {
  openValue: number;
  openCount: number;
  negotiatingValue: number;
  negotiatingCount: number;
  approvedValue: number;
  approvedCount: number;
  rejectedValue: number;
  rejectedCount: number;
}

/** Campos client-safe expostos na página pública — nunca dados internos do CRM. */
export interface PublicProposal {
  title: string;
  status: ProposalStatus;
  tone: ProposalTone | null;
  briefing: ProposalBriefing;
  diagnosis: ProposalDiagnosis;
  items: Pick<ProposalItem, "id" | "name" | "description" | "quantity" | "unitPrice" | "total">[];
  scopeNotes: string | null;
  nextSteps: string[];
  terms: string | null;
  paymentTerms: string | null;
  timeline: string | null;
  discountType: DiscountType | null;
  discountValue: number;
  subtotal: number;
  total: number;
  validityDays: number;
  expiresAt: string | null;
  currentVersion: number;
  createdAt: string;
  leadName: string;
  brand: {
    businessName: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    socialLinks: { label: string; url: string }[];
  };
}
