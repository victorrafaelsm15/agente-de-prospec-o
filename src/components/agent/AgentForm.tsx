"use client";

import { useState, type FormEvent } from "react";
import { Search, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { NICHE_SUGGESTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { QualificationCriteria } from "@/agents/types";
import type { RunCriteria } from "@/lib/hooks/useProspectingAgent";

interface AgentFormProps {
  disabled: boolean;
  onSubmit: (criteria: RunCriteria) => void;
}

const CRITERIA_OPTIONS: {
  key: keyof QualificationCriteria;
  label: string;
  excludesKey?: keyof QualificationCriteria;
}[] = [
  { key: "requireNoWebsite", label: "Sem site", excludesKey: "requireOutdatedWebsite" },
  { key: "requireOutdatedWebsite", label: "Site desatualizado", excludesKey: "requireNoWebsite" },
  { key: "requireInstagram", label: "Instagram ativo" },
  { key: "requireEstablishedBusiness", label: "Negócio estabelecido" },
];

export function AgentForm({ disabled, onSubmit }: AgentFormProps) {
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [quantity, setQuantity] = useState(20);
  const [instructions, setInstructions] = useState("");
  const [qualification, setQualification] = useState<QualificationCriteria>({});
  const [formError, setFormError] = useState<string | null>(null);

  function toggleCriteria(key: keyof QualificationCriteria, excludesKey?: keyof QualificationCriteria) {
    setQualification((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (next[key] && excludesKey) next[excludesKey] = false;
      return next;
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (disabled) return;

    if (!niche.trim() || !city.trim() || !state.trim()) {
      setFormError("Preencha nicho, cidade e estado para continuar.");
      return;
    }
    if (!quantity || quantity < 1 || quantity > 50) {
      setFormError("Informe uma quantidade entre 1 e 50.");
      return;
    }

    setFormError(null);
    const activeQualification = Object.fromEntries(
      Object.entries(qualification).filter(([, v]) => v)
    ) as QualificationCriteria;

    onSubmit({
      niche: niche.trim(),
      city: city.trim(),
      state: state.trim(),
      quantity,
      additionalInstructions: instructions.trim() || undefined,
      qualification: Object.keys(activeQualification).length > 0 ? activeQualification : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="niche">Nicho</Label>
          <Input
            id="niche"
            placeholder="Ex: Dentistas"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            disabled={disabled}
            list="niche-suggestions"
          />
          <datalist id="niche-suggestions">
            {NICHE_SUGGESTIONS.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>

        <div>
          <Label htmlFor="quantity">Quantidade de leads</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            max={50}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={disabled}
          />
        </div>

        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            placeholder="Ex: Teresina"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div>
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            placeholder="Ex: Piauí"
            value={state}
            onChange={(e) => setState(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <Label>Critérios de qualificação (opcional)</Label>
        <div className="flex flex-wrap gap-2">
          {CRITERIA_OPTIONS.map((opt) => {
            const active = Boolean(qualification[opt.key]);
            return (
              <button
                key={opt.key}
                type="button"
                disabled={disabled}
                onClick={() => toggleCriteria(opt.key, opt.excludesKey)}
                aria-pressed={active}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  active
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-border-strong bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {active && <Check className="h-3.5 w-3.5" />}
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          Leads que não atenderem aos critérios selecionados (após análise real) serão descartados
          automaticamente da pesquisa.
        </p>
      </div>

      <div>
        <Label htmlFor="instructions">Instruções adicionais (opcional)</Label>
        <Textarea
          id="instructions"
          rows={3}
          placeholder="Ex: Priorize clínicas com presença forte no Instagram e sem site profissional."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          disabled={disabled}
        />
      </div>

      {formError && <p className="text-sm text-danger">{formError}</p>}

      <Button type="submit" disabled={disabled} loading={disabled} size="lg" className="w-full sm:w-auto">
        <Search className="h-4 w-4" />
        {disabled ? "Pesquisando..." : "Encontrar leads"}
      </Button>
    </form>
  );
}
