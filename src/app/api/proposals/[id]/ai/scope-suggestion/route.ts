import { NextRequest, NextResponse } from "next/server";
import { listServices, logProposalEvent } from "@/database/proposalsData";
import { generateScopeSuggestion } from "@/tools/generateScopeSuggestion";
import { checkRateLimit } from "@/lib/rateLimit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Descreva o que deseja incluir no escopo." }, { status: 400 });
  }

  const rate = checkRateLimit("ai:proposal-scope");
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Limite de chamadas de IA atingido. Tente novamente em ${rate.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  try {
    const catalog = await listServices();
    const result = await generateScopeSuggestion(body.description, catalog);
    await logProposalEvent(id, "editada", "ia", { field: "scope_suggestion" });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao sugerir escopo." },
      { status: 500 }
    );
  }
}
