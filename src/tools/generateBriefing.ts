import { callClaude } from "@/lib/ai/anthropicClient";
import { isAnthropicConfigured } from "@/lib/env";
import type { CommercialSettings, Lead } from "@/types/lead";

export interface GenerateBriefingResult {
  briefing: string;
  aiGenerated: boolean;
}

const SYSTEM_PROMPT = `Você redige briefings comerciais curtos e objetivos em português do
Brasil, a partir dos dados reais de um lead já analisado. O briefing serve
para preparar uma proposta futura — ainda NÃO é a proposta em si.

Regras obrigatórias:
- Use ESTRITAMENTE os fatos e a análise fornecidos. Nunca invente preço,
  prazo, funcionalidades específicas ou qualquer dado não fornecido.
- Estruture em tópicos claros: Empresa, Segmento, Localização, Presença
  atual, Principais oportunidades, Objetivo provável, Necessidades
  identificadas, Sugestão de próximos passos.
- "Objetivo provável" e "Sugestão de próximos passos" devem ser inferências
  razoáveis a partir da análise — nunca afirmações categóricas.
- Seja conciso: cada tópico com 1-2 frases.`;

export async function generateBriefing(
  lead: Lead,
  settings?: CommercialSettings | null
): Promise<GenerateBriefingResult> {
  if (isAnthropicConfigured) {
    try {
      const prompt = buildPrompt(lead, settings);
      const briefing = await callClaude({ system: SYSTEM_PROMPT, prompt, maxTokens: 600 });
      if (briefing) return { briefing, aiGenerated: true };
    } catch {
      // cai para o fallback heurístico abaixo
    }
  }

  return { briefing: buildHeuristicBriefing(lead), aiGenerated: false };
}

function buildPrompt(lead: Lead, settings?: CommercialSettings | null): string {
  const lines = [
    `Empresa: ${lead.name}`,
    `Segmento: ${lead.category}`,
    `Localização: ${lead.city}/${lead.state}`,
    `Site: ${lead.website ?? "não encontrado"}`,
    `Instagram: ${lead.instagram ?? "não encontrado"}`,
    `Análise já realizada: ${lead.aiAnalysis ?? "não disponível"}`,
    `Oportunidades identificadas: ${lead.opportunities.map((o) => o.label).join("; ") || "nenhuma"}`,
    `Score de oportunidade (uso interno): ${lead.score}/100`,
  ];
  if (lead.notes.length > 0) {
    lines.push(`Notas internas registradas: ${lead.notes.map((n) => n.text).join(" | ")}`);
  }
  if (settings?.services) lines.push(`Serviços do prestador: ${settings.services}`);
  if (settings?.differentiator) lines.push(`Diferencial do prestador: ${settings.differentiator}`);
  return lines.join("\n");
}

function buildHeuristicBriefing(lead: Lead): string {
  const oportunidades = lead.opportunities.length > 0
    ? lead.opportunities.map((o) => `- ${o.label}`).join("\n")
    : "- Nenhuma oportunidade específica registrada.";

  return [
    `Empresa: ${lead.name}`,
    `Segmento: ${lead.category}`,
    `Localização: ${lead.city}/${lead.state}`,
    `Presença atual: site ${lead.website ? "encontrado" : "não encontrado"}; Instagram ${lead.instagram ? "encontrado" : "não encontrado"}.`,
    `Principais oportunidades:\n${oportunidades}`,
    `Objetivo provável: melhorar a presença digital para gerar mais contatos qualificados (inferência com base nas oportunidades acima — validar com o lead).`,
    `Necessidades identificadas: ${lead.aiAnalysis ?? "análise não disponível — gere a análise do lead primeiro."}`,
    `Sugestão de próximos passos: agendar uma conversa inicial para validar as oportunidades identificadas antes de estruturar uma proposta.`,
    "",
    "(Briefing gerado por regras — IA não configurada. Revise antes de usar.)",
  ].join("\n\n");
}
