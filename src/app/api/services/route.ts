import { NextRequest, NextResponse } from "next/server";
import { createService, listServices } from "@/database/proposalsData";

export async function GET(request: NextRequest) {
  const includeInactive = request.nextUrl.searchParams.get("all") === "true";
  try {
    const services = await listServices(includeInactive);
    return NextResponse.json({ services });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar serviços." },
      { status: 500 }
    );
  }
}

interface PostBody {
  name?: string;
  description?: string | null;
  defaultPrice?: number | null;
  unit?: string;
}

export async function POST(request: NextRequest) {
  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Informe o nome do serviço." }, { status: 400 });
  }

  try {
    const service = await createService({
      name: body.name.trim(),
      description: body.description ?? null,
      defaultPrice: body.defaultPrice ?? null,
      unit: body.unit ?? "projeto",
    });
    return NextResponse.json({ service });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar serviço." },
      { status: 500 }
    );
  }
}
