import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env, isAnthropicConfigured } from "@/lib/env";

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: env.anthropicApiKey });
  }
  return cachedClient;
}

/**
 * Chama o modelo Claude com um prompt de sistema + usuário e retorna texto
 * puro. Lança erro se ANTHROPIC_API_KEY não estiver configurada — quem
 * chama esta função deve tratar isso e usar um fallback heurístico.
 */
export async function callClaude(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  if (!isAnthropicConfigured) {
    throw new Error("ANTHROPIC_API_KEY não configurada.");
  }

  const client = getClient();
  const response = await client.messages.create({
    model: env.anthropicModel,
    max_tokens: params.maxTokens ?? 500,
    system: params.system,
    messages: [{ role: "user", content: params.prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text.trim() : "";
}
