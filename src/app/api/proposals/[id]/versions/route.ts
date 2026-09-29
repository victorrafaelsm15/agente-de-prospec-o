import { NextRequest, NextResponse } from "next/server";
import { createProposalVersion, listProposalVersions } from "@/database/proposalsData";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const versions = await listProposalVersions(id);
    return NextResponse.json({ versions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar versões." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const version = await createProposalVersion(id, body.note ?? null);
    if (!version) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
    return NextResponse.json({ version });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar versão." },
      { status: 500 }
    );
  }
}
