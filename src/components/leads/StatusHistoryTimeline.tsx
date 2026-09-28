import { Circle } from "lucide-react";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import type { StatusHistoryEntry } from "@/types/lead";

export function StatusHistoryTimeline({ history }: { history: StatusHistoryEntry[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-muted">Nenhum histórico registrado.</p>;
  }

  const sorted = [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  return (
    <ol className="space-y-3">
      {sorted.map((entry, idx) => (
        <li key={idx} className="flex items-start gap-2.5 text-sm">
          <Circle
            className={`mt-1 h-2 w-2 shrink-0 ${idx === 0 ? "fill-brand text-brand" : "fill-slate-300 text-slate-300"}`}
          />
          <div>
            <p className="text-foreground">
              Status alterado para <strong className="font-medium">{STATUS_LABELS[entry.status]}</strong>
            </p>
            <p className="text-xs text-muted">{formatDateTime(entry.changedAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
