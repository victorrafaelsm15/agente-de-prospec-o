import { env } from "@/lib/env";

/**
 * Rate limiter simples em memória (token bucket por chave), para proteger
 * endpoints que chamam a API da Anthropic contra uso excessivo/custo
 * inesperado. Como o app não tem múltiplas instâncias long-running nem
 * múltiplos usuários autenticados nesta versão, um bucket em memória do
 * processo é suficiente — ele reseta a cada novo deploy/instância, o que é
 * aceitável para esta proteção de custo, não para segurança crítica.
 */
interface Bucket {
  count: number;
  windowStartedAt: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number = env.aiRateLimitPerMinute): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStartedAt >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.ceil((bucket.windowStartedAt + WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}
