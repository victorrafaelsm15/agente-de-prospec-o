import { callClaude } from "@/lib/ai/anthropicClient";
import { isAnthropicConfigured } from "@/lib/env";

export interface RefineProposalTextResult {
  text: string;
  aiGenerated: boolean;
}

const SYSTEM_PROMPT = `Você edita um trecho de texto de uma proposta comercial, em português do
Brasil, seguindo EXATAMENTE a instrução do usuário.

Regras obrigatórias:
- Edite APENAS o conteúdo do texto — nunca adicione preços, prazos,
  condições de pagamento ou qualquer dado numérico que não estava no texto
  original, mesmo que a instrução peça para "deixar mais completo".
- Nunca invente depoimentos, clientes, resultados, garantias, certificações
  ou funcionalidades não mencionadas no texto original.
- Responda APENAS com o texto revisado, sem aspas, sem explicações, sem
  markdown.`;

export async function refineProposalText(
  originalText: string,
  instruction: string
): Promise<RefineProposalTextResult> {
  if (!originalText.trim()) {
    return { text: originalText, aiGenerated: false };
  }

  if (isAnthropicConfigured) {
    try {
      const prompt = `Texto original:\n"""${originalText}"""\n\nInstrução: ${instruction}`;
      const revised = await callClaude({ system: SYSTEM_PROMPT, prompt, maxTokens: 600 });
      if (revised) return { text: revised, aiGenerated: true };
    } catch {
      // sem fallback heurístico sensato para "refinar" — devolve o original
    }
  }

  return { text: originalText, aiGenerated: false };
}
