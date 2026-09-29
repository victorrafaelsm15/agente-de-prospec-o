import { NextRequest, NextResponse } from "next/server";
import { duplicateProposal } from "@/database/proposalsData";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const proposal = await duplicateProposal(id);
    if (!proposal) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
    return NextResponse.json({ proposal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao duplicar proposta." },
      { status: 500 }
    );
  }
}
