import { NextRequest, NextResponse } from "next/server";
import { updateMeetingStatus, logActivity } from "@/database/sdrData";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES = ["AGENDADA", "REALIZADA", "CANCELADA"];

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
    const meeting = await updateMeetingStatus(id, body.status as "AGENDADA" | "REALIZADA" | "CANCELADA");
    if (!meeting) return NextResponse.json({ error: "Reunião não encontrada." }, { status: 404 });
    await logActivity({
      leadId: meeting.leadId,
      actor: "usuario",
      action: "reuniao_atualizada",
      description: `Reunião marcada como ${body.status.toLowerCase()}.`,
    });
    return NextResponse.json({ meeting });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar reunião." },
      { status: 500 }
    );
  }
}
