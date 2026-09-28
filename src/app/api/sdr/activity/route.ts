import { NextResponse } from "next/server";
import { listRecentActivity } from "@/database/sdrData";

export async function GET() {
  try {
    const activity = await listRecentActivity(30);
    return NextResponse.json({ activity });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar atividade." },
      { status: 500 }
    );
  }
}
