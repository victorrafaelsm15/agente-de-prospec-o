import { NextRequest, NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { createInteraction } from "@/database/sdrData";
import { getProposal, logProposalEvent, updateProposal } from "@/database/proposalsData";
import { isEmailApiConfigured, isWhatsappApiConfigured } from "@/lib/env";
import { normalizeWhatsappUrl } from "@/lib/contactLinks";
import { sendWhatsapp } from "@/tools/sendWhatsapp";
import { sendEmail } from "@/tools/sendEmail";
import type { Channel } from "@/types/lead";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PostBody {
  channel?: Channel;
  message?: string;
  subject?: string;
  confirmedManually?: boolean;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.channel || (body.channel !== "WHATSAPP" && body.channel !== "EMAIL")) {
    return NextResponse.json({ error: "Canal inválido." }, { status: 400 });
  }
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "A mensagem não pode estar vazia." }, { status: 400 });
  }

  try {
    const proposal = await getProposal(id);
    if (!proposal) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });

    const repository = await getLeadsRepository();
    const lead = await repository.getById(proposal.leadId);
    if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

    let sent = false;
    let sendError: string | null = null;

    if (body.channel === "WHATSAPP" && isWhatsappApiConfigured) {
      const target = lead.whatsapp ?? lead.phone;
      const url = target ? normalizeWhatsappUrl(target) : null;
      const digits = url ? url.replace("https://wa.me/", "") : null;
      if (!digits) {
        sendError = "Nenhum número de WhatsApp/telefone verificado para este lead.";
      } else {
        const result = await sendWhatsapp(digits, body.message);
        sent = result.sent;
        sendError = result.error;
      }
    } else if (body.channel === "EMAIL" && isEmailApiConfigured) {
      if (!lead.email) {
        sendError = "Nenhum e-mail verificado para este lead.";
      } else {
        const result = await sendEmail(lead.email, body.subject ?? `Proposta: ${proposal.title}`, body.message);
        sent = result.sent;
        sendError = result.error;
      }
    } else {
      sent = Boolean(body.confirmedManually);
      if (!sent) sendError = "Confirmação de envio manual não recebida.";
    }

    await createInteraction({
      leadId: proposal.leadId,
      channel: body.channel,
      direction: "SAIDA",
      message: body.subject ? `${body.subject}\n\n${body.message}` : body.message,
      status: sent ? "ENVIADO" : "FALHOU",
    });

    if (sent) {
      await updateProposal(id, { status: "ENVIADA" });
      await logProposalEvent(id, "enviada", "usuario", { channel: body.channel });
    } else {
      await logProposalEvent(id, "status_alterado", "sistema", { error: sendError });
    }

    if (!sent) {
      return NextResponse.json({ sent: false, error: sendError }, { status: 502 });
    }
    return NextResponse.json({ sent: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao enviar proposta." },
      { status: 500 }
    );
  }
}
