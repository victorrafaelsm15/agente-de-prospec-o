"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatCurrencyBRL } from "@/lib/proposalCalc";
import type { Service } from "@/types/proposal";

export interface EditableItem {
  key: string;
  serviceId: string | null;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface ProposalItemsEditorProps {
  proposalId: string;
  initialItems: EditableItem[];
  services: Service[];
  onSaved: () => void;
}

let keyCounter = 0;
function newKey() {
  keyCounter += 1;
  return `new-${Date.now()}-${keyCounter}`;
}

export function ProposalItemsEditor({ proposalId, initialItems, services, onSaved }: ProposalItemsEditorProps) {
  const [items, setItems] = useState<EditableItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [scopeDescription, setScopeDescription] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const { showToast } = useToast();

  const dirty = JSON.stringify(items) !== JSON.stringify(initialItems);

  function addItem(preset?: Partial<EditableItem>) {
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        serviceId: preset?.serviceId ?? null,
        name: preset?.name ?? "",
        description: preset?.description ?? "",
        quantity: preset?.quantity ?? 1,
        unitPrice: preset?.unitPrice ?? 0,
      },
    ]);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function moveItem(index: number, direction: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateItem(key: string, patch: Partial<EditableItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function addFromCatalog(serviceId: string) {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    addItem({
      serviceId: service.id,
      name: service.name,
      description: service.description ?? "",
      quantity: 1,
      unitPrice: service.defaultPrice ?? 0,
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            serviceId: i.serviceId,
            name: i.name,
            description: i.description || null,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao salvar itens.");
      showToast("Itens salvos.");
      onSaved();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao salvar itens.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSuggest() {
    if (!scopeDescription.trim()) return;
    setSuggesting(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/ai/scope-suggestion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: scopeDescription }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao sugerir escopo.");
      for (const suggestion of data.items) {
        addItem({
          serviceId: suggestion.matchedServiceId,
          name: suggestion.name,
          description: suggestion.description,
          quantity: suggestion.quantity,
          unitPrice: suggestion.suggestedUnitPrice ?? 0,
        });
      }
      showToast(
        data.aiGenerated
          ? "Itens sugeridos pela IA — revise os preços antes de salvar."
          : "Sugestão gerada por regras (IA não configurada) — revise antes de salvar."
      );
      setScopeDescription("");
      setShowSuggest(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao sugerir escopo.", "error");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="space-y-4">
      {services.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Adicionar do catálogo:</span>
          {services.slice(0, 6).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => addFromCatalog(s.id)}
              className="cursor-pointer rounded-full border border-border-strong bg-white px-2.5 py-1 text-[12px] text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              + {s.name}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted">Nenhum item adicionado ainda.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.key} className="rounded-xl border border-border p-3">
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                    aria-label="Mover para cima"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                    aria-label="Mover para baixo"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Nome do item"
                    value={item.name}
                    onChange={(e) => updateItem(item.key, { name: e.target.value })}
                  />
                  <Textarea
                    rows={2}
                    placeholder="Descrição (opcional)"
                    value={item.description}
                    onChange={(e) => updateItem(item.key, { description: e.target.value })}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-muted">
                      Qtd.
                      <Input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) })}
                        className="h-8 w-20"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted">
                      Valor unit. (R$)
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.key, { unitPrice: Number(e.target.value) })}
                        className="h-8 w-28"
                      />
                    </label>
                    <span className="ml-auto text-sm font-semibold text-foreground">
                      {formatCurrencyBRL(Math.max(0, item.quantity) * Math.max(0, item.unitPrice))}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-danger"
                  aria-label="Remover item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => addItem()}>
          <Plus className="h-3.5 w-3.5" /> Adicionar item
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowSuggest((v) => !v)}>
          <Sparkles className="h-3.5 w-3.5" /> Sugerir com IA
        </Button>
        {dirty && (
          <Button type="button" size="sm" onClick={handleSave} disabled={saving} loading={saving} className="ml-auto">
            Salvar itens
          </Button>
        )}
      </div>

      {showSuggest && (
        <div className="animate-fade-in space-y-2 rounded-lg border border-border bg-slate-50 p-3">
          <Textarea
            rows={2}
            placeholder='Ex: "Quero um site premium com páginas de serviços, equipe, contato e agendamento."'
            value={scopeDescription}
            onChange={(e) => setScopeDescription(e.target.value)}
          />
          <Button type="button" size="sm" onClick={handleSuggest} disabled={!scopeDescription.trim() || suggesting} loading={suggesting}>
            Gerar sugestão
          </Button>
        </div>
      )}
    </div>
  );
}
