import { NextRequest, NextResponse } from "next/server";
import { listProposalEvents } from "@/database/proposalsData";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const events = await listProposalEvents(id);
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar histórico." },
      { status: 500 }
    );
  }
}
