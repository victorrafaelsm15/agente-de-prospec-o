import { callClaude } from "@/lib/ai/anthropicClient";
import { isAnthropicConfigured } from "@/lib/env";
import type { WebsiteFinding } from "@/tools/analyzeWebsite";
import type { BusinessCandidate } from "@/agents/types";
import type { CommercialSettings, OutreachStyle } from "@/types/lead";

export interface GenerateEmailInput {
  business: BusinessCandidate;
  findings: WebsiteFinding[];
  hasWebsite: boolean;
  style?: OutreachStyle;
  settings?: CommercialSettings | null;
}

export interface GenerateEmailResult {
  subject: string;
  body: string;
  aiGenerated: boolean;
}

const SYSTEM_PROMPT = `Você redige e-mails curtos de prospecção B2B em português do Brasil.
Gere um ASSUNTO (uma linha, sem emojis) e um CORPO (3 a 5 frases, com uma
chamada para ação clara no final, ex.: sugerir uma breve conversa).

Regras obrigatórias:
- Use ESTRITAMENTE os fatos fornecidos. Nunca invente elogios, problemas ou
  qualquer informação não fornecida.
- Nunca prometa resultados. Tom profissional e respeitoso.
- NÃO inclua saudação de abertura tipo "Olá, [Nome]" nem assinatura final —
  isso é adicionado separadamente.
- Responda EXATAMENTE no formato:
ASSUNTO: <assunto aqui>
CORPO: <corpo aqui>`;

export async function generateEmailMessage(input: GenerateEmailInput): Promise<GenerateEmailResult> {
  if (isAnthropicConfigured) {
    try {
      const prompt = buildPrompt(input);
      const raw = await callClaude({ system: SYSTEM_PROMPT, prompt, maxTokens: 350 });
      const parsed = parseResponse(raw);
      if (parsed) {
        return { ...parsed, body: appendSignature(parsed.body, input.settings), aiGenerated: true };
      }
    } catch {
      // cai para o fallback heurístico abaixo
    }
  }

  const fallback = buildHeuristicEmail(input);
  return { ...fallback, body: appendSignature(fallback.body, input.settings), aiGenerated: false };
}

function buildPrompt(input: GenerateEmailInput): string {
  const { business, findings, hasWebsite } = input;
  return [
    `Negócio: ${business.name}`,
    `Categoria: ${business.category}`,
    `Cidade: ${business.city}`,
    `Possui site: ${hasWebsite ? "sim" : "não"}`,
    `Achados sobre o site: ${findings.map((f) => f.label).join(" ") || "nenhum"}`,
  ].join("\n");
}

function parseResponse(raw: string): { subject: string; body: string } | null {
  const subjectMatch = raw.match(/ASSUNTO:\s*(.+)/i);
  const bodyMatch = raw.match(/CORPO:\s*([\s\S]+)/i);
  if (!subjectMatch || !bodyMatch) return null;
  return { subject: subjectMatch[1].trim(), body: bodyMatch[1].trim() };
}

function appendSignature(body: string, settings?: CommercialSettings | null): string {
  if (!settings?.emailSignature) return body;
  return `${body}\n\n${settings.emailSignature}`;
}

function buildHeuristicEmail(input: GenerateEmailInput): { subject: string; body: string } {
  const { business, hasWebsite } = input;

  if (!hasWebsite) {
    return {
      subject: `Uma ideia para a presença digital do ${business.name}`,
      body: `Olá, encontrei o ${business.name} durante uma pesquisa sobre ${business.category.toLowerCase()} em ${business.city} e notei que não há um site institucional cadastrado.\n\nTrabalho com criação de sites profissionais e gostaria de entender se haveria interesse em uma conversa rápida sobre o tema.\n\nFico à disposição.`,
    };
  }

  return {
    subject: `Uma ideia para a presença digital do ${business.name}`,
    body: `Olá, encontrei o ${business.name} durante uma pesquisa sobre ${business.category.toLowerCase()} em ${business.city}.\n\nTrabalho com criação e redesign de sites e gostaria de entender melhor a presença digital atual de vocês, caso haja interesse em conversar.\n\nFico à disposição.`,
  };
}
