import { NextRequest, NextResponse } from "next/server";
import { getLeadsRepository } from "@/database";
import { getSettings, logActivity } from "@/database/sdrData";
import { analyzeWebsite } from "@/tools/analyzeWebsite";
import { generateOutreachMessage } from "@/tools/generateOutreachMessage";
import { generateEmailMessage } from "@/tools/generateEmailMessage";
import { checkRateLimit } from "@/lib/rateLimit";
import type { BusinessCandidate } from "@/agents/types";
import type { Channel, OutreachStyle } from "@/types/lead";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PostBody {
  channel?: Channel;
  style?: OutreachStyle;
}

const VALID_STYLES: OutreachStyle[] = ["DIRETA", "CONSULTIVA", "CASUAL", "PROFISSIONAL"];

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const style = body.style && VALID_STYLES.includes(body.style) ? body.style : "CONSULTIVA";
  const channel = body.channel ?? "WHATSAPP";

  const rate = checkRateLimit("ai:outreach");
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Limite de chamadas de IA atingido. Tente novamente em ${rate.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  try {
    const repository = await getLeadsRepository();
    const lead = await repository.getById(id);
    if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

    const settings = await getSettings().catch(() => null);
    const findings = analyzeWebsite(lead.websiteAnalysis);
    const hasWebsite = Boolean(lead.website) && lead.websiteStatus !== "NAO_ENCONTRADO";
    const business: BusinessCandidate = {
      name: lead.name,
      category: lead.category,
      city: lead.city,
      state: lead.state,
      address: lead.address,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      email: lead.email,
      website: lead.website,
      instagram: lead.instagram,
      description: lead.description,
      source: lead.source,
    };

    if (channel === "EMAIL") {
      const result = await generateEmailMessage({ business, findings, hasWebsite, style, settings });
      await logActivity({
        leadId: id,
        actor: "ia",
        action: "email_gerado",
        description: `Rascunho de e-mail gerado (estilo ${style.toLowerCase()}).`,
      });
      return NextResponse.json(result);
    }

    const result = await generateOutreachMessage({ business, findings, hasWebsite, style, settings });
    await repository.updateOutreachMessage(id, result.message);
    await logActivity({
      leadId: id,
      actor: "ia",
      action: "mensagem_gerada",
      description: `Mensagem de abordagem gerada (estilo ${style.toLowerCase()}).`,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar mensagem." },
      { status: 500 }
    );
  }
}
