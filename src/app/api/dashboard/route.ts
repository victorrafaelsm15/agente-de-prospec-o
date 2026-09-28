import { NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";

export async function GET() {
  try {
    const repository = await getLeadsRepository();
    const [stats, recent, statusDistribution, scoreDistribution, recentResearch, topOpportunities] =
      await Promise.all([
        repository.getStats(),
        repository.getRecent(8),
        repository.getStatusDistribution(),
        repository.getScoreDistribution(),
        repository.getRecentResearch(5),
        repository.getTopOpportunities(5),
      ]);
    return NextResponse.json({
      stats,
      recent,
      statusDistribution,
      scoreDistribution,
      recentResearch,
      topOpportunities,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar dashboard." },
      { status: 500 }
    );
  }
}
