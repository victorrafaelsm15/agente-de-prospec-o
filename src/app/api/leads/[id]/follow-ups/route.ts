import { NextRequest, NextResponse } from "next/server";
import { createFollowUp, listFollowUps, logActivity } from "@/database/sdrData";
import { formatDateOnly } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const followUps = await listFollowUps({ leadId: id });
    return NextResponse.json({ followUps });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar follow-ups." },
      { status: 500 }
    );
  }
}

interface PostBody {
  dueDate?: string;
  reason?: string | null;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.dueDate) {
    return NextResponse.json({ error: "Informe a data do follow-up." }, { status: 400 });
  }

  try {
    const followUp = await createFollowUp({ leadId: id, dueDate: body.dueDate, reason: body.reason ?? null });
    await logActivity({
      leadId: id,
      actor: "usuario",
      action: "followup_criado",
      description: `Follow-up criado para ${formatDateOnly(followUp.dueDate)}.`,
    });
    return NextResponse.json({ followUp });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar follow-up." },
      { status: 500 }
    );
  }
}
