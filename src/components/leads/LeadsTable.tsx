import Link from "next/link";
import { Globe } from "lucide-react";
import { StatusBadge, PriorityBadge, ScoreBadge } from "@/components/leads/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { Lead } from "@/types/lead";

export function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-surface sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Cidade</th>
              <th className="px-4 py-3 font-medium">Site</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Prioridade</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Pesquisado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr key={lead.id} className="transition-colors hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <Link href={`/leads/${lead.id}`} className="font-medium text-foreground hover:text-brand">
                    {lead.name}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-muted">{lead.category}</td>
                <td className="px-4 py-3.5 text-muted">
                  {lead.city}/{lead.state}
                </td>
                <td className="px-4 py-3.5">
                  {lead.website ? (
                    <Globe className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <span className="text-xs text-muted">Não encontrado</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <ScoreBadge score={lead.score} />
                </td>
                <td className="px-4 py-3.5">
                  <PriorityBadge priority={lead.priority} />
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-5 py-3.5 text-muted">{formatDate(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 sm:hidden">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads/${lead.id}`}
            className="block rounded-2xl border border-border bg-surface p-4 active:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{lead.name}</p>
                <p className="text-xs text-muted">
                  {lead.category} · {lead.city}/{lead.state}
                </p>
              </div>
              <ScoreBadge score={lead.score} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PriorityBadge priority={lead.priority} />
              <StatusBadge status={lead.status} />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
