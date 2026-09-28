import { NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";

export async function GET() {
  try {
    const repository = await getLeadsRepository();
    const [stats, recent] = await Promise.all([
      repository.getStats(),
      repository.getRecent(8),
    ]);
    return NextResponse.json({ stats, recent });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar dashboard." },
      { status: 500 }
    );
  }
}
