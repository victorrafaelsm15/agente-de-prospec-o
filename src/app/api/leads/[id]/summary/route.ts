import { NextRequest, NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { summarizeLead } from "@/tools/summarizeLead";
import { checkRateLimit } from "@/lib/rateLimit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const rate = checkRateLimit("ai:summary");
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Limite de chamadas de IA atingido. Tente novamente em ${rate.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  try {
    const repository = await getLeadsRepository();
    const lead = await repository.getById(id);
    if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

    const result = await summarizeLead(lead);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar resumo." },
      { status: 500 }
    );
  }
}
