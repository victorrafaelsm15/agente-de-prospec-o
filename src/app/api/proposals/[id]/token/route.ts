import { NextRequest, NextResponse } from "next/server";
import { createProposalToken, getActiveProposalToken, revokeProposalToken } from "@/database/proposalsData";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const token = await getActiveProposalToken(id);
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar link." },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const existing = await getActiveProposalToken(id);
    if (existing) await revokeProposalToken(existing.id);
    const token = await createProposalToken(id);
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar link." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const existing = await getActiveProposalToken(id);
    if (existing) await revokeProposalToken(existing.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao revogar link." },
      { status: 500 }
    );
  }
}
