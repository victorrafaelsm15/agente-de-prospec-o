import { NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { computeCommercialRates, computeInsights } from "@/lib/sdrInsights";

export async function GET() {
  try {
    const repository = await getLeadsRepository();
    const leads = await repository.listAll({});
    const rates = computeCommercialRates(leads);
    const insights = computeInsights(leads);
    return NextResponse.json({ rates, insights, totalLeads: leads.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao calcular insights." },
      { status: 500 }
    );
  }
}
