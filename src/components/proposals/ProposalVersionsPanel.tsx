"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitCommitHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatCurrencyBRL } from "@/lib/proposalCalc";
import { formatDateTime } from "@/lib/utils";
import type { ProposalVersion } from "@/types/proposal";

export function ProposalVersionsPanel({ proposalId, versions }: { proposalId: string; versions: ProposalVersion[] }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleCreateVersion() {
    setSaving(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note || null }),
      });
      if (!response.ok) throw new Error();
      setNote("");
      showToast("Nova versão criada.");
      router.refresh();
    } catch {
      showToast("Não foi possível criar a versão.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input placeholder="Nota da versão (ex: cliente pediu desconto)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button type="button" size="sm" onClick={handleCreateVersion} disabled={saving} loading={saving}>
          <GitCommitHorizontal className="h-3.5 w-3.5" /> Nova versão
        </Button>
      </div>

      {versions.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma versão anterior registrada.</p>
      ) : (
        <ul className="space-y-2">
          {versions.map((v) => (
            <li key={v.id} className="rounded-lg border border-border p-2.5 text-sm">
              <button
                type="button"
                onClick={() => setExpanded((cur) => (cur === v.id ? null : v.id))}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="font-medium text-foreground">
                  V{v.versionNumber} — {formatCurrencyBRL(v.total)}
                </span>
                <span className="text-xs text-muted">{formatDateTime(v.createdAt)}</span>
              </button>
              {v.note && <p className="mt-1 text-xs text-muted">{v.note}</p>}
              {expanded === v.id && (
                <div className="animate-fade-in mt-2 space-y-1 border-t border-border pt-2 text-xs text-muted">
                  <p>Título: {v.snapshot.title}</p>
                  <p>Itens: {v.snapshot.items.length}</p>
                  <p>Status na época: {v.snapshot.status}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
