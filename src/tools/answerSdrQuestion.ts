import { callClaude } from "@/lib/ai/anthropicClient";
import { isAnthropicConfigured } from "@/lib/env";
import type { AttentionSummary, CommercialRates, Insight, Lead } from "@/types/lead";

export interface AnswerSdrQuestionInput {
  question: string;
  leads: Lead[];
  attention: AttentionSummary;
  rates: CommercialRates;
  insights: Insight[];
}

export interface AnswerSdrQuestionResult {
  answer: string;
  aiGenerated: boolean;
}

const SYSTEM_PROMPT = `Você é um assistente comercial que responde perguntas sobre a base de
leads do usuário, em português do Brasil.

Regras obrigatórias e inegociáveis:
- Responda ESTRITAMENTE com base nos dados fornecidos abaixo (JSON). Nunca
  invente leads, números, nomes de empresas ou qualquer informação que não
  esteja no JSON.
- Se a pergunta não puder ser respondida com os dados fornecidos, diga
  claramente que não tem essa informação disponível.
- Seja direto e objetivo (poucas frases). Cite nomes de leads reais do JSON
  quando relevante.
- Nunca sugira enviar mensagens automaticamente — o usuário sempre decide.`;

export async function answerSdrQuestion(input: AnswerSdrQuestionInput): Promise<AnswerSdrQuestionResult> {
  if (isAnthropicConfigured) {
    try {
      const prompt = buildPrompt(input);
      const answer = await callClaude({ system: SYSTEM_PROMPT, prompt, maxTokens: 400 });
      if (answer) return { answer, aiGenerated: true };
    } catch {
      // cai para o fallback heurístico abaixo
    }
  }

  return { answer: buildHeuristicAnswer(input), aiGenerated: false };
}

function buildPrompt(input: AnswerSdrQuestionInput): string {
  const snapshot = {
    totalLeads: input.leads.length,
    leadsProntosParaContato: input.attention.readyForContact,
    followUpsPendentesHoje: input.attention.followUpsDueToday,
    aguardandoResposta: input.attention.awaitingResponse,
    responderam: input.attention.responded,
    proximasReunioes: input.attention.upcomingMeetings,
    taxas: input.rates,
    insights: input.insights.map((i) => i.label),
    topLeadsPorScore: [...input.leads]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((l) => ({ nome: l.name, categoria: l.category, cidade: l.city, score: l.score, status: l.status })),
  };

  return `Pergunta do usuário: "${input.question}"\n\nDados disponíveis (JSON):\n${JSON.stringify(snapshot, null, 2)}`;
}

function buildHeuristicAnswer(input: AnswerSdrQuestionInput): string {
  const q = input.question.toLowerCase();

  if (q.includes("hoje") || q.includes("abordar") || q.includes("contato")) {
    const items = input.attention.readyForContact;
    if (items.length === 0) return "Não há leads aguardando primeiro contato no momento.";
    return `${items.length} lead(s) prontos para contato: ${items.slice(0, 8).map((i) => i.leadName).join(", ")}${items.length > 8 ? "..." : ""}.`;
  }

  if (q.includes("follow") || q.includes("acompanh")) {
    const items = input.attention.followUpsDueToday;
    if (items.length === 0) return "Não há follow-ups pendentes para hoje.";
    return `${items.length} follow-up(s) pendente(s): ${items.map((i) => i.leadName).join(", ")}.`;
  }

  if (q.includes("respond")) {
    const items = input.attention.responded;
    if (items.length === 0) return "Nenhum lead respondeu recentemente.";
    return `${items.length} lead(s) responderam: ${items.map((i) => i.leadName).join(", ")}.`;
  }

  if (q.includes("oportunidade") || q.includes("score") || q.includes("prioridade")) {
    const top = [...input.leads].sort((a, b) => b.score - a.score).slice(0, 5);
    if (top.length === 0) return "Não há leads cadastrados ainda.";
    return `Leads com maior oportunidade: ${top.map((l) => `${l.name} (${l.score}/100)`).join(", ")}.`;
  }

  if (q.includes("resum") || q.includes("semana")) {
    return [
      `Você tem ${input.leads.length} lead(s) no total.`,
      `${input.attention.readyForContact.length} prontos para contato.`,
      `${input.attention.followUpsDueToday.length} follow-up(s) pendente(s).`,
      `${input.attention.responded.length} responderam recentemente.`,
      `${input.attention.upcomingMeetings.length} reunião(ões) agendada(s).`,
    ].join(" ");
  }

  if (q.includes("reuni")) {
    const items = input.attention.upcomingMeetings;
    if (items.length === 0) return "Não há reuniões agendadas no momento.";
    return `${items.length} reunião(ões) agendada(s): ${items.map((i) => `${i.leadName} (${i.reason})`).join("; ")}.`;
  }

  return "Não tenho IA configurada para interpretar perguntas livres (defina ANTHROPIC_API_KEY). Tente perguntas como \"quais leads devo abordar hoje\", \"quais follow-ups estão pendentes\" ou \"resuma minhas oportunidades\".";
}
