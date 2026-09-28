import type { WebsiteAnalysis } from "@/types/lead";

const FETCH_TIMEOUT_MS = 8000;
const CTA_KEYWORDS = [
  "agende",
  "agendar",
  "marque",
  "fale conosco",
  "entre em contato",
  "whatsapp",
  "solicite",
  "peça um orçamento",
  "orçamento",
  "ligue",
  "reserve",
  "contate-nos",
  "saiba mais",
];

/**
 * inspectWebsite — ferramenta real, sem necessidade de API externa.
 *
 * Faz uma requisição HTTP ao site informado e extrai sinais objetivos
 * (status, HTTPS, título, meta description, viewport, indícios de CTA).
 * Nunca afirma algo que não pôde ser verificado: campos ficam `null` quando
 * a verificação não é possível.
 */
export async function inspectWebsite(rawUrl: string | null): Promise<WebsiteAnalysis> {
  const checkedAt = new Date().toISOString();

  if (!rawUrl) {
    return {
      status: "NAO_ENCONTRADO",
      hasHttps: null,
      title: null,
      metaDescription: null,
      hasViewportMeta: null,
      hasCallToAction: null,
      statusCode: null,
      responseTimeMs: null,
      notes: ["Nenhum site foi identificado para este negócio."],
      checkedAt,
    };
  }

  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
  const notes: string[] = [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ProspectAI/1.0; +https://prospect-ai.local)",
      },
    });
    const responseTimeMs = Date.now() - startedAt;

    if (!response.ok) {
      notes.push(`O site respondeu com status HTTP ${response.status}.`);
      return {
        status: "INACESSIVEL",
        hasHttps: response.url.startsWith("https://"),
        title: null,
        metaDescription: null,
        hasViewportMeta: null,
        hasCallToAction: null,
        statusCode: response.status,
        responseTimeMs,
        notes,
        checkedAt,
      };
    }

    const html = await response.text();
    const title = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const metaDescription = extractAttr(
      html,
      /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i
    );
    const hasViewportMeta = /<meta\s+name=["']viewport["']/i.test(html);
    const lowerHtml = html.toLowerCase();
    const hasCallToAction = CTA_KEYWORDS.some((kw) => lowerHtml.includes(kw));

    if (!title) notes.push("Não foi possível identificar um título na página.");
    if (!hasViewportMeta)
      notes.push("Não foi encontrada meta tag de viewport (indício de falta de otimização mobile).");
    if (!hasCallToAction)
      notes.push("Não foram encontradas chamadas para ação claras no conteúdo verificado.");

    return {
      status: "ACESSIVEL",
      hasHttps: response.url.startsWith("https://"),
      title,
      metaDescription,
      hasViewportMeta,
      hasCallToAction,
      statusCode: response.status,
      responseTimeMs,
      notes,
      checkedAt,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startedAt;
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Tempo limite excedido ao tentar acessar o site."
        : "Não foi possível acessar o site (site fora do ar, domínio inválido ou bloqueio de rede).";
    return {
      status: "INACESSIVEL",
      hasHttps: null,
      title: null,
      metaDescription: null,
      hasViewportMeta: null,
      hasCallToAction: null,
      statusCode: null,
      responseTimeMs,
      notes: [message],
      checkedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractTag(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? decodeHtmlEntities(match[1].trim()).slice(0, 200) : null;
}

function extractAttr(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? decodeHtmlEntities(match[1].trim()).slice(0, 300) : null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
