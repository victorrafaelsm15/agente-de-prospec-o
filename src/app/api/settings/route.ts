import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/database/sdrData";
import type { CommercialSettings } from "@/types/lead";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar configurações." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  let body: Partial<Omit<CommercialSettings, "updatedAt">>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  try {
    const settings = await updateSettings(body);
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar configurações." },
      { status: 500 }
    );
  }
}
