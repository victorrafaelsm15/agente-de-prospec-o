import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getProposalByToken, getPublicProposalByToken, logProposalEvent } from "@/database/proposalsData";
import { ProposalDocument } from "@/lib/pdf/ProposalDocument";

interface RouteParams {
  params: Promise<{ token: string }>;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  try {
    const proposal = await getPublicProposalByToken(token);
    if (!proposal) {
      return NextResponse.json({ error: "Proposta não encontrada ou link inválido." }, { status: 404 });
    }

    const buffer = await renderToBuffer(<ProposalDocument proposal={proposal} />);

    const internal = await getProposalByToken(token);
    if (internal) await logProposalEvent(internal.id, "pdf_gerado", "cliente");

    const filename = `proposta-${slugify(proposal.leadName)}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar PDF." },
      { status: 500 }
    );
  }
}
