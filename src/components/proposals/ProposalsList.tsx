import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrencyBRL } from "@/lib/proposalCalc";
import { formatDate } from "@/lib/utils";
import type { Proposal } from "@/types/proposal";

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  PRONTA: "Pronta",
  ENVIADA: "Enviada",
  VISUALIZADA: "Visualizada",
  EM_NEGOCIACAO: "Em negociação",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  EXPIRADA: "Expirada",
  CANCELADA: "Cancelada",
};

const STATUS_STYLES: Record<string, string> = {
  RASCUNHO: "bg-slate-100 text-slate-700 ring-slate-600/10",
  PRONTA: "bg-sky-50 text-sky-700 ring-sky-600/10",
  ENVIADA: "bg-amber-50 text-amber-700 ring-amber-600/10",
  VISUALIZADA: "bg-violet-50 text-violet-700 ring-violet-600/10",
  EM_NEGOCIACAO: "bg-orange-50 text-orange-700 ring-orange-600/10",
  APROVADA: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  RECUSADA: "bg-rose-50 text-rose-700 ring-rose-600/10",
  EXPIRADA: "bg-slate-100 text-slate-500 ring-slate-600/10",
  CANCELADA: "bg-slate-100 text-slate-500 ring-slate-600/10",
};

export function ProposalsList({ proposals, leadNames }: { proposals: Proposal[]; leadNames: Map<string, string> }) {
  if (proposals.length === 0) return null;

  return (
    <Card className="p-0">
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {proposals.map((proposal) => (
            <li key={proposal.id}>
              <Link
                href={`/proposals/${proposal.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{proposal.title}</p>
                  <p className="truncate text-xs text-muted">
                    {leadNames.get(proposal.leadId) ?? "Lead"} · {formatDate(proposal.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">{formatCurrencyBRL(proposal.total)}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[proposal.status]}`}>
                    {STATUS_LABELS[proposal.status]}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
