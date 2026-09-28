import type { Lead } from "@/types/lead";

export interface ProspectingCriteria {
  niche: string;
  city: string;
  state: string;
  quantity: number;
  additionalInstructions?: string;
}

export type AgentEvent =
  | { type: "step"; step: string; status: "running" | "done" | "error"; message: string }
  | { type: "lead"; lead: Lead }
  | { type: "done"; count: number; requested: number }
  | { type: "error"; message: string };

export interface BusinessCandidate {
  name: string;
  category: string;
  city: string;
  state: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  description: string | null;
  source: string;
}
