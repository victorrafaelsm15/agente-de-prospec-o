import type { DiscountType, Proposal, ProposalFinancialSummary, ProposalItem } from "@/types/proposal";

/**
 * Todo cálculo financeiro de uma proposta é feito aqui, de forma
 * determinística — a IA nunca decide um total. Valores são arredondados
 * para 2 casas decimais em cada etapa para evitar erros de ponto flutuante
 * acumulados.
 */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateItemTotal(quantity: number, unitPrice: number): number {
  return round2(Math.max(0, quantity) * Math.max(0, unitPrice));
}

export function calculateSubtotal(items: Pick<ProposalItem, "quantity" | "unitPrice">[]): number {
  return round2(items.reduce((sum, item) => sum + calculateItemTotal(item.quantity, item.unitPrice), 0));
}

export function calculateDiscountAmount(
  subtotal: number,
  discountType: DiscountType | null,
  discountValue: number
): number {
  if (!discountType || discountValue <= 0) return 0;
  if (discountType === "PERCENTUAL") {
    const pct = Math.min(100, Math.max(0, discountValue));
    return round2(subtotal * (pct / 100));
  }
  return round2(Math.min(Math.max(0, discountValue), subtotal));
}

export function calculateTotal(
  subtotal: number,
  discountType: DiscountType | null,
  discountValue: number
): number {
  const discount = calculateDiscountAmount(subtotal, discountType, discountValue);
  return round2(Math.max(0, subtotal - discount));
}

export interface ProposalTotals {
  subtotal: number;
  discountAmount: number;
  total: number;
}

export function calculateProposalTotals(
  items: Pick<ProposalItem, "quantity" | "unitPrice">[],
  discountType: DiscountType | null,
  discountValue: number
): ProposalTotals {
  const subtotal = calculateSubtotal(items);
  const discountAmount = calculateDiscountAmount(subtotal, discountType, discountValue);
  const total = round2(Math.max(0, subtotal - discountAmount));
  return { subtotal, discountAmount, total };
}

/** Calcula a data de expiração (YYYY-MM-DD) a partir de uma data base + dias de validade. */
export function calculateExpiresAt(baseDate: Date, validityDays: number): string {
  const expires = new Date(baseDate);
  expires.setDate(expires.getDate() + Math.max(0, validityDays));
  return expires.toISOString().slice(0, 10);
}

const OPEN_STATUSES = new Set(["RASCUNHO", "PRONTA", "ENVIADA", "VISUALIZADA"]);

/**
 * Visão financeira simples do pipeline de propostas — soma real dos totais
 * já calculados, nunca uma estimativa inventada.
 */
export function computeProposalFinancialSummary(proposals: Proposal[]): ProposalFinancialSummary {
  const summary: ProposalFinancialSummary = {
    openValue: 0,
    openCount: 0,
    negotiatingValue: 0,
    negotiatingCount: 0,
    approvedValue: 0,
    approvedCount: 0,
    rejectedValue: 0,
    rejectedCount: 0,
  };

  for (const proposal of proposals) {
    if (OPEN_STATUSES.has(proposal.status)) {
      summary.openValue = round2(summary.openValue + proposal.total);
      summary.openCount += 1;
    } else if (proposal.status === "EM_NEGOCIACAO") {
      summary.negotiatingValue = round2(summary.negotiatingValue + proposal.total);
      summary.negotiatingCount += 1;
    } else if (proposal.status === "APROVADA") {
      summary.approvedValue = round2(summary.approvedValue + proposal.total);
      summary.approvedCount += 1;
    } else if (proposal.status === "RECUSADA") {
      summary.rejectedValue = round2(summary.rejectedValue + proposal.total);
      summary.rejectedCount += 1;
    }
  }

  return summary;
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
