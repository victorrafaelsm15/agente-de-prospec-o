import { NextRequest, NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { getProposal, logProposalEvent, updateProposal } from "@/database/proposalsData";
import { generateProposalBriefing } from "@/tools/generateProposalBriefing";
import { checkRateLimit } from "@/lib/rateLimit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const rate = checkRateLimit("ai:proposal-briefing");
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Limite de chamadas de IA atingido. Tente novamente em ${rate.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  try {
    const proposal = await getProposal(id);
    if (!proposal) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });

    const repository = await getLeadsRepository();
    const lead = await repository.getById(proposal.leadId);
    if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

    const { briefing, aiGenerated } = await generateProposalBriefing(lead);
    const updated = await updateProposal(id, { briefing });
    await logProposalEvent(id, "editada", "ia", { field: "briefing" });

    return NextResponse.json({ briefing: updated?.briefing ?? briefing, aiGenerated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar briefing." },
      { status: 500 }
    );
  }
}
