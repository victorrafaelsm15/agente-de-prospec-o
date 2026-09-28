import { NextRequest, NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { listFollowUps, listInteractions, listMeetings } from "@/database/sdrData";
import { computeNextActionRecommendation } from "@/tools/computeNextActionRecommendation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const repository = await getLeadsRepository();
    const lead = await repository.getById(id);
    if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

    const [interactions, followUps, meetings] = await Promise.all([
      listInteractions(id),
      listFollowUps({ leadId: id }),
      listMeetings(id),
    ]);

    const recommendation = computeNextActionRecommendation(lead, interactions, followUps, meetings);
    return NextResponse.json({ recommendation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao calcular próxima ação." },
      { status: 500 }
    );
  }
}
