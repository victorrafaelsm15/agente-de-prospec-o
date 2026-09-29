"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatCurrencyBRL } from "@/lib/proposalCalc";
import { formatDate } from "@/lib/utils";
import type { Proposal } from "@/types/proposal";

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  PRONTA: "Pronta",
  ENVIADA: "Enviada",
  VISUALIZADA: "Visualizada",
  EM_NEGOCIACAO: "Em negociação",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  EXPIRADA: "Expirada",
  CANCELADA: "Cancelada",
};

export function LeadProposalsCard({ leadId, proposals }: { leadId: string; proposals: Proposal[] }) {
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleCreate() {
    setCreating(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Proposta comercial" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao criar proposta.");
      router.push(`/proposals/${data.proposal.id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao criar proposta.", "error");
      setCreating(false);
    }
  }

  return (
    <div className="space-y-3">
      {proposals.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma proposta criada para este lead ainda.</p>
      ) : (
        <ul className="space-y-2">
          {proposals.map((p) => (
            <li key={p.id}>
              <Link
                href={`/proposals/${p.id}`}
                className="group flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{p.title}</p>
                  <p className="text-xs text-muted">
                    {STATUS_LABELS[p.status]} · {formatDate(p.createdAt)}
                    {p.expiresAt && ` · válida até ${formatDate(p.expiresAt)}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold text-foreground">{formatCurrencyBRL(p.total)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" size="sm" variant="secondary" onClick={handleCreate} disabled={creating} loading={creating}>
        <Plus className="h-3.5 w-3.5" /> Criar proposta
      </Button>
    </div>
  );
}
