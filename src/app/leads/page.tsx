import Link from "next/link";
import { Users, Sparkles } from "lucide-react";
import { getLeadsRepository } from "@/database";
import { LeadsFilters } from "@/components/leads/LeadsFilters";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { Pagination } from "@/components/leads/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { LeadFilters, LeadPriority, LeadStatus } from "@/types/lead";
import { LEAD_STATUSES } from "@/types/lead";

export const dynamic = "force-dynamic";

const VALID_PRIORITIES: LeadPriority[] = ["BAIXA", "MEDIA", "ALTA"];
const PAGE_SIZE = 20;

interface LeadsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;

  const status = params.status && LEAD_STATUSES.includes(params.status as LeadStatus)
    ? (params.status as LeadStatus)
    : undefined;
  const priority = params.priority && VALID_PRIORITIES.includes(params.priority as LeadPriority)
    ? (params.priority as LeadPriority)
    : undefined;
  const page = Number(params.page) || 1;

  const filters: LeadFilters = {
    search: params.search || undefined,
    status,
    priority,
    sortBy: (params.sortBy as LeadFilters["sortBy"]) ?? "score",
    sortDir: "desc",
    page,
    pageSize: PAGE_SIZE,
  };

  const repository = await getLeadsRepository();
  const { leads, total } = await repository.list(filters);
  const stats = await repository.getStats();

  const hasAnyFilter = Boolean(params.search || params.status || params.priority);

  function buildHref(targetPage: number) {
    const next = new URLSearchParams();
    if (params.search) next.set("search", params.search);
    if (params.status) next.set("status", params.status);
    if (params.priority) next.set("priority", params.priority);
    if (params.sortBy) next.set("sortBy", params.sortBy);
    next.set("page", String(targetPage));
    return `/leads?${next.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Leads</h1>
          <p className="mt-1 text-sm text-muted">{stats.total} leads na sua base de prospecção.</p>
        </div>
        <Link href="/agent">
          <Button size="sm">
            <Sparkles className="h-4 w-4" />
            Encontrar mais leads
          </Button>
        </Link>
      </div>

      {stats.total === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="Nenhum lead ainda"
          description='Vá até "Agente" para pesquisar seus primeiros clientes em potencial.'
          action={
            <Link href="/agent">
              <Button variant="secondary" size="sm">
                Ir para o Agente
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <LeadsFilters />

          {leads.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="Nenhum lead encontrado"
              description={
                hasAnyFilter
                  ? "Ajuste os filtros de busca, status ou prioridade para ver outros leads."
                  : "Não há leads para exibir."
              }
            />
          ) : (
            <>
              <LeadsTable leads={leads} />
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} buildHref={buildHref} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
