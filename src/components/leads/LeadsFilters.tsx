"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, Download, LayoutGrid, List, Kanban } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { LEAD_STATUSES } from "@/types/lead";
import { STATUS_LABELS } from "@/lib/constants";

export type LeadsView = "table" | "cards" | "kanban";

const TRI_STATE_OPTIONS = [
  { value: "", label: "Qualquer" },
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
];

function TriStateSelect({
  label,
  param,
  searchParams,
  onChange,
}: {
  label: string;
  param: string;
  searchParams: URLSearchParams;
  onChange: (param: string, value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </label>
      <Select
        value={searchParams.get(param) ?? ""}
        onChange={(e) => onChange(param, e.target.value)}
        className="h-9 text-[13px]"
      >
        {TRI_STATE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function LeadsFilters({ view, selectedCount }: { view: LeadsView; selectedCount?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [showMore, setShowMore] = useState(false);

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const setView = useCallback(
    (newView: LeadsView) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", newView);
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== (searchParams.get("search") ?? "")) {
        updateParam("search", search);
      }
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const moreFiltersActive = ["hasWebsite", "hasInstagram", "hasWhatsapp", "outdatedWebsite"].some(
    (key) => searchParams.get(key)
  );

  const exportHref = `/api/leads/export?${searchParams.toString()}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nome, cidade ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={searchParams.get("status") ?? ""}
          onChange={(e) => updateParam("status", e.target.value)}
          className="sm:w-44"
        >
          <option value="">Todos os status</option>
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </Select>

        <Select
          value={searchParams.get("priority") ?? ""}
          onChange={(e) => updateParam("priority", e.target.value)}
          className="sm:w-40"
        >
          <option value="">Todas as prioridades</option>
          <option value="ALTA">Alta prioridade</option>
          <option value="MEDIA">Média prioridade</option>
          <option value="BAIXA">Baixa prioridade</option>
        </Select>

        <Select
          value={searchParams.get("sortBy") ?? "score"}
          onChange={(e) => updateParam("sortBy", e.target.value)}
          className="sm:w-40"
        >
          <option value="score">Maior score</option>
          <option value="createdAt">Mais recentes</option>
          <option value="name">Nome (A-Z)</option>
        </Select>

        <Button
          type="button"
          variant={moreFiltersActive ? "primary" : "secondary"}
          size="md"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Mais filtros
        </Button>
      </div>

      {showMore && (
        <div className="animate-fade-in grid grid-cols-2 gap-3 rounded-xl border border-border bg-slate-50/60 p-3 sm:grid-cols-4">
          <TriStateSelect label="Possui site" param="hasWebsite" searchParams={searchParams} onChange={updateParam} />
          <TriStateSelect label="Possui Instagram" param="hasInstagram" searchParams={searchParams} onChange={updateParam} />
          <TriStateSelect label="Possui WhatsApp" param="hasWhatsapp" searchParams={searchParams} onChange={updateParam} />
          <TriStateSelect label="Site desatualizado" param="outdatedWebsite" searchParams={searchParams} onChange={updateParam} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border-strong bg-white p-0.5">
          {(
            [
              { key: "table", icon: List, label: "Tabela" },
              { key: "cards", icon: LayoutGrid, label: "Cards" },
              { key: "kanban", icon: Kanban, label: "Kanban" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setView(opt.key)}
              title={opt.label}
              aria-pressed={view === opt.key}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors cursor-pointer",
                view === opt.key
                  ? "bg-brand-soft text-brand"
                  : "text-slate-500 hover:bg-slate-100 hover:text-foreground"
              )}
            >
              <opt.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {selectedCount ? (
            <span className="text-xs font-medium text-muted">{selectedCount} selecionado(s)</span>
          ) : null}
          <Link href={exportHref} prefetch={false}>
            <Button type="button" variant="secondary" size="sm">
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
