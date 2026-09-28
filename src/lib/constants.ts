import type { LeadPriority, LeadStatus } from "@/types/lead";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NOVO: "Novo",
  ANALISADO: "Analisado",
  INTERESSANTE: "Interessante",
  CONTATADO: "Contatado",
  RESPONDEU: "Respondeu",
  REUNIAO: "Reunião",
  PROPOSTA: "Proposta",
  CLIENTE: "Cliente",
  DESCARTADO: "Descartado",
};

export const STATUS_STYLES: Record<LeadStatus, string> = {
  NOVO: "bg-slate-100 text-slate-700 ring-slate-600/10",
  ANALISADO: "bg-sky-50 text-sky-700 ring-sky-600/10",
  INTERESSANTE: "bg-violet-50 text-violet-700 ring-violet-600/10",
  CONTATADO: "bg-amber-50 text-amber-700 ring-amber-600/10",
  RESPONDEU: "bg-amber-100 text-amber-800 ring-amber-600/10",
  REUNIAO: "bg-cyan-50 text-cyan-700 ring-cyan-600/10",
  PROPOSTA: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
  CLIENTE: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  DESCARTADO: "bg-rose-50 text-rose-700 ring-rose-600/10",
};

export const PRIORITY_LABELS: Record<LeadPriority, string> = {
  BAIXA: "Baixa prioridade",
  MEDIA: "Média prioridade",
  ALTA: "Alta prioridade",
};

export const PRIORITY_STYLES: Record<LeadPriority, string> = {
  BAIXA: "bg-slate-100 text-slate-600 ring-slate-600/10",
  MEDIA: "bg-amber-50 text-amber-700 ring-amber-600/10",
  ALTA: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
};

export const NICHE_SUGGESTIONS = [
  "Dentistas",
  "Clínicas de estética",
  "Nutricionistas",
  "Advogados",
  "Fisioterapeutas",
  "Psicólogos",
  "Salões de beleza",
  "Academias",
  "Arquitetos",
  "Contadores",
];
