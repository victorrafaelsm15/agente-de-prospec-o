import { NextRequest, NextResponse } from "next/server";
import { createMeeting, listMeetings, logActivity } from "@/database/sdrData";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const meetings = await listMeetings(id);
    return NextResponse.json({ meetings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar reuniões." },
      { status: 500 }
    );
  }
}

interface PostBody {
  scheduledAt?: string;
  notes?: string | null;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.scheduledAt || Number.isNaN(new Date(body.scheduledAt).getTime())) {
    return NextResponse.json({ error: "Informe uma data/horário válidos." }, { status: 400 });
  }

  try {
    const meeting = await createMeeting({ leadId: id, scheduledAt: body.scheduledAt, notes: body.notes ?? null });
    await logActivity({
      leadId: id,
      actor: "usuario",
      action: "reuniao_agendada",
      description: `Reunião agendada para ${new Date(meeting.scheduledAt).toLocaleString("pt-BR")}.`,
    });
    return NextResponse.json({ meeting });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao agendar reunião." },
      { status: 500 }
    );
  }
}
