import { callClaude } from "@/lib/ai/anthropicClient";
import { isAnthropicConfigured } from "@/lib/env";
import type { WebsiteFinding } from "@/tools/analyzeWebsite";
import type { BusinessCandidate } from "@/agents/types";
import type { CommercialSettings, OutreachStyle } from "@/types/lead";

export interface GenerateOutreachInput {
  business: BusinessCandidate;
  findings: WebsiteFinding[];
  hasWebsite: boolean;
  style?: OutreachStyle;
  settings?: CommercialSettings | null;
}

export interface GenerateOutreachResult {
  message: string;
  aiGenerated: boolean;
}

const STYLE_INSTRUCTIONS: Record<OutreachStyle, string> = {
  DIRETA: "Estilo DIRETO: frases curtas, vá direto ao ponto, no máximo 3 frases.",
  CONSULTIVA:
    "Estilo CONSULTIVO: foque em identificar uma oportunidade real e faça uma pergunta que convide reflexão, sem parecer venda.",
  CASUAL: "Estilo CASUAL: tom natural e conversacional, como uma mensagem entre conhecidos, sem ser informal demais.",
  PROFISSIONAL: "Estilo PROFISSIONAL: mais formal, cortês, sem gírias.",
};

function buildSystemPrompt(style: OutreachStyle, settings?: CommercialSettings | null): string {
  const businessContext = settings?.businessName
    ? `Você escreve em nome de "${settings.businessName}".`
    : "Você ajuda um profissional freelancer de criação de sites.";
  const servicesContext = settings?.services ? ` Serviços oferecidos: ${settings.services}.` : "";
  const differentiatorContext = settings?.differentiator
    ? ` Diferencial: ${settings.differentiator}.`
    : "";

  return `${businessContext}${servicesContext}${differentiatorContext} Redija uma mensagem
inicial de prospecção, em português do Brasil, para enviar manualmente a um
negócio local.

${STYLE_INSTRUCTIONS[style]}

Regras obrigatórias:
- Use ESTRITAMENTE os fatos fornecidos. Nunca invente elogios, problemas, números
  de seguidores ou qualquer informação não fornecida.
- Máximo 4 frases. Nunca agressivo ou com aparência de spam em massa.
- Não prometa resultados. Não use emojis em excesso (no máximo 1).
- Termine com uma pergunta aberta e de baixa fricção, não com uma cobrança.
- Responda apenas com o texto da mensagem, sem aspas, sem explicações.`;
}

export async function generateOutreachMessage(
  input: GenerateOutreachInput
): Promise<GenerateOutreachResult> {
  const style = input.style ?? "CONSULTIVA";

  if (isAnthropicConfigured) {
    try {
      const prompt = buildPrompt(input);
      const message = await callClaude({
        system: buildSystemPrompt(style, input.settings),
        prompt,
        maxTokens: 250,
      });
      if (message) return { message, aiGenerated: true };
    } catch {
      // cai para o fallback heurístico abaixo
    }
  }

  return { message: buildHeuristicMessage(input, style), aiGenerated: false };
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

function buildHeuristicMessage(input: GenerateOutreachInput, style: OutreachStyle): string {
  const { business, hasWebsite } = input;

  if (style === "DIRETA") {
    if (!hasWebsite) {
      return `Olá! Notei que o ${business.name} não tem site próprio. Trabalho com criação de sites — tem interesse em conversar sobre isso?`;
    }
    return `Olá! Vi o ${business.name} e trabalho com criação/redesign de sites. Podemos conversar rapidamente sobre a presença digital de vocês?`;
  }

  if (style === "PROFISSIONAL") {
    if (!hasWebsite) {
      return `Prezados, encontrei o ${business.name} durante uma pesquisa sobre ${business.category.toLowerCase()} em ${business.city} e notei que não há um site institucional. Trabalho com criação de sites profissionais e gostaria de entender se haveria interesse em uma conversa sobre o tema.`;
    }
    return `Prezados, encontrei o ${business.name} durante uma pesquisa sobre ${business.category.toLowerCase()} em ${business.city}. Trabalho com criação e redesign de sites e gostaria de entender melhor a presença digital atual de vocês, caso haja interesse em conversar.`;
  }

  const greeting = `Olá! Tudo bem? Encontrei o ${business.name} pesquisando negócios de ${business.category.toLowerCase()} em ${business.city}.`;

  if (!hasWebsite && business.instagram) {
    return `${greeting} Vi a presença de vocês no Instagram, mas não encontrei um site oficial — vocês têm interesse em ter um site próprio para reforçar essa presença online? Posso mostrar algumas ideias sem compromisso.`;
  }

  if (!hasWebsite) {
    return `${greeting} Não encontrei um site oficial do negócio — vocês já pensaram em ter um site próprio? Posso compartilhar algumas ideias sem compromisso.`;
  }

  return `${greeting} Trabalho com criação e redesign de sites e gostaria de entender melhor como está a presença digital de vocês hoje. Fico à disposição caso faça sentido conversarmos.`;
}
