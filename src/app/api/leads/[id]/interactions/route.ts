import { NextRequest, NextResponse } from "next/server";
import { createInteraction, listInteractions, logActivity } from "@/database/sdrData";
import { CHANNELS, type Channel, type InteractionDirection, type InteractionStatus } from "@/types/lead";
import { CHANNEL_LABELS } from "@/lib/constants";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const interactions = await listInteractions(id);
    return NextResponse.json({ interactions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar interações." },
      { status: 500 }
    );
  }
}

interface PostBody {
  channel?: string;
  direction?: InteractionDirection;
  message?: string | null;
  status?: InteractionStatus;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.channel || !CHANNELS.includes(body.channel as Channel)) {
    return NextResponse.json({ error: "Canal inválido." }, { status: 400 });
  }

  try {
    const interaction = await createInteraction({
      leadId: id,
      channel: body.channel as Channel,
      direction: body.direction ?? "SAIDA",
      message: body.message ?? null,
      status: body.status ?? "ENVIADO",
    });

    await logActivity({
      leadId: id,
      actor: "usuario",
      action: "interacao_registrada",
      description: `${interaction.direction === "SAIDA" ? "Mensagem enviada" : "Mensagem recebida"} via ${CHANNEL_LABELS[interaction.channel]}.`,
    });

    return NextResponse.json({ interaction });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao registrar interação." },
      { status: 500 }
    );
  }
}
