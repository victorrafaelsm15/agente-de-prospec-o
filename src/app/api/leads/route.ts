import { NextRequest, NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import type { LeadFilters, LeadPriority, LeadStatus } from "@/types/lead";
import { LEAD_STATUSES } from "@/types/lead";

const VALID_PRIORITIES: LeadPriority[] = ["BAIXA", "MEDIA", "ALTA"];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const status = params.get("status");
  const priority = params.get("priority");

  const filters: LeadFilters = {
    search: params.get("search") ?? undefined,
    status: status && LEAD_STATUSES.includes(status as LeadStatus) ? (status as LeadStatus) : undefined,
    priority:
      priority && VALID_PRIORITIES.includes(priority as LeadPriority)
        ? (priority as LeadPriority)
        : undefined,
    category: params.get("category") ?? undefined,
    sortBy: (params.get("sortBy") as LeadFilters["sortBy"]) ?? "score",
    sortDir: (params.get("sortDir") as LeadFilters["sortDir"]) ?? "desc",
    page: Number(params.get("page")) || 1,
    pageSize: Number(params.get("pageSize")) || 20,
  };

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
