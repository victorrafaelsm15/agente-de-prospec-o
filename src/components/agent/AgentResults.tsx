import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriorityBadge, ScoreBadge } from "@/components/leads/StatusBadge";
import type { Lead } from "@/types/lead";
import type { SkippedLead } from "@/lib/hooks/useProspectingAgent";

interface AgentResultsProps {
  leads: Lead[];
  skipped: SkippedLead[];
  summary: { count: number; requested: number; skippedByCriteria: number } | null;
}

export function AgentResults({ leads, skipped, summary }: AgentResultsProps) {
  if (!summary) return null;

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="h-5 w-5" />}
        title="Não encontramos leads com esses critérios."
        description={
          summary.skippedByCriteria > 0
            ? `${summary.skippedByCriteria} negócio(s) foram encontrados, mas nenhum atendeu aos critérios de qualificação selecionados. Tente relaxar os critérios ou aumentar a quantidade.`
            : "Tente ajustar o nicho, a cidade ou a quantidade solicitada e pesquise novamente."
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {leads.length} {leads.length === 1 ? "lead encontrado" : "leads encontrados"}
          {summary.requested > leads.length && (
            <span className="ml-1.5 font-normal text-muted">
              (de {summary.requested} solicitados
              {summary.skippedByCriteria > 0
                ? ` — ${summary.skippedByCriteria} não atenderam aos critérios`
                : " — alguns podem ter sido duplicados"}
              )
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Link
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{lead.name}</p>
                  <p className="truncate text-xs text-muted">
                    {lead.category} · {lead.city}/{lead.state} ·{" "}
                    {lead.website ? "com site" : "sem site identificado"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <PriorityBadge priority={lead.priority} />
                  <ScoreBadge score={lead.score} />
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
      {skipped.length > 0 && (
        <div className="border-t border-border px-5 py-3.5">
          <p className="text-xs font-medium text-muted">
            {skipped.length} negócio(s) ignorado(s) por não atenderem aos critérios:
          </p>
          <ul className="mt-1 space-y-0.5">
            {skipped.slice(0, 5).map((s, idx) => (
              <li key={idx} className="text-xs text-muted">
                {s.name} — {s.reason}
              </li>
            ))}
            {skipped.length > 5 && (
              <li className="text-xs text-muted">e mais {skipped.length - 5}...</li>
            )}
          </ul>
        </div>
      )}
    </Card>
  );
}
