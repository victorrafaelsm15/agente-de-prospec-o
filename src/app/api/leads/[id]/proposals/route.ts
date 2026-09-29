import { NextRequest, NextResponse } from "next/server";
import { createProposal, listProposalsForLead } from "@/database/proposalsData";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const proposals = await listProposalsForLead(id);
    return NextResponse.json({ proposals });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar propostas." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const proposal = await createProposal({
      leadId: id,
      title: body.title?.trim() || "Proposta comercial",
      tone: body.tone ?? null,
    });
    return NextResponse.json({ proposal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar proposta." },
      { status: 500 }
    );
  }
}
