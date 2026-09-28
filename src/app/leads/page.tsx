import Link from "next/link";
import { Users, Sparkles } from "lucide-react";
import { getLeadsRepository } from "@/database";
import { LeadsFilters, type LeadsView } from "@/components/leads/LeadsFilters";
import { LeadsWorkspace } from "@/components/leads/LeadsWorkspace";
import { KanbanBoard } from "@/components/leads/KanbanBoard";
import { Pagination } from "@/components/leads/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { parseLeadFilters } from "@/lib/parseLeadFilters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface LeadsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const urlParams = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1]))
  );

  const view: LeadsView =
    params.view === "cards" || params.view === "kanban" ? (params.view as LeadsView) : "table";

  const filters = parseLeadFilters(urlParams);
  filters.pageSize = PAGE_SIZE;

  const repository = await getLeadsRepository();
  const stats = await repository.getStats();

  const isKanban = view === "kanban";
  const { leads, total } = isKanban
    ? { leads: [], total: 0 }
    : await repository.list(filters);

  const hasAnyFilter = Boolean(
    params.search || params.status || params.priority || params.hasWebsite || params.hasInstagram || params.hasWhatsapp || params.outdatedWebsite
  );

  function buildHref(targetPage: number) {
    const next = new URLSearchParams(urlParams);
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
          <LeadsFilters view={view} />

          {isKanban ? (
            <KanbanBoard />
          ) : leads.length === 0 ? (
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
              <LeadsWorkspace leads={leads} view={view} />
              <Pagination page={filters.page ?? 1} pageSize={PAGE_SIZE} total={total} buildHref={buildHref} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
