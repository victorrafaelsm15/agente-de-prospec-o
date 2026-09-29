import Link from "next/link";
import { Users, Sparkles, TrendingUp, MessageCircle, Award, ArrowRight, Heart } from "lucide-react";
import { getLeadsRepository, usingLocalFileDatabase } from "@/database";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { BarList } from "@/components/dashboard/BarList";
import { TopOpportunities } from "@/components/dashboard/TopOpportunities";
import { RecentResearch } from "@/components/dashboard/RecentResearch";
import { CommercialRatesCard } from "@/components/dashboard/CommercialRatesCard";
import { ProposalsFinancialSummary } from "@/components/proposals/ProposalsFinancialSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { STATUS_LABELS } from "@/lib/constants";
import { computeCommercialRates } from "@/lib/sdrInsights";
import { computeProposalFinancialSummary } from "@/lib/proposalCalc";
import { listAllProposals } from "@/database/proposalsData";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const repository = await getLeadsRepository();
  const [stats, recent, statusDistribution, scoreDistribution, recentResearch, topOpportunities, allLeads, proposals] =
    await Promise.all([
      repository.getStats(),
      repository.getRecent(8),
      repository.getStatusDistribution(),
      repository.getScoreDistribution(),
      repository.getRecentResearch(5),
      repository.getTopOpportunities(5),
      repository.listAll({}),
      listAllProposals(),
    ]);
  const rates = computeCommercialRates(allLeads);
  const proposalSummary = computeProposalFinancialSummary(proposals);

  const isEmpty = stats.total === 0;

  const scoreLabels: Record<string, string> = {
    ALTA: "Alta oportunidade",
    MEDIA: "Média oportunidade",
    BAIXA: "Baixa oportunidade",
  };
  const scoreColors: Record<string, string> = {
    ALTA: "bg-emerald-500",
    MEDIA: "bg-amber-500",
    BAIXA: "bg-slate-400",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Visão geral da sua prospecção de clientes.</p>
        </div>
        <Link href="/agent">
          <Button>
            <Sparkles className="h-4 w-4" />
            Encontrar leads
          </Button>
        </Link>
      </div>

      {usingLocalFileDatabase && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <strong className="font-semibold">Modo desenvolvimento:</strong> o Supabase não está
          configurado. Os leads estão sendo salvos localmente em <code className="rounded bg-amber-100 px-1 py-0.5">.data/leads.json</code>,
          apenas para testes. Configure as variáveis do Supabase antes de publicar em produção
          (veja o README).
        </div>
      )}

      {isEmpty ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="Nenhum lead ainda"
          description='Comece encontrando seus primeiros clientes em potencial. Vá até "Agente" e peça, por exemplo, "20 dentistas em Teresina, Piauí".'
          action={
            <Link href="/agent">
              <Button variant="secondary" size="sm">
                Ir para o Agente
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total de leads" value={stats.total} icon={Users} accent="brand" />
            <StatCard label="Novos" value={stats.novos} icon={Sparkles} />
            <StatCard label="Alta prioridade" value={stats.altaPrioridade} icon={TrendingUp} accent="success" />
            <StatCard label="Contatados" value={stats.contatados} icon={MessageCircle} />
            <StatCard label="Respondeu" value={stats.respondeu} icon={MessageCircle} />
            <StatCard label="Reuniões" value={stats.reuniao} icon={Users} />
            <StatCard label="Propostas" value={stats.proposta} icon={Heart} />
            <StatCard label="Clientes" value={stats.clientes} icon={Award} accent="success" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por status</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList
                  items={statusDistribution
                    .filter((s) => s.count > 0)
                    .map((s) => ({ label: STATUS_LABELS[s.status], count: s.count }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por score</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList
                  items={scoreDistribution.map((s) => ({
                    label: scoreLabels[s.range],
                    count: s.count,
                    colorClass: scoreColors[s.range],
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <CommercialRatesCard rates={rates} />
          </div>

          {proposals.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Pipeline de propostas</h2>
              <ProposalsFinancialSummary summary={proposalSummary} />
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopOpportunities leads={topOpportunities} />
            <RecentResearch items={recentResearch} />
          </div>

          <div className="mt-6">
            <RecentActivity leads={recent} />
          </div>
        </>
      )}
    </div>
  );
}
