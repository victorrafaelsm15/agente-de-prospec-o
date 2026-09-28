"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { useToast } from "@/components/ui/Toast";

export function BriefingCard({ leadId, initialBriefing }: { leadId: string; initialBriefing: string | null }) {
  const [briefing, setBriefing] = useState(initialBriefing);
  const [generating, setGenerating] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleGenerate() {
    setGenerating(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/briefing`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao gerar briefing.");
      setBriefing(data.briefing);
      showToast(data.aiGenerated ? "Briefing gerado por IA." : "Briefing gerado por regras (IA não configurada).");
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao gerar briefing.", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-3">
      {briefing ? (
        <>
          <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-foreground font-sans">
            {briefing}
          </pre>
          <div className="flex items-center gap-2">
            <CopyButton value={briefing} label="Copiar briefing" />
            <Button type="button" size="sm" variant="ghost" onClick={handleGenerate} disabled={generating} loading={generating}>
              <Sparkles className="h-3.5 w-3.5" /> Gerar novamente
            </Button>
          </div>
        </>
      ) : (
        <Button type="button" size="sm" onClick={handleGenerate} disabled={generating} loading={generating}>
          <FileText className="h-3.5 w-3.5" />
          Gerar briefing
        </Button>
      )}
      <p className="text-xs text-muted">
        Rascunho para preparar uma proposta futura — ainda não é a proposta em si (V4).
      </p>
    </div>
  );
}
