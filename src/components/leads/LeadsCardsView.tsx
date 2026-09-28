"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge, ScoreBadge } from "@/components/leads/StatusBadge";
import { ContactIconRow } from "@/components/leads/ContactLinks";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import type { Lead } from "@/types/lead";

interface LeadsCardsViewProps {
  leads: Lead[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

export function LeadsCardsView({ leads, selectedIds, onToggle }: LeadsCardsViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      showToast("Lead excluído.");
      router.refresh();
    } catch {
      showToast("Não foi possível excluir o lead.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => (
        <Card
          key={lead.id}
          interactive
          className={`p-4 ${selectedIds.has(lead.id) ? "border-brand ring-1 ring-brand/30" : ""}`}
          onClick={() => router.push(`/leads/${lead.id}`)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <input
                type="checkbox"
                checked={selectedIds.has(lead.id)}
                onChange={() => onToggle(lead.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-border-strong accent-brand"
                aria-label={`Selecionar ${lead.name}`}
              />
              <div className="min-w-0">
                <Link
                  href={`/leads/${lead.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="block truncate text-sm font-semibold text-foreground hover:text-brand hover:underline"
                >
                  {lead.name}
                </Link>
                <p className="truncate text-xs text-muted">
                  {lead.category} · {lead.city}/{lead.state}
                </p>
              </div>
            </div>
            <ScoreBadge score={lead.score} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={lead.priority} />
            <StatusBadge status={lead.status} />
          </div>

          {lead.aiAnalysis && (
            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">{lead.aiAnalysis}</p>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <ContactIconRow
              website={lead.website}
              instagram={lead.instagram}
              whatsapp={lead.whatsapp}
              phone={lead.phone}
              email={lead.email}
            />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted">{formatDate(lead.createdAt)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(lead.id, lead.name);
                }}
                disabled={deletingId === lead.id}
                title="Excluir lead"
                aria-label={`Excluir ${lead.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-danger disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
