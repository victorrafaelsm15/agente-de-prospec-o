import { NextRequest, NextResponse } from "next/server";
import { updateFollowUpStatus, logActivity } from "@/database/sdrData";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES = ["PENDENTE", "CONCLUIDO", "IGNORADO"];

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  try {
    const followUp = await updateFollowUpStatus(id, body.status as "PENDENTE" | "CONCLUIDO" | "IGNORADO");
    if (!followUp) return NextResponse.json({ error: "Follow-up não encontrado." }, { status: 404 });
    await logActivity({
      leadId: followUp.leadId,
      actor: "usuario",
      action: "followup_atualizado",
      description: `Follow-up marcado como ${body.status.toLowerCase()}.`,
    });
    return NextResponse.json({ followUp });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar follow-up." },
      { status: 500 }
    );
  }
}
