import type {
  AttentionItem,
  AttentionSummary,
  CommercialRates,
  FollowUp,
  Insight,
  Interaction,
  Lead,
  Meeting,
} from "@/types/lead";
import { formatDateOnly } from "@/lib/utils";

const READY_FOR_CONTACT_STATUSES: Lead["status"][] = [
  "NOVO",
  "ANALISADO",
  "INTERESSANTE",
  "QUALIFICADO",
];

interface LeadInteractionSummary {
  lastOutboundAt: string | null;
  lastInboundAt: string | null;
}

function summarizeInteractionsByLead(interactions: Interaction[]): Map<string, LeadInteractionSummary> {
  const map = new Map<string, LeadInteractionSummary>();
  // interactions já vem ordenado por occurred_at desc na maioria dos casos,
  // mas ordenamos de novo aqui para não depender disso.
  const sorted = [...interactions].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
  for (const interaction of sorted) {
    const entry = map.get(interaction.leadId) ?? { lastOutboundAt: null, lastInboundAt: null };
    if (interaction.direction === "SAIDA" && interaction.status !== "RASCUNHO" && !entry.lastOutboundAt) {
      entry.lastOutboundAt = interaction.occurredAt;
    }
    if (interaction.direction === "ENTRADA" && !entry.lastInboundAt) {
      entry.lastInboundAt = interaction.occurredAt;
    }
    map.set(interaction.leadId, entry);
  }
  return map;
}

export function buildAttentionSummary(
  leads: Lead[],
  interactions: Interaction[],
  dueFollowUps: (FollowUp & { leadName: string })[],
  upcomingMeetings: (Meeting & { leadName: string })[]
): AttentionSummary {
  const byLead = summarizeInteractionsByLead(interactions);
  const activeLeads = leads.filter((l) => l.status !== "CLIENTE" && l.status !== "DESCARTADO");

  const readyForContact: AttentionItem[] = [];
  const awaitingResponse: AttentionItem[] = [];
  const responded: AttentionItem[] = [];

  for (const lead of activeLeads) {
    const summary = byLead.get(lead.id);

    if (!summary?.lastOutboundAt && READY_FOR_CONTACT_STATUSES.includes(lead.status)) {
      readyForContact.push({
        leadId: lead.id,
        leadName: lead.name,
        reason: "Ainda não recebeu nenhum contato.",
      });
      continue;
    }

    if (summary?.lastInboundAt && (!summary.lastOutboundAt || summary.lastInboundAt > summary.lastOutboundAt)) {
      responded.push({
        leadId: lead.id,
        leadName: lead.name,
        reason: `Respondeu em ${new Date(summary.lastInboundAt).toLocaleDateString("pt-BR")}.`,
      });
      continue;
    }

    if (summary?.lastOutboundAt) {
      const days = Math.max(
        0,
        Math.floor((Date.now() - new Date(summary.lastOutboundAt).getTime()) / 86_400_000)
      );
      if (days >= 3) {
        awaitingResponse.push({
          leadId: lead.id,
          leadName: lead.name,
          reason: `Sem resposta há ${days} dias.`,
        });
      }
    }
  }

  const followUpsDueToday: AttentionItem[] = dueFollowUps.map((f) => ({
    leadId: f.leadId,
    leadName: f.leadName,
    reason: f.reason ?? `Follow-up para ${formatDateOnly(f.dueDate)}.`,
  }));

  const meetingItems: AttentionItem[] = upcomingMeetings.map((m) => ({
    leadId: m.leadId,
    leadName: m.leadName,
    reason: `Reunião em ${new Date(m.scheduledAt).toLocaleString("pt-BR")}.`,
  }));

  return {
    readyForContact,
    followUpsDueToday,
    awaitingResponse,
    responded,
    upcomingMeetings: meetingItems,
  };
}

function rate(numerator: number, denominator: number): CommercialRates["contactRate"] {
  return {
    value: denominator > 0 ? Math.round((numerator / denominator) * 100) : null,
    numerator,
    denominator,
  };
}

const CONTACTED_OR_BEYOND: Lead["status"][] = [
  "CONTATO_PENDENTE",
  "CONTATADO",
  "RESPONDEU",
  "REUNIAO",
  "PROPOSTA",
  "NEGOCIACAO",
  "CLIENTE",
];
const RESPONDED_OR_BEYOND: Lead["status"][] = [
  "RESPONDEU",
  "REUNIAO",
  "PROPOSTA",
  "NEGOCIACAO",
  "CLIENTE",
];
const MEETING_OR_BEYOND: Lead["status"][] = ["REUNIAO", "PROPOSTA", "NEGOCIACAO", "CLIENTE"];

/**
 * Taxas comerciais calculadas SOMENTE a partir do status real dos leads —
 * nunca fabricadas. Quando o denominador é zero, o value fica `null` e a UI
 * deve mostrar "Dados insuficientes para calcular".
 */
export function computeCommercialRates(leads: Lead[]): CommercialRates {
  const total = leads.length;
  const contacted = leads.filter((l) => CONTACTED_OR_BEYOND.includes(l.status)).length;
  const responded = leads.filter((l) => RESPONDED_OR_BEYOND.includes(l.status)).length;
  const meetings = leads.filter((l) => MEETING_OR_BEYOND.includes(l.status)).length;
  const clients = leads.filter((l) => l.status === "CLIENTE").length;

  return {
    contactRate: rate(contacted, total),
    responseRate: rate(responded, contacted),
    meetingRate: rate(meetings, contacted),
    conversionRate: rate(clients, total),
  };
}

/**
 * Insights descritivos calculados a partir de contagens reais — sempre com
 * o número exato, nunca uma estimativa vaga.
 */
export function computeInsights(leads: Lead[]): Insight[] {
  const insights: Insight[] = [];
  const total = leads.length;
  if (total === 0) return insights;

  const withInstagramNoSite = leads.filter((l) => l.instagram && !l.website).length;
  if (withInstagramNoSite > 0) {
    const pct = Math.round((withInstagramNoSite / total) * 100);
    insights.push({
      label: `${pct}% dos leads (${withInstagramNoSite} de ${total}) têm Instagram ativo, mas não têm site.`,
    });
  }

  const outdated = leads.filter(
    (l) =>
      l.website &&
      (l.websiteAnalysis.hasCallToAction === false || l.websiteAnalysis.hasViewportMeta === false)
  ).length;
  if (outdated > 0) {
    const pct = Math.round((outdated / total) * 100);
    insights.push({
      label: `${pct}% dos leads (${outdated} de ${total}) têm site com sinais de estar desatualizado.`,
    });
  }

  const byCategory = new Map<string, number>();
  for (const lead of leads) {
    if (lead.score >= 60) byCategory.set(lead.category, (byCategory.get(lead.category) ?? 0) + 1);
  }
  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    insights.push({
      label: `A maior concentração de oportunidades de alta prioridade está em "${topCategory[0]}" (${topCategory[1]} lead(s)).`,
    });
  }

  const noContact = leads.filter((l) => l.status === "NOVO" || l.status === "ANALISADO").length;
  if (noContact > 0) {
    insights.push({
      label: `${noContact} lead(s) ainda não receberam nenhum contato.`,
    });
  }

  return insights;
}
