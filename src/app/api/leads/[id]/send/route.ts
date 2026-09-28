import { NextRequest, NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { createInteraction, logActivity } from "@/database/sdrData";
import { isEmailApiConfigured, isWhatsappApiConfigured } from "@/lib/env";
import { normalizeWhatsappUrl } from "@/lib/contactLinks";
import { sendWhatsapp } from "@/tools/sendWhatsapp";
import { sendEmail } from "@/tools/sendEmail";
import { CHANNELS, type Channel } from "@/types/lead";
import { CHANNEL_LABELS } from "@/lib/constants";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PostBody {
  channel?: Channel;
  message?: string;
  subject?: string;
  /**
   * true quando o próprio cliente já abriu o link (wa.me/mailto) e está
   * apenas confirmando que a mensagem foi enviada manualmente — usado
   * quando não há integração oficial configurada para o canal.
   */
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

  if (!body.channel || !CHANNELS.includes(body.channel)) {
    return NextResponse.json({ error: "Canal inválido." }, { status: 400 });
  }
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "A mensagem não pode estar vazia." }, { status: 400 });
  }

  try {
    const repository = await getLeadsRepository();
    const lead = await repository.getById(id);
    if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

    let sent = false;
    let sendError: string | null = null;
    let viaOfficialApi = false;

    if (body.channel === "WHATSAPP" && isWhatsappApiConfigured) {
      viaOfficialApi = true;
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
      viaOfficialApi = true;
      if (!lead.email) {
        sendError = "Nenhum e-mail verificado para este lead.";
      } else {
        const result = await sendEmail(lead.email, body.subject ?? "Contato", body.message);
        sent = result.sent;
        sendError = result.error;
      }
    } else {
      // Sem integração oficial: o cliente já abriu o link manualmente
      // (wa.me/mailto/instagram/tel). Só registramos a interação.
      sent = Boolean(body.confirmedManually);
      if (!sent) sendError = "Confirmação de envio manual não recebida.";
    }

    const interaction = await createInteraction({
      leadId: id,
      channel: body.channel,
      direction: "SAIDA",
      message: body.subject ? `${body.subject}\n\n${body.message}` : body.message,
      status: sent ? "ENVIADO" : "FALHOU",
    });

    await logActivity({
      leadId: id,
      actor: "usuario",
      action: sent ? "mensagem_enviada" : "envio_falhou",
      description: sent
        ? `Mensagem enviada via ${CHANNEL_LABELS[body.channel]}${viaOfficialApi ? " (API oficial)" : ""}.`
        : `Falha ao enviar via ${CHANNEL_LABELS[body.channel]}: ${sendError}`,
    });

    if (!sent) {
      return NextResponse.json({ sent: false, error: sendError, interaction }, { status: 502 });
    }

    return NextResponse.json({ sent: true, interaction });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao enviar mensagem." },
      { status: 500 }
    );
  }
}
