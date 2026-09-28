import { formatDateOnly } from "@/lib/utils";
import type { FollowUp, Interaction, Lead, Meeting, NextActionRecommendation } from "@/types/lead";

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * computeNextActionRecommendation — recomendação de próxima ação 100%
 * determinística (regras claras, nunca uma "opinião" da IA sem motivo).
 * Sempre retorna o motivo junto da recomendação, para manter a IA explicável.
 */
export function computeNextActionRecommendation(
  lead: Lead,
  interactions: Interaction[],
  followUps: FollowUp[],
  meetings: Meeting[]
): NextActionRecommendation {
  if (lead.status === "CLIENTE") {
    return { action: "Nenhuma ação necessária", reason: "Este lead já é cliente." };
  }
  if (lead.status === "DESCARTADO") {
    return { action: "Nenhuma ação necessária", reason: "Este lead foi descartado." };
  }

  const pendingFollowUp = followUps.find((f) => f.status === "PENDENTE");
  if (pendingFollowUp) {
    const due = new Date(pendingFollowUp.dueDate);
    const isOverdue = due.getTime() <= Date.now();
    return {
      action: "Fazer o follow-up agendado",
      reason: isOverdue
        ? `Havia um follow-up marcado para ${formatDateOnly(pendingFollowUp.dueDate)} — já venceu.`
        : `Follow-up agendado para ${formatDateOnly(pendingFollowUp.dueDate)}.`,
    };
  }

  const upcomingMeeting = meetings.find((m) => m.status === "AGENDADA" && new Date(m.scheduledAt) > new Date());
  if (upcomingMeeting) {
    return {
      action: "Preparar-se para a reunião agendada",
      reason: `Reunião marcada para ${new Date(upcomingMeeting.scheduledAt).toLocaleString("pt-BR")}.`,
    };
  }
  const pastMeetingNotClosed = meetings.find(
    (m) => m.status === "AGENDADA" && new Date(m.scheduledAt) <= new Date()
  );
  if (pastMeetingNotClosed) {
    return {
      action: "Registrar o resultado da reunião",
      reason: "Havia uma reunião marcada que já passou e ainda não foi marcada como realizada.",
    };
  }

  const outbound = interactions.filter((i) => i.direction === "SAIDA" && i.status !== "RASCUNHO");
  const inbound = interactions.filter((i) => i.direction === "ENTRADA");
  const lastOutbound = outbound[0]; // já vem ordenado por occurredAt desc
  const lastInbound = inbound[0];

  if (lead.status === "PROPOSTA") {
    const days = lastOutbound ? daysSince(lastOutbound.occurredAt) : null;
    return {
      action: "Fazer follow-up da proposta",
      reason:
        days !== null
          ? `Proposta enviada há ${days} dia(s), ainda sem decisão registrada.`
          : "Lead está com status Proposta, mas nenhum contato foi registrado ainda — considere enviar a proposta.",
    };
  }

  if (lead.status === "RESPONDEU" || (lastInbound && (!lastOutbound || lastInbound.occurredAt > lastOutbound.occurredAt))) {
    return {
      action: "Responder o lead",
      reason: "O lead respondeu por último e está aguardando seu retorno.",
    };
  }

  if (!lastOutbound) {
    return {
      action: "Entrar em contato",
      reason: "Nenhuma mensagem foi enviada a este lead ainda.",
    };
  }

  const daysSinceContact = daysSince(lastOutbound.occurredAt);
  if (daysSinceContact >= 3) {
    return {
      action: "Fazer follow-up",
      reason: `Última mensagem enviada há ${daysSinceContact} dias, sem resposta registrada.`,
    };
  }

  return {
    action: "Aguardar resposta",
    reason: `Mensagem enviada há ${daysSinceContact} dia(s) — ainda dentro do prazo razoável de espera.`,
  };
}
