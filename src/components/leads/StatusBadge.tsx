import { Badge } from "@/components/ui/Badge";
import { STATUS_LABELS, STATUS_STYLES, PRIORITY_LABELS, PRIORITY_STYLES } from "@/lib/constants";
import type { LeadPriority, LeadStatus } from "@/types/lead";

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <Badge className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  const dotColor =
    priority === "ALTA" ? "bg-emerald-500" : priority === "MEDIA" ? "bg-amber-500" : "bg-slate-400";
  return (
    <Badge className={PRIORITY_STYLES[priority]}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 60
      ? "text-emerald-700 bg-emerald-50 ring-emerald-600/10"
      : score >= 30
        ? "text-amber-700 bg-amber-50 ring-amber-600/10"
        : "text-slate-600 bg-slate-100 ring-slate-600/10";
  return (
    <Badge className={color}>
      <strong className="font-semibold">{score}</strong>
      <span className="opacity-70">/100</span>
    </Badge>
  );
}
