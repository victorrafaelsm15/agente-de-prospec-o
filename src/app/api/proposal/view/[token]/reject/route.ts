import { NextRequest, NextResponse } from "next/server";
import { getProposalByToken, logProposalEvent, updateProposal } from "@/database/proposalsData";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const proposal = await getProposalByToken(token);
    if (!proposal) {
      return NextResponse.json({ error: "Proposta não encontrada ou link inválido." }, { status: 404 });
    }
    if (proposal.status === "APROVADA") {
      return NextResponse.json({ error: "Esta proposta já foi aceita e não pode ser recusada." }, { status: 409 });
    }

    await updateProposal(proposal.id, {
      status: "RECUSADA",
      rejectionReason: body.reason ?? null,
    });
    await logProposalEvent(proposal.id, "recusada", "cliente", { reason: body.reason ?? null });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao registrar recusa." },
      { status: 500 }
    );
  }
}
