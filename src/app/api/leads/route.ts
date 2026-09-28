import { NextRequest, NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { parseLeadFilters } from "@/lib/parseLeadFilters";

export async function GET(request: NextRequest) {
  const filters = parseLeadFilters(request.nextUrl.searchParams);

  try {
    const repository = await getLeadsRepository();
    const result = await repository.list(filters);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao listar leads." },
      { status: 500 }
    );
  }
}
