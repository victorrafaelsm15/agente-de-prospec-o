"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ScoreBadge } from "@/components/leads/StatusBadge";
import { ContactIconRow } from "@/components/leads/ContactLinks";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/types/lead";
import { STATUS_LABELS } from "@/lib/constants";

export function KanbanBoard() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<LeadStatus | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const queryKey = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    params.delete("page");
    params.set("pageSize", "500");
    return params.toString();
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leads?${queryKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setLeads(data.leads ?? []);
      })
      .catch(() => {
        if (!cancelled) setLeads([]);
      });
    return () => {
      cancelled = true;
    };
  }, [queryKey]);

  const columns = useMemo(() => {
    const map = new Map<LeadStatus, Lead[]>();
    for (const status of LEAD_STATUSES) map.set(status, []);
    for (const lead of leads ?? []) {
      map.get(lead.status)?.push(lead);
    }
    return map;
  }, [leads]);

  async function moveLead(id: string, status: LeadStatus) {
    const previous = leads;
    setLeads((prev) => (prev ? prev.map((l) => (l.id === id ? { ...l, status } : l)) : prev));
    setMovingId(id);

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error();
      showToast(`Status alterado para "${STATUS_LABELS[status]}".`);
    } catch {
      setLeads(previous ?? null);
      showToast("Não foi possível mover o lead. Tente novamente.", "error");
    } finally {
      setMovingId(null);
    }
  }

  if (!leads) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando leads...
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {LEAD_STATUSES.map((status) => {
        const items = columns.get(status) ?? [];
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(status);
            }}
            onDragLeave={() => setDragOverStatus((s) => (s === status ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStatus(null);
              const id = e.dataTransfer.getData("text/lead-id");
              if (id) moveLead(id, status);
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-2xl border bg-slate-50/60 transition-colors",
              dragOverStatus === status ? "border-brand bg-brand-soft/40" : "border-border"
            )}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <h3 className="text-[13px] font-semibold text-foreground">{STATUS_LABELS[status]}</h3>
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-border">
                {items.length}
              </span>
            </div>

            <div className="flex min-h-[80px] flex-1 flex-col gap-2 px-2 pb-2">
              {items.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/lead-id", lead.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className={cn(
                    "cursor-grab rounded-xl border border-border bg-white p-3 shadow-sm transition-all active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md",
                    movingId === lead.id && "opacity-50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="truncate text-[13px] font-medium text-foreground hover:text-brand hover:underline"
                    >
                      {lead.name}
                    </Link>
                    <ScoreBadge score={lead.score} />
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted">
                    {lead.category} · {lead.city}/{lead.state}
                  </p>
                  <div className="mt-2">
                    <ContactIconRow
                      website={lead.website}
                      instagram={lead.instagram}
                      whatsapp={lead.whatsapp}
                      phone={lead.phone}
                      email={lead.email}
                    />
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border-strong py-6 text-[11px] text-muted">
                  Arraste um lead aqui
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
