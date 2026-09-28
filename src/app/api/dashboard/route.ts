import { NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { computeCommercialRates } from "@/lib/sdrInsights";

export async function GET() {
  try {
    const repository = await getLeadsRepository();
    const [stats, recent, statusDistribution, scoreDistribution, recentResearch, topOpportunities, allLeads] =
      await Promise.all([
        repository.getStats(),
        repository.getRecent(8),
        repository.getStatusDistribution(),
        repository.getScoreDistribution(),
        repository.getRecentResearch(5),
        repository.getTopOpportunities(5),
        repository.listAll({}),
      ]);
    const rates = computeCommercialRates(allLeads);
    return NextResponse.json({
      stats,
      recent,
      statusDistribution,
      scoreDistribution,
      recentResearch,
      topOpportunities,
      rates,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar dashboard." },
      { status: 500 }
    );
  }
}
