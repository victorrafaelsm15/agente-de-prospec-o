import { NextRequest, NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { LEAD_STATUSES } from "@/types/lead";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const repository = await getLeadsRepository();
    const lead = await repository.getById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar lead." },
      { status: 500 }
    );
  }
}

interface PatchBody {
  status?: string;
  outreachMessage?: string;
  note?: string;
  nextAction?: string | null;
  nextActionDate?: string | null;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: PatchBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  try {
    const repository = await getLeadsRepository();

    if (body.status !== undefined) {
      if (!LEAD_STATUSES.includes(body.status as (typeof LEAD_STATUSES)[number])) {
        return NextResponse.json({ error: "Status inválido." }, { status: 400 });
      }
      const updated = await repository.updateStatus(
        id,
        body.status as (typeof LEAD_STATUSES)[number]
      );
      if (!updated) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
      return NextResponse.json({ lead: updated });
    }

    if (body.outreachMessage !== undefined) {
      const updated = await repository.updateOutreachMessage(id, body.outreachMessage);
      if (!updated) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
      return NextResponse.json({ lead: updated });
    }

    if (body.note !== undefined) {
      const text = body.note.trim();
      if (!text) return NextResponse.json({ error: "A nota não pode estar vazia." }, { status: 400 });
      const updated = await repository.addNote(id, text);
      if (!updated) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
      return NextResponse.json({ lead: updated });
    }

    if (body.nextAction !== undefined || body.nextActionDate !== undefined) {
      const updated = await repository.updateNextAction(
        id,
        body.nextAction ?? null,
        body.nextActionDate ?? null
      );
      if (!updated) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
      return NextResponse.json({ lead: updated });
    }

    return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar lead." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const repository = await getLeadsRepository();
    const removed = await repository.delete(id);
    if (!removed) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir lead." },
      { status: 500 }
    );
  }
}
