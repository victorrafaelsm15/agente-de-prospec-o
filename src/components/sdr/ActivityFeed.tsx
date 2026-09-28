import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatRelativeTime } from "@/lib/utils";
import type { ActivityLogEntry } from "@/types/lead";
import { Bot, User } from "lucide-react";

export function ActivityFeed({ activity }: { activity: ActivityLogEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade recente</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma atividade registrada ainda.</p>
        ) : (
          <ul className="space-y-3">
            {activity.map((entry) => (
              <li key={entry.id} className="flex items-start gap-2.5 text-sm">
                {entry.actor === "ia" ? (
                  <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                ) : (
                  <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                )}
                <div className="min-w-0">
                  {entry.leadId ? (
                    <Link href={`/leads/${entry.leadId}`} className="text-foreground hover:text-brand hover:underline">
                      {entry.description}
                    </Link>
                  ) : (
                    <span className="text-foreground">{entry.description}</span>
                  )}
                  <p className="text-xs text-muted">{formatRelativeTime(entry.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
