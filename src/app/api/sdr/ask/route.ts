import { NextRequest, NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { listDueFollowUps, listRecentInteractions, listUpcomingMeetings } from "@/database/sdrData";
import { buildAttentionSummary, computeCommercialRates, computeInsights } from "@/lib/sdrInsights";
import { answerSdrQuestion } from "@/tools/answerSdrQuestion";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  let body: { question?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "Informe uma pergunta." }, { status: 400 });
  }

  const rate = checkRateLimit("ai:ask");
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Limite de chamadas de IA atingido. Tente novamente em ${rate.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  try {
    const repository = await getLeadsRepository();
    const [leads, interactions, followUps, meetings] = await Promise.all([
      repository.listAll({}),
      listRecentInteractions(1000),
      listDueFollowUps(50),
      listUpcomingMeetings(20),
    ]);

    const attention = buildAttentionSummary(leads, interactions, followUps, meetings);
    const rates = computeCommercialRates(leads);
    const insights = computeInsights(leads);

    const result = await answerSdrQuestion({ question, leads, attention, rates, insights });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao responder pergunta." },
      { status: 500 }
    );
  }
}
