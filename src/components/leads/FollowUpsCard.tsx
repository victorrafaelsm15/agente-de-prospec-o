"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDateOnly } from "@/lib/utils";
import type { FollowUp } from "@/types/lead";

function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function FollowUpsCard({ leadId, followUps }: { leadId: string; followUps: FollowUp[] }) {
  const [showForm, setShowForm] = useState(false);
  const [dueDate, setDueDate] = useState(inDays(2));
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  async function createFollowUp() {
    setSaving(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate, reason: "Follow-up manual" }),
      });
      if (!response.ok) throw new Error();
      setShowForm(false);
      showToast("Follow-up criado.");
      router.refresh();
    } catch {
      showToast("Não foi possível criar o follow-up.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: "CONCLUIDO" | "IGNORADO") {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      showToast("Não foi possível atualizar o follow-up.", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  const pending = followUps.filter((f) => f.status === "PENDENTE");
  const resolved = followUps.filter((f) => f.status !== "PENDENTE");

  return (
    <div className="space-y-3">
      {pending.length === 0 && resolved.length === 0 && (
        <p className="text-sm text-muted">Nenhum follow-up criado.</p>
      )}

      {pending.map((f) => (
        <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <span className="text-foreground">Follow-up para {formatDateOnly(f.dueDate)}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => updateStatus(f.id, "CONCLUIDO")}
              disabled={updatingId === f.id}
              title="Marcar concluído"
              className="flex h-6 w-6 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateStatus(f.id, "IGNORADO")}
              disabled={updatingId === f.id}
              title="Ignorar"
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      {resolved.length > 0 && (
        <ul className="space-y-1">
          {resolved.map((f) => (
            <li key={f.id} className="text-xs text-muted line-through">
              Follow-up de {formatDateOnly(f.dueDate)} — {f.status === "CONCLUIDO" ? "concluído" : "ignorado"}
            </li>
          ))}
        </ul>
      )}

      {!showForm ? (
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" /> Criar follow-up
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="flex-1" />
          <Button type="button" size="sm" onClick={createFollowUp} disabled={saving} loading={saving}>
            Criar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
