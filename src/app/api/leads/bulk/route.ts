import { NextRequest, NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { LEAD_STATUSES, type LeadStatus } from "@/types/lead";

interface BulkRequestBody {
  ids?: string[];
  action?: "delete" | "status";
  status?: string;
}

export async function POST(request: NextRequest) {
  let body: BulkRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string") : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "Nenhum lead selecionado." }, { status: 400 });
  }

  try {
    const repository = await getLeadsRepository();

    if (body.action === "delete") {
      const count = await repository.bulkDelete(ids);
      return NextResponse.json({ count });
    }

    if (body.action === "status") {
      if (!body.status || !LEAD_STATUSES.includes(body.status as LeadStatus)) {
        return NextResponse.json({ error: "Status inválido." }, { status: 400 });
      }
      const count = await repository.bulkUpdateStatus(ids, body.status as LeadStatus);
      return NextResponse.json({ count });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao executar ação em lote." },
      { status: 500 }
    );
  }
}
