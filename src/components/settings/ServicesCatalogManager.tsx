"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatCurrencyBRL } from "@/lib/proposalCalc";
import type { Service } from "@/types/proposal";

export function ServicesCatalogManager({ initial }: { initial: Service[] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("projeto");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          defaultPrice: price ? Number(price) : null,
          unit,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Falha ao criar serviço.");
      }
      setName("");
      setDescription("");
      setPrice("");
      showToast("Serviço adicionado ao catálogo.");
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao adicionar serviço.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      const response = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      showToast("Serviço removido.");
      router.refresh();
    } catch {
      showToast("Não foi possível remover o serviço.", "error");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catálogo de serviços</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted">
          Serviços reutilizáveis para montar o escopo das suas propostas rapidamente.
        </p>

        {initial.length > 0 && (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {initial.map((service) => (
              <li key={service.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{service.name}</p>
                  {service.description && <p className="truncate text-xs text-muted">{service.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {service.defaultPrice !== null && (
                    <span className="text-muted">
                      {formatCurrencyBRL(service.defaultPrice)}/{service.unit}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(service.id)}
                    disabled={removingId === service.id}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-danger disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input placeholder="Nome do serviço" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input type="number" placeholder="Preço padrão (R$, opcional)" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Input placeholder="Unidade (ex: projeto, hora, página)" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <Button type="button" size="sm" onClick={handleAdd} disabled={!name.trim() || saving} loading={saving}>
          <Plus className="h-3.5 w-3.5" /> Adicionar serviço
        </Button>
      </CardContent>
    </Card>
  );
}
