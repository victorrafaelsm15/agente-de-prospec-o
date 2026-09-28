import Link from "next/link";
import { Users, Clock, MessageCircle, CalendarClock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AttentionItem, AttentionSummary } from "@/types/lead";

interface AttentionCardProps {
  title: string;
  icon: typeof Users;
  items: AttentionItem[];
  accent: "brand" | "amber" | "emerald" | "sky";
}

const ACCENT_STYLES: Record<AttentionCardProps["accent"], string> = {
  brand: "bg-brand-soft text-brand",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  sky: "bg-sky-50 text-sky-700",
};

function AttentionCard({ title, icon: Icon, items, accent }: AttentionCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted">{title}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{items.length}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${ACCENT_STYLES[accent]}`}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
      {items.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-border pt-3">
          {items.slice(0, 4).map((item) => (
            <li key={item.leadId}>
              <Link
                href={`/leads/${item.leadId}`}
                className="group flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 -mx-1.5 text-sm transition-colors hover:bg-slate-50"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium text-foreground">{item.leadName}</span>
                  <span className="text-muted"> — {item.reason}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
          {items.length > 4 && (
            <li className="px-1.5 text-xs text-muted">e mais {items.length - 4}...</li>
          )}
        </ul>
      )}
    </Card>
  );
}

export function AttentionSection({ summary }: { summary: AttentionSummary }) {
  const totalPending =
    summary.readyForContact.length +
    summary.followUpsDueToday.length +
    summary.awaitingResponse.length +
    summary.responded.length +
    summary.upcomingMeetings.length;

  if (totalPending === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>O que precisa da sua atenção</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="Tudo em dia"
            description="Não há leads pendentes de contato, follow-up ou resposta no momento."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-foreground">O que precisa da sua atenção</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AttentionCard title="Prontos para contato" icon={Users} items={summary.readyForContact} accent="brand" />
        <AttentionCard title="Follow-ups pendentes" icon={Clock} items={summary.followUpsDueToday} accent="amber" />
        <AttentionCard title="Responderam" icon={MessageCircle} items={summary.responded} accent="emerald" />
        <AttentionCard title="Reuniões agendadas" icon={CalendarClock} items={summary.upcomingMeetings} accent="sky" />
      </div>
      {summary.awaitingResponse.length > 0 && (
        <div className="mt-4">
          <AttentionCard title="Aguardando resposta" icon={Clock} items={summary.awaitingResponse} accent="amber" />
        </div>
      )}
    </div>
  );
}
