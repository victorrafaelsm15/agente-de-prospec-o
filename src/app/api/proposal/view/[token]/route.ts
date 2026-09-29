import { NextRequest, NextResponse } from "next/server";
import { getPublicProposalByToken, recordProposalView } from "@/database/proposalsData";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  try {
    const proposal = await getPublicProposalByToken(token);
    if (!proposal) {
      return NextResponse.json({ error: "Proposta não encontrada ou link inválido." }, { status: 404 });
    }
    await recordProposalView(token);
    return NextResponse.json({ proposal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar proposta." },
      { status: 500 }
    );
  }
}
