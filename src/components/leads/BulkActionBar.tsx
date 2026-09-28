"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { LEAD_STATUSES, type LeadStatus } from "@/types/lead";
import { STATUS_LABELS } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
  onDone: () => void;
}

export function BulkActionBar({ selectedIds, onClear, onDone }: BulkActionBarProps) {
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { showToast } = useToast();

  if (selectedIds.length === 0) return null;

  async function runBulk(body: Record<string, unknown>, successMessage: (count: number) => string) {
    setBusy(true);
    try {
      const response = await fetch("/api/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, ...body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha na ação em lote.");
      showToast(successMessage(data.count ?? selectedIds.length));
      onDone();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível concluir a ação.", "error");
    } finally {
      setBusy(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <div className="animate-fade-in sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-border-strong bg-white/95 px-4 py-3 shadow-lg shadow-slate-900/10 backdrop-blur">
      <span className="text-sm font-semibold text-foreground">{selectedIds.length} selecionado(s)</span>

      <div className="flex items-center gap-2">
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as LeadStatus | "")}
          className="h-9 w-44 text-[13px]"
        >
          <option value="">Alterar status para...</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!status || busy}
          loading={busy}
          onClick={() =>
            runBulk({ action: "status", status }, (n) => `Status atualizado em ${n} lead(s).`)
          }
        >
          Aplicar
        </Button>
      </div>

      {confirmingDelete ? (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-2.5 py-1.5">
          <span className="text-xs font-medium text-red-800">Excluir {selectedIds.length} lead(s)?</span>
          <Button
            type="button"
            size="sm"
            variant="danger"
            loading={busy}
            onClick={() => runBulk({ action: "delete" }, (n) => `${n} lead(s) excluído(s).`)}
          >
            Confirmar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button type="button" size="sm" variant="danger" onClick={() => setConfirmingDelete(true)}>
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </Button>
      )}

      <button
        type="button"
        onClick={onClear}
        className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label="Limpar seleção"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
