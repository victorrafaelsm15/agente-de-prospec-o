import { NextRequest, NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { getProposalByToken, logProposalEvent, updateProposal } from "@/database/proposalsData";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  try {
    const proposal = await getProposalByToken(token);
    if (!proposal) {
      return NextResponse.json({ error: "Proposta não encontrada ou link inválido." }, { status: 404 });
    }
    if (proposal.status === "APROVADA") {
      return NextResponse.json({ success: true, alreadyAccepted: true });
    }
    if (proposal.status === "CANCELADA" || proposal.status === "EXPIRADA") {
      return NextResponse.json({ error: "Esta proposta não está mais disponível para aceite." }, { status: 409 });
    }

    await updateProposal(proposal.id, { status: "APROVADA" });
    await logProposalEvent(proposal.id, "aceita", "cliente", { acceptedAt: new Date().toISOString() });

    const repository = await getLeadsRepository();
    await repository.updateStatus(proposal.leadId, "CLIENTE");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao registrar aceite." },
      { status: 500 }
    );
  }
}
