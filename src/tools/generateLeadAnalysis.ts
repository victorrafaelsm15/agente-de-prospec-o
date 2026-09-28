import { callClaude } from "@/lib/ai/anthropicClient";
import { isAnthropicConfigured } from "@/lib/env";
import type { WebsiteFinding } from "@/tools/analyzeWebsite";
import type { BusinessCandidate } from "@/agents/types";
import type { Opportunity } from "@/types/lead";

export interface GenerateAnalysisInput {
  business: BusinessCandidate;
  findings: WebsiteFinding[];
  opportunities: Opportunity[];
  score: number;
}

export interface GenerateAnalysisResult {
  analysis: string;
  aiGenerated: boolean;
}

const SYSTEM_PROMPT = `Você ajuda um profissional de criação de sites a triar leads.
Escreva uma análise curta (3 a 5 frases), em português, resumindo a situação de
presença digital de um negócio, com base ESTRITAMENTE nos fatos fornecidos.

Regras obrigatórias:
- NUNCA invente informações que não estejam nos fatos fornecidos.
- Se um dado não foi verificado, não afirme nada sobre ele.
- Seja objetivo, profissional e neutro — não use linguagem de venda agressiva.
- Não use a palavra "ruim" ou julgamentos definitivos; fale em termos de oportunidade.
- Responda apenas com o texto da análise, sem títulos ou marcadores.`;

export async function generateLeadAnalysis(
  input: GenerateAnalysisInput
): Promise<GenerateAnalysisResult> {
  if (isAnthropicConfigured) {
    try {
      const prompt = buildPrompt(input);
      const analysis = await callClaude({ system: SYSTEM_PROMPT, prompt, maxTokens: 300 });
      if (analysis) return { analysis, aiGenerated: true };
    } catch {
      // cai para o fallback heurístico abaixo
    }
  }

  return { analysis: buildHeuristicAnalysis(input), aiGenerated: false };
}

function buildPrompt(input: GenerateAnalysisInput): string {
  const { business, findings, opportunities, score } = input;
  return [
    `Negócio: ${business.name}`,
    `Categoria: ${business.category}`,
    `Cidade/Estado: ${business.city}/${business.state}`,
    `Site: ${business.website ?? "não encontrado"}`,
    `Instagram: ${business.instagram ?? "não encontrado"}`,
    `Achados sobre o site: ${findings.map((f) => f.label).join(" ") || "nenhum"}`,
    `Oportunidades identificadas: ${opportunities.map((o) => o.label).join("; ") || "nenhuma"}`,
    `Score de oportunidade (0-100, uso interno de triagem): ${score}`,
  ].join("\n");
}

function buildHeuristicAnalysis(input: GenerateAnalysisInput): string {
  const { business, findings, opportunities } = input;
  const parts: string[] = [];

  parts.push(
    `${business.name} atua como ${business.category.toLowerCase()} em ${business.city}/${business.state}.`
  );

  const findingsText = findings.map((f) => f.label).join(" ");
  if (findingsText) parts.push(findingsText);

  if (opportunities.length > 0) {
    parts.push(
      `Principais pontos de oportunidade identificados: ${opportunities
        .map((o) => o.label.toLowerCase())
        .join("; ")}.`
    );
  } else {
    parts.push("Não foram identificados pontos de oportunidade relevantes com os dados disponíveis.");
  }

  parts.push(
    "Esta análise é gerada automaticamente por regras (IA não configurada) e deve ser validada manualmente antes do contato."
  );

  return parts.join(" ");
}
