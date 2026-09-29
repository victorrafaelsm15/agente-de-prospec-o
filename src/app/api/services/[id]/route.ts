import { NextRequest, NextResponse } from "next/server";
import { deleteService, updateService } from "@/database/proposalsData";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PatchBody {
  name?: string;
  description?: string | null;
  defaultPrice?: number | null;
  unit?: string;
  active?: boolean;
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
    const service = await updateService(id, body);
    if (!service) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
    return NextResponse.json({ service });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar serviço." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const removed = await deleteService(id);
    if (!removed) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir serviço." },
      { status: 500 }
    );
  }
}
