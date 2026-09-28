import { findBusinesses } from "@/tools/findBusinesses";
import { inspectWebsite } from "@/tools/inspectWebsite";
import { analyzeWebsite } from "@/tools/analyzeWebsite";
import { generateLeadAnalysis } from "@/tools/generateLeadAnalysis";
import { generateOutreachMessage } from "@/tools/generateOutreachMessage";
import { saveLead } from "@/tools/saveLead";
import { calculateOpportunityScore } from "@/lib/scoring";
import type { NewLead } from "@/database/leadsRepository";
import type { AgentEvent, BusinessCandidate, ProspectingCriteria } from "@/agents/types";
import type { Evidence, WebsiteAnalysis } from "@/types/lead";

type EmitFn = (event: AgentEvent) => void;

/**
 * ProspectingAgent — orquestra a sequência de ferramentas que transforma
 * critérios de busca em leads salvos, emitindo eventos de progresso a cada
 * etapa para que a interface possa mostrar o que está acontecendo.
 *
 * Fluxo: interpretar critérios -> pesquisar negócios -> remover duplicados
 * -> (por candidato) inspecionar site -> analisar presença digital ->
 * avaliar oportunidade -> gerar análise -> gerar abordagem -> salvar lead.
 */
export class ProspectingAgent {
  async run(criteria: ProspectingCriteria, emit: EmitFn): Promise<void> {
    emit({
      type: "step",
      step: "interpretar_criterios",
      status: "done",
      message: `Critérios: ${criteria.quantity} "${criteria.niche}" em ${criteria.city}/${criteria.state}.`,
    });

    emit({
      type: "step",
      step: "pesquisar_negocios",
      status: "running",
      message: "Pesquisando negócios...",
    });

    let candidates: BusinessCandidate[];
    try {
      const result = await findBusinesses(criteria);

      if (!result.configured && !result.usedDemoData) {
        emit({
          type: "step",
          step: "pesquisar_negocios",
          status: "error",
          message: result.warning ?? "Pesquisa externa não configurada.",
        });
        emit({ type: "done", count: 0, requested: criteria.quantity });
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
      emit({ type: "done", count: 0, requested: criteria.quantity });
      return;
    }

    if (candidates.length === 0) {
      emit({ type: "done", count: 0, requested: criteria.quantity });
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

    for (const [index, candidate] of uniqueCandidates.entries()) {
      const progressLabel = `(${index + 1}/${uniqueCandidates.length}) ${candidate.name}`;

      try {
        emit({
          type: "step",
          step: "analisar_presenca_digital",
          status: "running",
          message: `Analisando presença digital — ${progressLabel}`,
        });
        const websiteAnalysis = await inspectWebsite(candidate.website);
        const findings = analyzeWebsite(websiteAnalysis);

        const hasWebsite = Boolean(candidate.website) && websiteAnalysis.status !== "NAO_ENCONTRADO";
        const { score, priority, opportunities } = calculateOpportunityScore({
          websiteAnalysis,
          hasWebsite,
          hasInstagram: Boolean(candidate.instagram),
          hasPhone: Boolean(candidate.phone),
          hasAddress: Boolean(candidate.address),
          category: candidate.category,
        });

        emit({
          type: "step",
          step: "gerar_analise",
          status: "running",
          message: `Preparando leads — gerando análise de ${candidate.name}...`,
        });
        const { analysis, aiGenerated: analysisAiGenerated } = await generateLeadAnalysis({
          business: candidate,
          findings,
          opportunities,
          score,
        });

        const { message: outreachMessage, aiGenerated: messageAiGenerated } =
          await generateOutreachMessage({ business: candidate, findings, hasWebsite });

        const evidence: Evidence[] = buildEvidence(candidate, websiteAnalysis);

        const newLead: NewLead = {
          name: candidate.name,
          category: candidate.category,
          city: candidate.city,
          state: candidate.state,
          website: candidate.website,
          instagram: candidate.instagram,
          phone: candidate.phone,
          address: candidate.address,
          description: candidate.description,
          websiteStatus: websiteAnalysis.status,
          websiteAnalysis,
          opportunities,
          score,
          priority,
          aiAnalysis: analysis,
          outreachMessage,
          aiGenerated: analysisAiGenerated || messageAiGenerated,
          status: "NOVO",
          source: candidate.source,
          evidence,
          researchQuery: `${criteria.niche} em ${criteria.city}, ${criteria.state}`,
        };

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

    emit({ type: "done", count: savedCount, requested: criteria.quantity });
  }
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

function buildEvidence(candidate: BusinessCandidate, websiteAnalysis: WebsiteAnalysis): Evidence[] {
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

  return evidence;
}
