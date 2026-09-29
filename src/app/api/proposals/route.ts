import { NextResponse } from "next/server";
import { listAllProposals } from "@/database/proposalsData";
import { computeProposalFinancialSummary } from "@/lib/proposalCalc";

export async function GET() {
  try {
    const proposals = await listAllProposals();
    const summary = computeProposalFinancialSummary(proposals);
    return NextResponse.json({ proposals, summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar propostas." },
      { status: 500 }
    );
  }
}
