import type { Lead } from "@/types/lead";

export interface ProspectingCriteria {
  niche: string;
  city: string;
  state: string;
  quantity: number;
  additionalInstructions?: string;
  qualification?: QualificationCriteria;
}

export type AgentEvent =
  | { type: "step"; step: string; status: "running" | "done" | "error"; message: string }
  | { type: "lead"; lead: Lead }
  | { type: "skipped"; name: string; reason: string }
  | { type: "done"; count: number; requested: number; skippedByCriteria: number }
  | { type: "error"; message: string };

export interface BusinessCandidate {
  name: string;
  category: string;
  city: string;
  state: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  description: string | null;
  source: string;
}

/** Critérios de qualificação opcionais extraídos do formulário do Agente. */
export interface QualificationCriteria {
  requireInstagram?: boolean;
  requireNoWebsite?: boolean;
  requireOutdatedWebsite?: boolean;
  requireEstablishedBusiness?: boolean;
}
