"use client";

import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const REFINE_PRESETS = [
  "Deixe mais profissional",
  "Crie uma versão mais objetiva",
  "Deixe mais consultivo",
  "Explique de forma mais clara",
];

interface RefinableTextFieldProps {
  label: string;
  proposalId: string;
  field: string;
  value: string;
  onChange: (value: string) => void;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  rows?: number;
}

export function RefinableTextField({
  label,
  proposalId,
  field,
  value,
  onChange,
  onSave,
  placeholder,
  rows = 3,
}: RefinableTextFieldProps) {
  const [saving, setSaving] = useState(false);
  const [refining, setRefining] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [instruction, setInstruction] = useState("");
  const { showToast } = useToast();

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(value);
      showToast(`${label} salvo(a).`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao salvar.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRefine(customInstruction?: string) {
    const finalInstruction = customInstruction ?? instruction;
    if (!finalInstruction.trim()) return;
    setRefining(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/ai/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, instruction: finalInstruction }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao refinar texto.");
      onChange(data.text);
      showToast(data.aiGenerated ? "Texto refinado pela IA." : "IA não configurada — texto mantido.");
      setShowRefine(false);
      setInstruction("");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao refinar texto.", "error");
    } finally {
      setRefining(false);
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[13px] font-medium text-foreground">{label}</label>
        <div className="flex items-center gap-1.5">
          {value.trim() && (
            <button
              type="button"
              onClick={() => setShowRefine((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-medium text-brand hover:text-indigo-700"
            >
              <Wand2 className="h-3 w-3" /> Refinar com IA
            </button>
          )}
        </div>
      </div>
      <Textarea rows={rows} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />

      {showRefine && (
        <div className="animate-fade-in mt-2 space-y-2 rounded-lg bg-slate-50 p-2.5">
          <div className="flex flex-wrap gap-1.5">
            {REFINE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleRefine(preset)}
                disabled={refining}
                className="cursor-pointer rounded-full border border-border-strong bg-white px-2 py-1 text-[11px] text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Textarea
              rows={1}
              placeholder="Ou digite uma instrução personalizada..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="text-[13px]"
            />
            <Button type="button" size="sm" onClick={() => handleRefine()} disabled={!instruction.trim() || refining} loading={refining}>
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="mt-1.5">
        <Button type="button" size="sm" variant="ghost" onClick={handleSave} disabled={saving} loading={saving}>
          Salvar {label.toLowerCase()}
        </Button>
      </div>
    </div>
  );
}
