import { findBusinesses } from "@/tools/findBusinesses";
import { inspectWebsite } from "@/tools/inspectWebsite";
import { analyzeWebsite } from "@/tools/analyzeWebsite";
import { generateLeadAnalysis } from "@/tools/generateLeadAnalysis";
import { generateOutreachMessage } from "@/tools/generateOutreachMessage";
import { saveLead } from "@/tools/saveLead";
import { calculateOpportunityScore } from "@/lib/scoring";
import type { NewLead } from "@/database/leadsRepository";
import type {
  AgentEvent,
  BusinessCandidate,
  ProspectingCriteria,
  QualificationCriteria,
} from "@/agents/types";
import type { Evidence, WebsiteAnalysis } from "@/types/lead";

type EmitFn = (event: AgentEvent) => void;

const MAX_FETCH_QUANTITY = 50;

/**
 * ProspectingAgent — orquestra a sequência de ferramentas que transforma
 * critérios de busca em leads salvos, emitindo eventos de progresso a cada
 * etapa para que a interface possa mostrar o que está acontecendo.
 *
 * Fluxo: interpretar critérios -> pesquisar negócios -> remover duplicados
 * -> (por candidato) inspecionar site -> analisar presença digital ->
 * identificar oportunidades -> gerar mensagens personalizadas -> qualificar
 * (se houver critérios) -> salvar lead.
 */
