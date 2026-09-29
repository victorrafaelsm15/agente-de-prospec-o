import { NextRequest, NextResponse } from "next/server";
import { deleteProposal, getProposal, updateProposal, type ProposalUpdateInput } from "@/database/proposalsData";
import { PROPOSAL_STATUSES } from "@/types/proposal";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const proposal = await getProposal(id);
    if (!proposal) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
    return NextResponse.json({ proposal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar proposta." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: ProposalUpdateInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (body.status !== undefined && !PROPOSAL_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  try {
    const proposal = await updateProposal(id, body);
    if (!proposal) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });

    // Integração com o CRM: aprovada -> lead vira CLIENTE (V4 seção 32).
    if (body.status === "APROVADA") {
      const { getLeadsRepository } = await import("@/database");
      const repository = await getLeadsRepository();
      await repository.updateStatus(proposal.leadId, "CLIENTE");
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar proposta." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const removed = await deleteProposal(id);
    if (!removed) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir proposta." },
      { status: 500 }
    );
  }
}
