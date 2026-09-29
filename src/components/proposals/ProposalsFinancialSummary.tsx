import { Card } from "@/components/ui/Card";
import { formatCurrencyBRL } from "@/lib/proposalCalc";
import type { ProposalFinancialSummary } from "@/types/proposal";

export function ProposalsFinancialSummary({ summary }: { summary: ProposalFinancialSummary }) {
  const tiles = [
    { label: "Em aberto", value: summary.openValue, count: summary.openCount, accent: "text-slate-700" },
    { label: "Em negociação", value: summary.negotiatingValue, count: summary.negotiatingCount, accent: "text-amber-700" },
    { label: "Aprovadas", value: summary.approvedValue, count: summary.approvedCount, accent: "text-emerald-700" },
    { label: "Recusadas", value: summary.rejectedValue, count: summary.rejectedCount, accent: "text-rose-700" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="p-5">
          <p className="text-[13px] font-medium text-muted">{tile.label}</p>
          <p className={`mt-1.5 text-2xl font-semibold tracking-tight ${tile.accent}`}>{formatCurrencyBRL(tile.value)}</p>
          <p className="text-[11px] text-muted">
            {tile.count} proposta{tile.count === 1 ? "" : "s"}
          </p>
        </Card>
      ))}
    </div>
  );
}
