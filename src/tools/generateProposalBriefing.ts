import { callClaude } from "@/lib/ai/anthropicClient";
import { isAnthropicConfigured } from "@/lib/env";
import type { Lead } from "@/types/lead";
import type { ProposalBriefing } from "@/types/proposal";

export interface GenerateProposalBriefingResult {
  briefing: ProposalBriefing;
  aiGenerated: boolean;
}

const SYSTEM_PROMPT = `Você organiza um briefing comercial estruturado a partir dos dados reais
de um lead, em português do Brasil. Responda APENAS com um JSON válido no
formato abaixo, sem texto adicional, sem markdown:

{
  "cliente": { "empresa": "", "responsavel": "", "segmento": "", "localizacao": "", "contatos": "" },
  "projeto": { "objetivo": "", "problemaAtual": "", "publicoAlvo": "", "necessidades": "", "servicosDesejados": "", "referencias": "", "funcionalidades": "", "observacoes": "" },
  "presencaAtual": { "site": "", "instagram": "", "outrosCanais": "", "principaisProblemas": "" }
}

Regras obrigatórias:
- Use ESTRITAMENTE os fatos fornecidos. Nunca invente responsável, telefone,
  referências, funcionalidades desejadas ou qualquer dado não fornecido.
- Quando um campo não tiver informação disponível, deixe-o como string vazia
  "" — nunca invente para preencher.
- "objetivo", "problemaAtual" e "necessidades" podem ser inferências razoáveis
  a partir da análise e das oportunidades já identificadas, mas devem soar
  como uma hipótese a validar, não uma afirmação categórica.`;

export async function generateProposalBriefing(lead: Lead): Promise<GenerateProposalBriefingResult> {
  if (isAnthropicConfigured) {
    try {
      const prompt = buildPrompt(lead);
      const raw = await callClaude({ system: SYSTEM_PROMPT, prompt, maxTokens: 700 });
      const parsed = parseJson(raw);
      if (parsed) return { briefing: parsed, aiGenerated: true };
    } catch {
      // cai para o fallback heurístico abaixo
    }
  }

  return { briefing: buildHeuristicBriefing(lead), aiGenerated: false };
}

function buildPrompt(lead: Lead): string {
  return [
    `Empresa: ${lead.name}`,
    `Segmento: ${lead.category}`,
    `Localização: ${lead.city}/${lead.state}`,
    `Telefone: ${lead.phone ?? "não encontrado"}`,
    `Site: ${lead.website ?? "não encontrado"}`,
    `Instagram: ${lead.instagram ?? "não encontrado"}`,
    `WhatsApp: ${lead.whatsapp ?? "não encontrado"}`,
    `E-mail: ${lead.email ?? "não encontrado"}`,
    `Análise já realizada: ${lead.aiAnalysis ?? "não disponível"}`,
    `Oportunidades identificadas: ${lead.opportunities.map((o) => o.label).join("; ") || "nenhuma"}`,
    `Briefing anterior (se houver): ${lead.briefing ?? "nenhum"}`,
    `Notas internas: ${lead.notes.map((n) => n.text).join(" | ") || "nenhuma"}`,
  ].join("\n");
}

function parseJson(raw: string): ProposalBriefing | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as ProposalBriefing;
  } catch {
    return null;
  }
}

function buildHeuristicBriefing(lead: Lead): ProposalBriefing {
  return {
    cliente: {
      empresa: lead.name,
      responsavel: "",
      segmento: lead.category,
      localizacao: `${lead.city}/${lead.state}`,
      contatos: [lead.phone, lead.whatsapp, lead.email].filter(Boolean).join(" · "),
    },
    projeto: {
      objetivo: "A confirmar com o cliente.",
      problemaAtual: lead.aiAnalysis ?? "",
      publicoAlvo: "",
      necessidades: lead.opportunities.map((o) => o.label).join("; "),
      servicosDesejados: "",
      referencias: "",
      funcionalidades: "",
      observacoes: "Briefing gerado por regras (IA não configurada) — revisar antes de usar.",
    },
    presencaAtual: {
      site: lead.website ?? "Não encontrado",
      instagram: lead.instagram ?? "Não encontrado",
      outrosCanais: "",
      principaisProblemas: lead.opportunities.map((o) => o.label).join("; "),
    },
  };
}
