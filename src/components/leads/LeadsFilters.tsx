"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { LEAD_STATUSES } from "@/types/lead";
import { STATUS_LABELS } from "@/lib/constants";

export function LeadsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== (searchParams.get("search") ?? "")) {
        updateParam("search", search);
      }
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
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
        className="sm:w-44"
      >
        <option value="">Todas as prioridades</option>
        <option value="ALTA">Alta prioridade</option>
        <option value="MEDIA">Média prioridade</option>
        <option value="BAIXA">Baixa prioridade</option>
      </Select>

      <Select
        value={searchParams.get("sortBy") ?? "score"}
        onChange={(e) => updateParam("sortBy", e.target.value)}
        className="sm:w-44"
      >
        <option value="score">Ordenar por score</option>
        <option value="createdAt">Mais recentes</option>
        <option value="name">Nome (A-Z)</option>
      </Select>
    </div>
  );
}
