import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScoreBadge } from "@/components/leads/StatusBadge";
import type { Lead } from "@/types/lead";

export function TopOpportunities({ leads }: { leads: Lead[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads com maior oportunidade</CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-sm text-muted">Nenhum lead pontuado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {leads.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <Link
                  href={`/leads/${lead.id}`}
                  className="truncate text-sm font-medium text-foreground hover:text-brand hover:underline"
                >
                  {lead.name}
                </Link>
                <ScoreBadge score={lead.score} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