export class ProspectingAgent {
  async run(criteria: ProspectingCriteria, emit: EmitFn): Promise<void> {
    const qualification = criteria.qualification ?? {};
    const hasQualification = Object.values(qualification).some(Boolean);

    emit({
      type: "step",
      step: "interpretar_criterios",
      status: "done",
      message: `Critérios: ${criteria.quantity} "${criteria.niche}" em ${criteria.city}/${criteria.state}${describeQualification(qualification)}.`,
    });

    emit({
      type: "step",
      step: "pesquisar_negocios",
      status: "running",
      message: "Pesquisando empresas...",
    });

    // Quando há critérios de qualificação, buscamos mais candidatos do que
    // o solicitado, pois parte deles será descartada após a análise real.
    const fetchQuantity = hasQualification
      ? Math.min(MAX_FETCH_QUANTITY, criteria.quantity * 3)
      : criteria.quantity;

    let candidates: BusinessCandidate[];
    try {
      const result = await findBusinesses({ ...criteria, quantity: fetchQuantity });

      if (!result.configured && !result.usedDemoData) {
        emit({
          type: "step",
          step: "pesquisar_negocios",
          status: "error",
          message: result.warning ?? "Pesquisa externa não configurada.",
        });
        emit({ type: "done", count: 0, requested: criteria.quantity, skippedByCriteria: 0 });
        return;
      }

      candidates = result.candidates;

      emit({
        type: "step",
        step: "pesquisar_negocios",
        status: "done",
        message: result.usedDemoData
          ? `${candidates.length} negócios de demonstração gerados (${result.warning ?? ""})`
          : `${candidates.length} negócios encontrados.`,
      });

      if (result.warning && result.usedDemoData) {
        emit({ type: "step", step: "modo_demonstracao", status: "done", message: result.warning });
      }
    } catch (error) {
      emit({
        type: "step",
        step: "pesquisar_negocios",
        status: "error",
        message: error instanceof Error ? error.message : "Erro ao pesquisar negócios.",
      });
      emit({ type: "done", count: 0, requested: criteria.quantity, skippedByCriteria: 0 });
      return;
    }

    if (candidates.length === 0) {
      emit({ type: "done", count: 0, requested: criteria.quantity, skippedByCriteria: 0 });
      return;
    }

    emit({
      type: "step",
      step: "remover_duplicados",
      status: "running",
      message: "Removendo duplicados...",
    });
    const uniqueCandidates = dedupeCandidates(candidates);
    emit({
      type: "step",
      step: "remover_duplicados",
      status: "done",
      message: `${uniqueCandidates.length} candidatos únicos após remoção de duplicados.`,
    });

    let savedCount = 0;
    let skippedByCriteria = 0;

    for (const candidate of uniqueCandidates) {
      if (savedCount >= criteria.quantity) break;

      try {
        emit({
          type: "step",
          step: "analisar_presenca_digital",
          status: "running",
          message: `Analisando presença digital — ${candidate.name}`,
        });
        const { analysis: websiteAnalysis, extractedWhatsapp, extractedEmail, extractedInstagram } =
          await inspectWebsite(candidate.website);
        const findings = analyzeWebsite(websiteAnalysis);

        const hasWebsite = Boolean(candidate.website) && websiteAnalysis.status !== "NAO_ENCONTRADO";
        const whatsapp = candidate.whatsapp ?? extractedWhatsapp;
        const email = candidate.email ?? extractedEmail;
        const instagram = candidate.instagram ?? extractedInstagram;
        // Candidato enriquecido com contatos extraídos de verdade do site
        // (nunca inventados) — usado no restante do processamento.
        const enriched: BusinessCandidate = { ...candidate, instagram, whatsapp, email };

        emit({
          type: "step",
          step: "identificar_oportunidades",
          status: "running",
          message: `Identificando oportunidades — ${candidate.name}`,
        });
        const { score, priority, opportunities } = calculateOpportunityScore({
          websiteAnalysis,
          hasWebsite,
          hasInstagram: Boolean(enriched.instagram),
          hasPhone: Boolean(enriched.phone),
          hasAddress: Boolean(enriched.address),
          category: enriched.category,
        });

        const skipReason = evaluateQualification(qualification, {
          hasWebsite,
          hasInstagram: Boolean(enriched.instagram),
          hasPhone: Boolean(enriched.phone),
          hasAddress: Boolean(enriched.address),
          websiteAnalysis,
        });

        if (skipReason) {
          skippedByCriteria += 1;
          emit({ type: "skipped", name: candidate.name, reason: skipReason });
          emit({
            type: "step",
            step: "identificar_oportunidades",
            status: "done",
            message: `${candidate.name} não atende aos critérios selecionados (${skipReason}) — ignorado.`,
          });
          continue;
        }

        emit({
          type: "step",
          step: "gerar_mensagens",
          status: "running",
          message: `Gerando mensagens personalizadas — ${candidate.name}`,
        });
        const { analysis, aiGenerated: analysisAiGenerated } = await generateLeadAnalysis({
          business: enriched,
          findings,
          opportunities,
          score,
        });

        const { message: outreachMessage, aiGenerated: messageAiGenerated } =
          await generateOutreachMessage({ business: enriched, findings, hasWebsite });

        const evidence: Evidence[] = buildEvidence(candidate, websiteAnalysis, {
          whatsapp: extractedWhatsapp,
          email: extractedEmail,
          instagram: extractedInstagram,
        });

        const now = new Date().toISOString();
        const newLead: NewLead = {
          name: enriched.name,
          category: enriched.category,
          city: enriched.city,
          state: enriched.state,
          website: enriched.website,
          instagram: enriched.instagram,
          phone: enriched.phone,
          whatsapp,
          email,
          address: enriched.address,
          description: enriched.description,
          websiteStatus: websiteAnalysis.status,
          websiteAnalysis,
          opportunities,
          score,
          priority,
          aiAnalysis: analysis,
          outreachMessage,
          aiGenerated: analysisAiGenerated || messageAiGenerated,
          status: "NOVO",
          statusHistory: [{ status: "NOVO", changedAt: now }],
          notes: [],
          nextAction: null,
          nextActionDate: null,
          briefing: null,
          source: candidate.source,
          evidence,
          researchQuery: `${criteria.niche} em ${criteria.city}, ${criteria.state}`,
        };

        emit({
          type: "step",
          step: "salvar_lead",
          status: "running",
          message: `Salvando leads — ${candidate.name}`,
        });
        const { lead, wasDuplicate } = await saveLead(newLead);

        if (!wasDuplicate) {
          savedCount += 1;
          emit({ type: "lead", lead });
        }

        emit({
          type: "step",
          step: "salvar_lead",
          status: "done",
          message: wasDuplicate
            ? `${candidate.name} já existia na base — não duplicado.`
            : `${candidate.name} salvo com sucesso (score ${score}).`,
        });
      } catch (error) {
        emit({
          type: "step",
          step: "processar_candidato",
          status: "error",
          message: `Erro ao processar ${candidate.name}: ${
            error instanceof Error ? error.message : "erro desconhecido"
          }`,
        });
      }
    }

    emit({ type: "done", count: savedCount, requested: criteria.quantity, skippedByCriteria });
  }
}

