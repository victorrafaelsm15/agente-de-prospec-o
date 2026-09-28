import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatRelativeTime } from "@/lib/utils";
import type { RecentResearchItem } from "@/types/lead";

export function RecentResearch({ items }: { items: RecentResearchItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas pesquisas</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma pesquisa realizada ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.query} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="truncate text-sm text-foreground">{item.query}</span>
                <span className="shrink-0 text-xs text-muted">
                  {item.count} {item.count === 1 ? "lead" : "leads"} · {formatRelativeTime(item.lastRunAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
