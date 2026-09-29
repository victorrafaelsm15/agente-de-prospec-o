import { callClaude } from "@/lib/ai/anthropicClient";
import { isAnthropicConfigured } from "@/lib/env";
import type { Service } from "@/types/proposal";

export interface SuggestedScopeItem {
  name: string;
  description: string;
  quantity: number;
  /** Preço sugerido apenas quando corresponde a um serviço do catálogo — nunca inventado. */
  suggestedUnitPrice: number | null;
  matchedServiceId: string | null;
}

export interface GenerateScopeSuggestionResult {
  items: SuggestedScopeItem[];
  aiGenerated: boolean;
}

const SYSTEM_PROMPT = `Você transforma uma descrição livre do que o usuário quer entregar em uma
lista estruturada de itens de escopo, em português do Brasil. Responda
APENAS com um JSON válido no formato:

{ "items": [ { "name": "", "description": "", "quantity": 1 } ] }

Regras obrigatórias:
- Extraia itens concretos de escopo (páginas, funcionalidades, serviços)
  mencionados na descrição do usuário — não invente itens que ele não pediu.
- Quando a lista de serviços do catálogo do usuário for fornecida, prefira
  nomes de itens consistentes com esse catálogo (mas não invente preços).
- NUNCA inclua preços — isso é decidido pelo usuário depois. NUNCA inclua a
  chave "price" ou qualquer valor monetário no JSON.
- Máximo 12 itens.`;

export async function generateScopeSuggestion(
  description: string,
  catalog: Service[]
): Promise<GenerateScopeSuggestionResult> {
  if (isAnthropicConfigured) {
    try {
      const prompt = buildPrompt(description, catalog);
      const raw = await callClaude({ system: SYSTEM_PROMPT, prompt, maxTokens: 700 });
      const parsed = parseJson(raw);
      if (parsed) {
        return { items: matchAgainstCatalog(parsed, catalog), aiGenerated: true };
      }
    } catch {
      // cai para o fallback heurístico abaixo
    }
  }

  return { items: buildHeuristicSuggestion(description, catalog), aiGenerated: false };
}

function buildPrompt(description: string, catalog: Service[]): string {
  const catalogText = catalog.length > 0
    ? catalog.map((s) => `- ${s.name}${s.description ? `: ${s.description}` : ""}`).join("\n")
    : "Nenhum serviço cadastrado no catálogo.";
  return `Descrição do usuário: "${description}"\n\nCatálogo de serviços do usuário:\n${catalogText}`;
}

function parseJson(raw: string): { name: string; description: string; quantity: number }[] | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as { items?: { name: string; description: string; quantity: number }[] };
    return parsed.items ?? null;
  } catch {
    return null;
  }
}

function matchAgainstCatalog(
  items: { name: string; description: string; quantity: number }[],
  catalog: Service[]
): SuggestedScopeItem[] {
  return items.slice(0, 12).map((item) => {
    const matched = catalog.find((s) => s.name.toLowerCase() === item.name.toLowerCase());
    return {
      name: item.name,
      description: item.description ?? "",
      quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
      suggestedUnitPrice: matched?.defaultPrice ?? null,
      matchedServiceId: matched?.id ?? null,
    };
  });
}

function buildHeuristicSuggestion(description: string, catalog: Service[]): SuggestedScopeItem[] {
  const lowerDesc = description.toLowerCase();
  const matches = catalog.filter((s) => lowerDesc.includes(s.name.toLowerCase()));

  if (matches.length > 0) {
    return matches.map((s) => ({
      name: s.name,
      description: s.description ?? "",
      quantity: 1,
      suggestedUnitPrice: s.defaultPrice,
      matchedServiceId: s.id,
    }));
  }

  return [
    {
      name: "Item de escopo (revisar)",
      description: `Sugestão automática não disponível (IA não configurada). Descrição original: "${description}"`,
      quantity: 1,
      suggestedUnitPrice: null,
      matchedServiceId: null,
    },
  ];
}
