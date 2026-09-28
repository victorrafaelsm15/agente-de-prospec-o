import { NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { listDueFollowUps, listRecentInteractions, listUpcomingMeetings } from "@/database/sdrData";
import { buildAttentionSummary } from "@/lib/sdrInsights";

export async function GET() {
  try {
    const repository = await getLeadsRepository();
    const [leads, interactions, followUps, meetings] = await Promise.all([
      repository.listAll({}),
      listRecentInteractions(1000),
      listDueFollowUps(50),
      listUpcomingMeetings(20),
    ]);

    const summary = buildAttentionSummary(leads, interactions, followUps, meetings);
    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao calcular pendências." },
      { status: 500 }
    );
  }
}
