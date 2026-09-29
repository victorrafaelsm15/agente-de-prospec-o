import { notFound } from "next/navigation";
import { getLeadsRepository } from "@/database";
import {
  getActiveProposalToken,
  getProposal,
  listProposalEvents,
  listProposalVersions,
  listServices,
} from "@/database/proposalsData";
import { ProposalEditor } from "@/components/proposals/ProposalEditor";

export const dynamic = "force-dynamic";

interface ProposalPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) notFound();

  const repository = await getLeadsRepository();
  const [lead, services, versions, events, token] = await Promise.all([
    repository.getById(proposal.leadId),
    listServices(),
    listProposalVersions(id),
    listProposalEvents(id),
    getActiveProposalToken(id),
  ]);

  if (!lead) notFound();

  return (
    <ProposalEditor
      proposal={proposal}
      lead={lead}
      services={services}
      versions={versions}
      events={events}
      initialToken={token}
    />
  );
}
