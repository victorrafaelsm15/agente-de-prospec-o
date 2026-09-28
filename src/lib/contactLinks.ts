/**
 * Normalização de contatos em links clicáveis reais.
 *
 * Regra de ouro: nunca inventar um link a partir de um nome ou suposição.
 * Estas funções só transformam um dado JÁ ENCONTRADO (ex: "@clinicax" ou um
 * número de telefone já coletado) no formato de URL correspondente — elas
 * nunca geram um identificador que não veio de uma fonte real.
 */

export function normalizeInstagramUrl(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/instagram\.com/i.test(trimmed)) return `https://${trimmed.replace(/^\/+/, "")}`;

  const handle = trimmed.replace(/^@/, "");
  return `https://instagram.com/${handle}`;
}

export function instagramHandleLabel(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/instagram\.com\/([^/?#]+)/i);
  const handle = match ? match[1] : trimmed.replace(/^@/, "");
  return `@${handle}`;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizePhoneTelUrl(raw: string | null): string | null {
  if (!raw) return null;
  const digits = onlyDigits(raw);
  if (!digits) return null;
  return `tel:${raw.trim().startsWith("+") ? "+" : ""}${digits}`;
}

/**
 * Constrói a URL do wa.me a partir de um número já encontrado (telefone ou
 * WhatsApp). Assume que números brasileiros sem código de país (10-11
 * dígitos) usam o DDI 55 — só aplicado quando o número não já começa com um
 * código de país plausível.
 */
export function normalizeWhatsappUrl(raw: string | null): string | null {
  if (!raw) return null;
  let digits = onlyDigits(raw);
  if (!digits) return null;

  if (digits.length <= 11) {
    digits = `55${digits}`;
  }

  return `https://wa.me/${digits}`;
}

export function normalizeEmailUrl(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || !trimmed.includes("@")) return null;
  return `mailto:${trimmed}`;
}
