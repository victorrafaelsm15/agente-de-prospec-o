import Link from "next/link";
import { FileText } from "lucide-react";
import { getLeadsRepository } from "@/database";
import { listAllProposals } from "@/database/proposalsData";
import { computeProposalFinancialSummary } from "@/lib/proposalCalc";
import { ProposalsFinancialSummary } from "@/components/proposals/ProposalsFinancialSummary";
import { ProposalsList } from "@/components/proposals/ProposalsList";
import { ProposalStatusFilter } from "@/components/proposals/ProposalStatusFilter";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

interface ProposalsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ProposalsPage({ searchParams }: ProposalsPageProps) {
  const { status } = await searchParams;
  const [allProposals, repository] = await Promise.all([listAllProposals(), getLeadsRepository()]);
  const leads = await repository.listAll({});
  const leadNames = new Map(leads.map((l) => [l.id, l.name]));

  const summary = computeProposalFinancialSummary(allProposals);
  const proposals = status ? allProposals.filter((p) => p.status === status) : allProposals;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Propostas</h1>
          <p className="mt-1 text-sm text-muted">Central de propostas comerciais — da geração ao aceite.</p>
        </div>
      </div>

      {allProposals.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Nenhuma proposta ainda"
          description='Abra um lead qualificado e clique em "Criar proposta" para começar.'
          action={
            <Link href="/leads" className="text-sm font-medium text-brand hover:underline">
              Ir para Leads
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <ProposalsFinancialSummary summary={summary} />

          <div className="flex items-center justify-between">
            <ProposalStatusFilter current={status ?? ""} />
          </div>

          {proposals.length === 0 ? (
            <EmptyState icon={<FileText className="h-5 w-5" />} title="Nenhuma proposta com esse status" description="Ajuste o filtro para ver outras propostas." />
          ) : (
            <ProposalsList proposals={proposals} leadNames={leadNames} />
          )}
        </div>
      )}
    </div>
  );
}
