"use client";

import { useState } from "react";
import { Save, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { useToast } from "@/components/ui/Toast";

interface OutreachMessageCardProps {
  leadId: string;
  initialMessage: string | null;
  aiGenerated: boolean;
}

export function OutreachMessageCard({ leadId, initialMessage, aiGenerated }: OutreachMessageCardProps) {
  const [message, setMessage] = useState(initialMessage ?? "");
  const [savedMessage, setSavedMessage] = useState(initialMessage ?? "");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const isDirty = message !== savedMessage;

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outreachMessage: message }),
      });
      if (!response.ok) throw new Error();
      setSavedMessage(message);
      showToast("Mensagem salva.");
    } catch {
      showToast("Não foi possível salvar a mensagem.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mensagem sugerida</CardTitle>
        {aiGenerated ? (
          <span className="flex items-center gap-1 text-xs font-medium text-brand">
            <Sparkles className="h-3.5 w-3.5" /> Gerada por IA
          </span>
        ) : (
          <span className="text-xs font-medium text-muted">Gerada por regras (IA não configurada)</span>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {message ? (
          <>
            <Textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Edite a mensagem antes de utilizá-la..."
            />
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton
                value={message}
                label="Copiar mensagem"
                successMessage="Mensagem copiada para a área de transferência."
                variant="primary"
              />
              <Button size="sm" variant="secondary" onClick={handleSave} disabled={!isDirty || saving} loading={saving}>
                <Save className="h-3.5 w-3.5" />
                {saving ? "Salvando..." : "Salvar edição"}
              </Button>
            </div>
            <p className="text-xs text-muted">
              Revise antes de enviar. Esta mensagem não é enviada automaticamente pelo sistema.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">Nenhuma mensagem foi gerada para este lead.</p>
        )}
      </CardContent>
    </Card>
  );
}