function describeQualification(q: QualificationCriteria): string {
  const parts: string[] = [];
  if (q.requireInstagram) parts.push("com Instagram");
  if (q.requireNoWebsite) parts.push("sem site");
  if (q.requireOutdatedWebsite) parts.push("com site desatualizado");
  if (q.requireEstablishedBusiness) parts.push("negócio estabelecido");
  return parts.length > 0 ? `, ${parts.join(", ")}` : "";
}

function evaluateQualification(
  q: QualificationCriteria,
  input: {
    hasWebsite: boolean;
    hasInstagram: boolean;
    hasPhone: boolean;
    hasAddress: boolean;
    websiteAnalysis: WebsiteAnalysis;
  }
): string | null {
  if (q.requireInstagram && !input.hasInstagram) {
    return "não foi encontrado Instagram";
  }
  if (q.requireNoWebsite && input.hasWebsite) {
    return "possui site (critério pedia sem site)";
  }
  if (q.requireOutdatedWebsite) {
    const isOutdated =
      input.hasWebsite &&
      (input.websiteAnalysis.hasCallToAction === false ||
        input.websiteAnalysis.hasViewportMeta === false ||
        input.websiteAnalysis.status === "INACESSIVEL");
    if (!isOutdated) return "site não aparenta estar desatualizado";
  }
  if (q.requireEstablishedBusiness && !(input.hasPhone && input.hasAddress)) {
    return "não foi possível confirmar telefone e endereço públicos";
  }
  return null;
}

function dedupeCandidates(candidates: BusinessCandidate[]): BusinessCandidate[] {
  const seen = new Set<string>();
  const result: BusinessCandidate[] = [];

  for (const candidate of candidates) {
    const key = candidate.website
      ? `website:${candidate.website.toLowerCase().replace(/\/$/, "")}`
      : `namecity:${candidate.name.toLowerCase()}:${candidate.city.toLowerCase()}`;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(candidate);
    }
  }

  return result;
}

function buildEvidence(
  candidate: BusinessCandidate,
  websiteAnalysis: WebsiteAnalysis,
  extracted: { whatsapp: string | null; email: string | null; instagram: string | null }
): Evidence[] {
  const evidence: Evidence[] = [
    {
      field: "dados_do_negocio",
      description: `Nome, categoria, endereço e telefone coletados via ${candidate.source}.`,
      source: candidate.source,
    },
  ];

  if (candidate.website) {
    evidence.push({
      field: "site",
      description: `Verificação automática do site em ${websiteAnalysis.checkedAt ?? "data não registrada"}.`,
      source: "Verificação direta (HTTP fetch)",
      url: candidate.website,
    });
  }

  if (extracted.whatsapp && !candidate.whatsapp) {
    evidence.push({
      field: "whatsapp",
      description: "Número de WhatsApp encontrado em link direto no site do negócio.",
      source: "Verificação direta (HTTP fetch)",
    });
  }

  if (extracted.email && !candidate.email) {
    evidence.push({
      field: "email",
      description: "E-mail encontrado em link direto (mailto:) no site do negócio.",
      source: "Verificação direta (HTTP fetch)",
    });
  }

  if (extracted.instagram && !candidate.instagram) {
    evidence.push({
      field: "instagram",
      description: "Perfil do Instagram encontrado em link direto no site do negócio.",
      source: "Verificação direta (HTTP fetch)",
    });
  }

  return evidence;
}
