"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface NextActionCardProps {
  leadId: string;
  initialNextAction: string | null;
  initialNextActionDate: string | null;
}

export function NextActionCard({ leadId, initialNextAction, initialNextActionDate }: NextActionCardProps) {
  const [nextAction, setNextAction] = useState(initialNextAction ?? "");
  const [nextActionDate, setNextActionDate] = useState(initialNextActionDate ?? "");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const isDirty =
    nextAction !== (initialNextAction ?? "") || nextActionDate !== (initialNextActionDate ?? "");

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextAction: nextAction.trim() || null,
          nextActionDate: nextActionDate || null,
        }),
      });
      if (!response.ok) throw new Error();
      showToast("Próxima ação salva.");
      router.refresh();
    } catch {
      showToast("Não foi possível salvar.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2.5">
      <Input
        placeholder="Ex: Entrar em contato novamente"
        value={nextAction}
        onChange={(e) => setNextAction(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={nextActionDate}
          onChange={(e) => setNextActionDate(e.target.value)}
          className="flex-1"
        />
        <Button type="button" size="sm" variant="secondary" onClick={handleSave} disabled={!isDirty || saving} loading={saving}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
