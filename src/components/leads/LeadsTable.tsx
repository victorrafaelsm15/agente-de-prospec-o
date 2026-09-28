"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { StatusBadge, PriorityBadge, ScoreBadge } from "@/components/leads/StatusBadge";
import { ContactIconRow } from "@/components/leads/ContactLinks";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import type { Lead } from "@/types/lead";

interface LeadsTableProps {
  leads: Lead[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
}

export function LeadsTable({ leads, selectedIds, onToggle, onToggleAll }: LeadsTableProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));

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
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-surface sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-border-strong accent-brand"
                  aria-label="Selecionar todos"
                />
              </th>
              <th className="px-2 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Cidade</th>
              <th className="px-4 py-3 font-medium">Contatos</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Prioridade</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Pesquisado em</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className={`group cursor-pointer transition-colors hover:bg-slate-50 ${selectedIds.has(lead.id) ? "bg-brand-soft/40" : ""}`}
                onClick={() => router.push(`/leads/${lead.id}`)}
              >
                <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id)}
                    onChange={() => onToggle(lead.id)}
                    className="h-4 w-4 cursor-pointer rounded border-border-strong accent-brand"
                    aria-label={`Selecionar ${lead.name}`}
                  />
                </td>
                <td className="px-2 py-3.5">
                  <Link
                    href={`/leads/${lead.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-foreground hover:text-brand hover:underline"
                  >
                    {lead.name}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-muted">{lead.category}</td>
                <td className="px-4 py-3.5 text-muted">
                  {lead.city}/{lead.state}
                </td>
                <td className="px-4 py-3.5">
                  <ContactIconRow
                    website={lead.website}
                    instagram={lead.instagram}
                    whatsapp={lead.whatsapp}
                    phone={lead.phone}
                    email={lead.email}
                  />
                </td>
                <td className="px-4 py-3.5">
                  <ScoreBadge score={lead.score} />
                </td>
                <td className="px-4 py-3.5">
                  <PriorityBadge priority={lead.priority} />
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3.5 text-muted">{formatDate(lead.createdAt)}</td>
                <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleDelete(lead.id, lead.name)}
                    disabled={deletingId === lead.id}
                    title="Excluir lead"
                    aria-label={`Excluir ${lead.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-danger group-hover:opacity-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 sm:hidden">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className={`rounded-2xl border p-4 transition-colors ${selectedIds.has(lead.id) ? "border-brand bg-brand-soft/30" : "border-border bg-surface"}`}
          >
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selectedIds.has(lead.id)}
                onChange={() => onToggle(lead.id)}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-border-strong accent-brand"
                aria-label={`Selecionar ${lead.name}`}
              />
              <Link href={`/leads/${lead.id}`} className="min-w-0 flex-1 active:opacity-70">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{lead.name}</p>
                    <p className="text-xs text-muted">
                      {lead.category} · {lead.city}/{lead.state}
                    </p>
                  </div>
                  <ScoreBadge score={lead.score} />
                </div>
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 pl-6">
              <PriorityBadge priority={lead.priority} />
              <StatusBadge status={lead.status} />
            </div>
            <div className="mt-3 flex items-center justify-between pl-6">
              <ContactIconRow
                website={lead.website}
                instagram={lead.instagram}
                whatsapp={lead.whatsapp}
                phone={lead.phone}
                email={lead.email}
              />
              <button
                type="button"
                onClick={() => handleDelete(lead.id, lead.name)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-danger"
                aria-label={`Excluir ${lead.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
