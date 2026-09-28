"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function SummarizeButton({ leadId }: { leadId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handleClick() {
    setLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/summary`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao gerar resumo.");
      setSummary(data.summary);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao gerar resumo.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button type="button" size="sm" variant="secondary" onClick={handleClick} disabled={loading} loading={loading}>
        <Sparkles className="h-3.5 w-3.5" />
        Resumir lead com IA
      </Button>
      {summary && (
        <p className="animate-fade-in mt-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-foreground">{summary}</p>
      )}
    </div>
  );
}
