import { Bot, User, Users } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { ProposalEvent } from "@/types/proposal";

const EVENT_LABELS: Record<string, string> = {
  criada: "Proposta criada",
  editada: "Proposta editada",
  versao_criada: "Nova versão criada",
  pdf_gerado: "PDF gerado",
  enviada: "Proposta enviada",
  visualizada: "Cliente visualizou",
  aceita: "Cliente aceitou",
  recusada: "Cliente recusou",
  status_alterado: "Status alterado",
  cancelada: "Proposta cancelada",
};

export function ProposalEventsTimeline({ events }: { events: ProposalEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted">Nenhum evento registrado ainda.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-2.5 text-sm">
          {event.actor === "ia" ? (
            <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
          ) : event.actor === "cliente" ? (
            <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
          ) : (
            <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          )}
          <div>
            <p className="text-foreground">{EVENT_LABELS[event.event] ?? event.event}</p>
            <p className="text-xs text-muted">{formatDateTime(event.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
