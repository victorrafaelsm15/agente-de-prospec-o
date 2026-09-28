import { NextRequest, NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { getSettings, logActivity } from "@/database/sdrData";
import { generateBriefing } from "@/tools/generateBriefing";
import { checkRateLimit } from "@/lib/rateLimit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const rate = checkRateLimit("ai:briefing");
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

    const settings = await getSettings().catch(() => null);
    const { briefing, aiGenerated } = await generateBriefing(lead, settings);

    await repository.updateBriefing(id, briefing);

    await logActivity({
      leadId: id,
      actor: "ia",
      action: "briefing_gerado",
      description: aiGenerated ? "Briefing gerado por IA." : "Briefing gerado por regras (IA não configurada).",
    });

    return NextResponse.json({ briefing, aiGenerated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar briefing." },
      { status: 500 }
    );
  }
}
