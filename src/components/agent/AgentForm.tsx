"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { NICHE_SUGGESTIONS } from "@/lib/constants";
import type { RunCriteria } from "@/lib/hooks/useProspectingAgent";

interface AgentFormProps {
  disabled: boolean;
  onSubmit: (criteria: RunCriteria) => void;
}

export function AgentForm({ disabled, onSubmit }: AgentFormProps) {
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [quantity, setQuantity] = useState(20);
  const [instructions, setInstructions] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

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
    onSubmit({
      niche: niche.trim(),
      city: city.trim(),
      state: state.trim(),
      quantity,
      additionalInstructions: instructions.trim() || undefined,
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

      <Button type="submit" disabled={disabled} size="lg" className="w-full sm:w-auto">
        <Search className="h-4 w-4" />
        {disabled ? "Pesquisando..." : "Encontrar leads"}
      </Button>
    </form>
  );
}
