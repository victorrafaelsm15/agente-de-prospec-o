import { callClaude } from "@/lib/ai/anthropicClient";
import { isAnthropicConfigured } from "@/lib/env";
import type { Lead } from "@/types/lead";

export interface SummarizeLeadResult {
  summary: string;
  aiGenerated: boolean;
}

const SYSTEM_PROMPT = `Resuma o lead abaixo em UMA frase curta (até 30 palavras), em português,
que possa ser lida em poucos segundos. Use estritamente os fatos fornecidos.
Responda apenas com a frase, sem aspas.`;

export async function summarizeLead(lead: Lead): Promise<SummarizeLeadResult> {
  if (isAnthropicConfigured) {
    try {
      const prompt = [
        `Empresa: ${lead.name}, ${lead.category} em ${lead.city}/${lead.state}.`,
        `Site: ${lead.website ? "possui" : "não encontrado"}. Instagram: ${lead.instagram ? "possui" : "não encontrado"}.`,
        `Principais oportunidades: ${lead.opportunities.map((o) => o.label).join("; ") || "nenhuma"}.`,
        `Score: ${lead.score}/100 (${lead.priority}).`,
      ].join("\n");
      const summary = await callClaude({ system: SYSTEM_PROMPT, prompt, maxTokens: 100 });
      if (summary) return { summary, aiGenerated: true };
    } catch {
      // cai para o fallback heurístico abaixo
    }
  }

  return { summary: buildHeuristicSummary(lead), aiGenerated: false };
}

function buildHeuristicSummary(lead: Lead): string {
  const siteText = lead.website ? "com site" : "sem site identificado";
  const igText = lead.instagram ? "com Instagram ativo" : "sem Instagram identificado";
  return `${lead.category} em ${lead.city}/${lead.state}, ${siteText} e ${igText}. Score de oportunidade: ${lead.score}/100 (${lead.priority.toLowerCase()}).`;
}
