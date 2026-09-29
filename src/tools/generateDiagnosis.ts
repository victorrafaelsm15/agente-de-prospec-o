import { callClaude } from "@/lib/ai/anthropicClient";
import { isAnthropicConfigured } from "@/lib/env";
import type { Lead } from "@/types/lead";
import type { ProposalBriefing, ProposalDiagnosis } from "@/types/proposal";

export interface GenerateDiagnosisResult {
  diagnosis: ProposalDiagnosis;
  aiGenerated: boolean;
}

const SYSTEM_PROMPT = `Você redige o diagnóstico comercial de uma proposta, em português do
Brasil, com base nos dados reais de um lead e no briefing já preenchido.
Responda APENAS com um JSON válido, sem markdown:

{ "situacaoAtual": "...", "oportunidades": "...", "solucaoProposta": "..." }

Regras obrigatórias:
- "situacaoAtual": descreva o que foi identificado (site, redes sociais,
  problemas encontrados) — só fatos verificados.
- "oportunidades": o que pode ser melhorado, com base nas oportunidades já
  calculadas pelo sistema — não invente novas oportunidades sem base.
- "solucaoProposta": como o serviço do prestador pode resolver os problemas
  — genérico o suficiente para não prometer funcionalidades específicas que
  ainda não foram definidas no escopo.
- Tom profissional. Cada campo com 2-4 frases. Nunca invente depoimentos,
  números de clientes, resultados, garantias ou certificações.`;

export async function generateDiagnosis(
  lead: Lead,
  briefing: ProposalBriefing,
  servicesOffered?: string | null
): Promise<GenerateDiagnosisResult> {
  if (isAnthropicConfigured) {
    try {
      const prompt = buildPrompt(lead, briefing, servicesOffered);
      const raw = await callClaude({ system: SYSTEM_PROMPT, prompt, maxTokens: 500 });
      const parsed = parseJson(raw);
      if (parsed) return { diagnosis: parsed, aiGenerated: true };
    } catch {
      // cai para o fallback heurístico abaixo
    }
  }

  return { diagnosis: buildHeuristicDiagnosis(lead), aiGenerated: false };
}

function buildPrompt(lead: Lead, briefing: ProposalBriefing, servicesOffered?: string | null): string {
  return [
    `Empresa: ${lead.name} (${lead.category}, ${lead.city}/${lead.state})`,
    `Site: ${lead.website ?? "não encontrado"}`,
    `Análise técnica já realizada: ${lead.aiAnalysis ?? "não disponível"}`,
    `Oportunidades identificadas pelo sistema: ${lead.opportunities.map((o) => o.label).join("; ") || "nenhuma"}`,
    `Briefing - problema atual: ${briefing.projeto?.problemaAtual ?? "não informado"}`,
    `Briefing - necessidades: ${briefing.projeto?.necessidades ?? "não informado"}`,
    servicesOffered ? `Serviços oferecidos pelo prestador: ${servicesOffered}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function parseJson(raw: string): ProposalDiagnosis | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as ProposalDiagnosis;
  } catch {
    return null;
  }
}

function buildHeuristicDiagnosis(lead: Lead): ProposalDiagnosis {
  return {
    situacaoAtual:
      lead.aiAnalysis ??
      `${lead.name} atua em ${lead.category.toLowerCase()} em ${lead.city}/${lead.state}. ${
        lead.website ? "Possui site próprio identificado." : "Não foi identificado site próprio."
      }`,
    oportunidades:
      lead.opportunities.length > 0
        ? lead.opportunities.map((o) => o.label).join("; ")
        : "Nenhuma oportunidade específica identificada até o momento.",
    solucaoProposta:
      "Proposta de desenvolvimento/melhoria da presença digital, estruturada de acordo com o escopo detalhado abaixo, com foco em resolver os pontos identificados na análise. (Texto gerado por regras — IA não configurada.)",
  };
}
