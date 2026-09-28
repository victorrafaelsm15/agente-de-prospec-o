import { NextRequest } from "next/server";
import { getLeadsRepository } from "@/database";
import { parseLeadFilters } from "@/lib/parseLeadFilters";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Lead } from "@/types/lead";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function leadToRow(lead: Lead): string[] {
  return [
    lead.name,
    lead.category,
    lead.city,
    lead.state,
    lead.website ?? "",
    lead.instagram ?? "",
    lead.phone ?? "",
    lead.whatsapp ?? "",
    String(lead.score),
    PRIORITY_LABELS[lead.priority],
    STATUS_LABELS[lead.status],
    lead.aiAnalysis ?? "",
    formatDate(lead.createdAt),
  ];
}

const HEADERS = [
  "Nome",
  "Nicho",
  "Cidade",
  "Estado",
  "Site",
  "Instagram",
  "Telefone",
  "WhatsApp",
  "Score",
  "Prioridade",
  "Status",
  "Análise",
  "Data da pesquisa",
];

export async function GET(request: NextRequest) {
  const filters = parseLeadFilters(request.nextUrl.searchParams);

  try {
    const repository = await getLeadsRepository();
    const leads = await repository.listAll(filters);

    const lines = [HEADERS, ...leads.map(leadToRow)]
      .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
      .join("\r\n");

    // BOM para o Excel reconhecer UTF-8 corretamente.
    const csv = "﻿" + lines;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="prospect-ai-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Erro ao exportar leads.",
      { status: 500 }
    );
  }
}
