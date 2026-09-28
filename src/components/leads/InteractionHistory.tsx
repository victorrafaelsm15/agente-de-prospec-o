"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownLeft, Plus } from "lucide-react";
import { Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/utils";
import { CHANNEL_LABELS } from "@/lib/constants";
import { CHANNELS, type Channel, type Interaction } from "@/types/lead";

const STATUS_LABELS: Record<Interaction["status"], string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  FALHOU: "Falhou",
  RECEBIDO: "Recebido",
};

export function InteractionHistory({ leadId, interactions }: { leadId: string; interactions: Interaction[] }) {
  const [showForm, setShowForm] = useState(false);
  const [channel, setChannel] = useState<Channel>("WHATSAPP");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleLogReply() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, direction: "ENTRADA", message: text, status: "RECEBIDO" }),
      });
      if (!response.ok) throw new Error();
      setText("");
      setShowForm(false);
      showToast("Resposta registrada.");
      router.refresh();
    } catch {
      showToast("Não foi possível registrar a resposta.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {interactions.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma interação registrada ainda.</p>
      ) : (
        <ul className="space-y-3">
          {interactions.map((interaction) => (
            <li key={interaction.id} className="flex items-start gap-2.5 text-sm">
              {interaction.direction === "SAIDA" ? (
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              ) : (
                <ArrowDownLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-foreground">
                  <span className="font-medium">{CHANNEL_LABELS[interaction.channel]}</span>
                  {" — "}
                  <span className={interaction.status === "FALHOU" ? "text-danger" : "text-muted"}>
                    {STATUS_LABELS[interaction.status]}
                  </span>
                </p>
                {interaction.message && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{interaction.message}</p>
                )}
                <p className="mt-0.5 text-[11px] text-muted">{formatDateTime(interaction.occurredAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!showForm ? (
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" /> Registrar resposta recebida
        </Button>
      ) : (
        <div className="animate-fade-in space-y-2 rounded-lg border border-border bg-slate-50 p-3">
          <Select value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className="h-9 text-[13px]">
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {CHANNEL_LABELS[c]}
              </option>
            ))}
          </Select>
          <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="O que o lead respondeu?" />
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={handleLogReply} disabled={!text.trim() || saving} loading={saving}>
              Registrar
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
