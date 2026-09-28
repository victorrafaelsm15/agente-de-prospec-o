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

const INSTAGRAM_NON_HANDLE_PATHS = new Set([
  "p",
  "reel",
  "reels",
  "explore",
  "accounts",
  "tv",
  "stories",
  "directory",
  "about",
  "developer",
  "web",
  "static",
  "rsrc.php",
  "graphql",
  "api",
  "embed.js",
  "login",
  "signup",
  "challenge",
  "legal",
  "privacy",
  "terms",
  "help",
]);

function isPlausibleInstagramHandle(handle: string): boolean {
  if (!handle || handle.length > 30) return false;
  if (INSTAGRAM_NON_HANDLE_PATHS.has(handle.toLowerCase())) return false;
  // Recursos estáticos (rsrc.php, script.js, style.css, etc.) nunca são handles.
  if (/\.(php|js|css|png|jpg|jpeg|svg|json|ico)$/i.test(handle)) return false;
  return /^[a-zA-Z0-9_.]+$/.test(handle);
}

export interface InspectWebsiteResult {
  analysis: WebsiteAnalysis;
  /** Número de WhatsApp encontrado em um link wa.me/whatsapp.com real no site (ou null). */
  extractedWhatsapp: string | null;
  /** E-mail encontrado em um link mailto: real no site (ou null). */
  extractedEmail: string | null;
  /** Perfil do Instagram encontrado em um link real no site (ou null). */
  extractedInstagram: string | null;
}

function emptyAnalysis(status: WebsiteAnalysis["status"], notes: string[]): WebsiteAnalysis {
  return {
    status,
    hasHttps: null,
    title: null,
    metaDescription: null,
    hasViewportMeta: null,
    hasCallToAction: null,
    statusCode: null,
    responseTimeMs: null,
    h1Count: null,
    wordCount: null,
    hasPhoneLink: null,
    hasWhatsappLink: null,
    hasEmailLink: null,
    notes,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * inspectWebsite — ferramenta real, sem necessidade de API externa.
 *
 * Faz uma requisição HTTP ao site informado e extrai sinais objetivos
 * (status, HTTPS, título, meta description, viewport, indícios de CTA,
 * estrutura de headings, presença de links de telefone/WhatsApp/e-mail).
 * Nunca afirma algo que não pôde ser verificado: campos ficam `null` quando
 * a verificação não é possível, e nunca inventa avaliações de design/UX que
 * exigiriam renderização visual — só sinais extraíveis do HTML puro.
 */
export async function inspectWebsite(rawUrl: string | null): Promise<InspectWebsiteResult> {
  if (!rawUrl) {
    return {
      analysis: emptyAnalysis("NAO_ENCONTRADO", [
        "Nenhum site foi identificado para este negócio.",
      ]),
      extractedWhatsapp: null,
      extractedEmail: null,
      extractedInstagram: null,
    };
  }

  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
  const checkedAt = new Date().toISOString();
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
        analysis: {
          ...emptyAnalysis("INACESSIVEL", notes),
          hasHttps: response.url.startsWith("https://"),
          statusCode: response.status,
          responseTimeMs,
          checkedAt,
        },
        extractedWhatsapp: null,
        extractedEmail: null,
        extractedInstagram: null,
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

    const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
    const wordCount = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;

    const hasPhoneLink = /href=["']tel:/i.test(html);

    const whatsappMatch =
      html.match(/(?:api\.)?whatsapp\.com\/send\?phone=(\d{8,15})/i) ??
      html.match(/wa\.me\/(\d{8,15})/i);
    const hasWhatsappLink = Boolean(whatsappMatch);

    const emailMatch = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    const hasEmailLink = Boolean(emailMatch);

    const extractedInstagram = extractInstagramHandle(html);

    if (!title) notes.push("Não foi possível identificar um título na página.");
    if (!hasViewportMeta)
      notes.push("Não foi encontrada meta tag de viewport (indício de falta de otimização mobile).");
    if (!hasCallToAction)
      notes.push("Não foram encontradas chamadas para ação claras no conteúdo verificado.");
    if (h1Count === 0) notes.push("A página não possui nenhum heading H1 (indício de SEO básico fraco).");
    if (h1Count > 1) notes.push(`A página possui ${h1Count} headings H1 (o recomendado é apenas 1).`);

    return {
      analysis: {
        status: "ACESSIVEL",
        hasHttps: response.url.startsWith("https://"),
        title,
        metaDescription,
        hasViewportMeta,
        hasCallToAction,
        statusCode: response.status,
        responseTimeMs,
        h1Count,
        wordCount,
        hasPhoneLink,
        hasWhatsappLink,
        hasEmailLink,
        notes,
        checkedAt,
      },
      extractedWhatsapp: whatsappMatch ? whatsappMatch[1] : null,
      extractedEmail: emailMatch ? emailMatch[1] : null,
      extractedInstagram,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startedAt;
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Tempo limite excedido ao tentar acessar o site."
        : "Não foi possível acessar o site (site fora do ar, domínio inválido ou bloqueio de rede).";
    return {
      analysis: { ...emptyAnalysis("INACESSIVEL", [message]), responseTimeMs, checkedAt },
      extractedWhatsapp: null,
      extractedEmail: null,
      extractedInstagram: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractInstagramHandle(html: string): string | null {
  // Prioriza a identidade canônica da própria página (muito mais confiável
  // do que qualquer link instagram.com encontrado no meio do HTML, que pode
  // apontar para recursos estáticos, JS/CSS ou outras contas).
  const canonicalMatch =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?["']/i) ??
    html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?["']/i);
  if (canonicalMatch) {
    const handle = canonicalMatch[1].replace(/\.$/, "");
    if (isPlausibleInstagramHandle(handle)) return handle;
  }

  const regex = /instagram\.com\/([a-zA-Z0-9_.]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const handle = match[1].replace(/\.$/, "");
    if (isPlausibleInstagramHandle(handle)) {
      return handle;
    }
  }
  return null;
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
