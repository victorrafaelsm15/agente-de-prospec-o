import { callClaude } from "@/lib/ai/anthropicClient";
import { isAnthropicConfigured } from "@/lib/env";
import type { WebsiteFinding } from "@/tools/analyzeWebsite";
import type { BusinessCandidate } from "@/agents/types";

export interface GenerateOutreachInput {
  business: BusinessCandidate;
  findings: WebsiteFinding[];
  hasWebsite: boolean;
}

export interface GenerateOutreachResult {
  message: string;
  aiGenerated: boolean;
}

const SYSTEM_PROMPT = `Você ajuda um profissional freelancer de criação de sites a redigir uma
mensagem inicial de prospecção, em português do Brasil, para enviar manualmente
(WhatsApp ou Instagram) a um negócio local.

Regras obrigatórias:
- Use ESTRITAMENTE os fatos fornecidos. Nunca invente elogios, problemas, números
  de seguidores ou qualquer informação não fornecida.
- Tom humano, curto (máximo 4 frases), profissional, natural — nunca agressivo
  ou com aparência de spam em massa.
- Não prometa resultados. Não use emojis em excesso (no máximo 1).
- Termine com uma pergunta aberta e de baixa fricção, não com uma cobrança.
- Responda apenas com o texto da mensagem, sem aspas, sem explicações.`;

export async function generateOutreachMessage(
  input: GenerateOutreachInput
): Promise<GenerateOutreachResult> {
  if (isAnthropicConfigured) {
    try {
      const prompt = buildPrompt(input);
      const message = await callClaude({ system: SYSTEM_PROMPT, prompt, maxTokens: 250 });
      if (message) return { message, aiGenerated: true };
    } catch {
      // cai para o fallback heurístico abaixo
    }
  }

  return { message: buildHeuristicMessage(input), aiGenerated: false };
}

function buildPrompt(input: GenerateOutreachInput): string {
  const { business, findings, hasWebsite } = input;
  return [
    `Negócio: ${business.name}`,
    `Categoria: ${business.category}`,
    `Cidade: ${business.city}`,
    `Possui site: ${hasWebsite ? "sim" : "não"}`,
    `Instagram encontrado: ${business.instagram ?? "não encontrado"}`,
    `Achados sobre o site: ${findings.map((f) => f.label).join(" ") || "nenhum"}`,
  ].join("\n");
}

function buildHeuristicMessage(input: GenerateOutreachInput): string {
  const { business, hasWebsite } = input;
  const greeting = `Olá! Tudo bem? Encontrei o ${business.name} pesquisando negócios de ${business.category.toLowerCase()} em ${business.city}.`;

  if (!hasWebsite && business.instagram) {
    return `${greeting} Vi a presença de vocês no Instagram, mas não encontrei um site oficial — vocês têm interesse em ter um site próprio para reforçar essa presença online? Posso mostrar algumas ideias sem compromisso.`;
  }

  if (!hasWebsite) {
    return `${greeting} Não encontrei um site oficial do negócio — vocês já pensaram em ter um site próprio? Posso compartilhar algumas ideias sem compromisso.`;
  }

  return `${greeting} Trabalho com criação e redesign de sites e gostaria de entender melhor como está a presença digital de vocês hoje. Fico à disposição caso faça sentido conversarmos.`;
}
