import { NextRequest, NextResponse } from "next/server";
import { getProposal, logProposalEvent, updateProposal } from "@/database/proposalsData";
import { refineProposalText } from "@/tools/refineProposalText";
import { checkRateLimit } from "@/lib/rateLimit";
import type { ProposalDiagnosis } from "@/types/proposal";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const TOP_LEVEL_FIELDS = ["terms", "paymentTerms", "timeline", "scopeNotes"] as const;
type TopLevelField = (typeof TOP_LEVEL_FIELDS)[number];
const DIAGNOSIS_FIELDS = ["situacaoAtual", "oportunidades", "solucaoProposta"] as const;
type DiagnosisField = (typeof DIAGNOSIS_FIELDS)[number];

interface PostBody {
  field?: string;
  instruction?: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.field || !body.instruction?.trim()) {
    return NextResponse.json({ error: "Informe o campo e a instrução." }, { status: 400 });
  }

  const rate = checkRateLimit("ai:proposal-refine");
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Limite de chamadas de IA atingido. Tente novamente em ${rate.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  try {
    const proposal = await getProposal(id);
    if (!proposal) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });

    const isDiagnosisField = body.field.startsWith("diagnosis.");
    let originalText = "";

    if (isDiagnosisField) {
      const key = body.field.slice("diagnosis.".length) as DiagnosisField;
      if (!DIAGNOSIS_FIELDS.includes(key)) {
        return NextResponse.json({ error: "Campo inválido." }, { status: 400 });
      }
      originalText = proposal.diagnosis[key] ?? "";
    } else {
      if (!TOP_LEVEL_FIELDS.includes(body.field as TopLevelField)) {
        return NextResponse.json({ error: "Campo inválido." }, { status: 400 });
      }
      originalText = (proposal[body.field as TopLevelField] as string | null) ?? "";
    }

    const { text, aiGenerated } = await refineProposalText(originalText, body.instruction);

    if (isDiagnosisField) {
      const key = body.field.slice("diagnosis.".length) as DiagnosisField;
      const nextDiagnosis: ProposalDiagnosis = { ...proposal.diagnosis, [key]: text };
      await updateProposal(id, { diagnosis: nextDiagnosis });
    } else {
      await updateProposal(id, { [body.field as TopLevelField]: text });
    }

    await logProposalEvent(id, "editada", "ia", { field: body.field, instruction: body.instruction });

    return NextResponse.json({ text, aiGenerated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao refinar texto." },
      { status: 500 }
    );
  }
}
