import { NextRequest, NextResponse } from "next/server";
import { replaceProposalItems } from "@/database/proposalsData";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ItemInput {
  serviceId?: string | null;
  name?: string;
  description?: string | null;
  quantity?: number;
  unitPrice?: number;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: { items?: ItemInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const items = (body.items ?? []).filter((item) => item.name?.trim());
  if (items.some((item) => !item.name?.trim())) {
    return NextResponse.json({ error: "Todo item precisa de um nome." }, { status: 400 });
  }

  try {
    const proposal = await replaceProposalItems(
      id,
      items.map((item) => ({
        serviceId: item.serviceId ?? null,
        name: item.name!.trim(),
        description: item.description ?? null,
        quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
        unitPrice: item.unitPrice ?? 0,
      }))
    );
    if (!proposal) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
    return NextResponse.json({ proposal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar itens." },
      { status: 500 }
    );
  }
}
