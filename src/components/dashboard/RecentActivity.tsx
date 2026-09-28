import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/leads/StatusBadge";
import { formatRelativeTime } from "@/lib/utils";
import { Activity } from "lucide-react";
import type { Lead } from "@/types/lead";

export function RecentActivity({ leads }: { leads: Lead[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade recente</CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-5 w-5" />}
            title="Nenhuma atividade ainda"
            description="Assim que você executar uma pesquisa no Agente, os leads gerados aparecerão aqui."
          />
        ) : (
          <ul className="divide-y divide-border">
            {leads.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="truncate text-sm font-medium text-foreground hover:text-brand"
                  >
                    {lead.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {lead.category} · {lead.city}/{lead.state} · {formatRelativeTime(lead.createdAt)}
                  </p>
                </div>
                <StatusBadge status={lead.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
