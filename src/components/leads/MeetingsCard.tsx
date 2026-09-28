"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, X as XIcon } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/utils";
import type { Meeting } from "@/types/lead";

export function MeetingsCard({ leadId, meetings }: { leadId: string; meetings: Meeting[] }) {
  const [showForm, setShowForm] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  async function createMeeting() {
    if (!scheduledAt) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: new Date(scheduledAt).toISOString(), notes: notes || null }),
      });
      if (!response.ok) throw new Error();
      setShowForm(false);
      setNotes("");
      showToast("Reunião agendada.");
      router.refresh();
    } catch {
      showToast("Não foi possível agendar a reunião.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: "REALIZADA" | "CANCELADA") {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      showToast("Não foi possível atualizar a reunião.", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {meetings.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma reunião agendada.</p>
      ) : (
        <ul className="space-y-2">
          {meetings.map((m) => (
            <li key={m.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">{formatDateTime(m.scheduledAt)}</span>
                {m.status === "AGENDADA" ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateStatus(m.id, "REALIZADA")}
                      disabled={updatingId === m.id}
                      title="Marcar realizada"
                      className="flex h-6 w-6 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(m.id, "CANCELADA")}
                      disabled={updatingId === m.id}
                      title="Cancelar"
                      className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-muted">{m.status === "REALIZADA" ? "Realizada" : "Cancelada"}</span>
                )}
              </div>
              {m.notes && <p className="mt-1 text-xs text-muted">{m.notes}</p>}
            </li>
          ))}
        </ul>
      )}

      {!showForm ? (
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" /> Agendar reunião
        </Button>
      ) : (
        <div className="animate-fade-in space-y-2 rounded-lg border border-border bg-slate-50 p-3">
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações (opcional)" />
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={createMeeting} disabled={!scheduledAt || saving} loading={saving}>
              Agendar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
