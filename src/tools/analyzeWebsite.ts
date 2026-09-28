import type { WebsiteAnalysis } from "@/types/lead";

export interface WebsiteFinding {
  label: string;
  verified: boolean;
}

/**
 * analyzeWebsite — interpreta o resultado de inspectWebsite() e produz uma
 * lista de achados em linguagem natural, sempre marcando quando algo não
 * pôde ser verificado em vez de presumir.
 */
export function analyzeWebsite(analysis: WebsiteAnalysis): WebsiteFinding[] {
  const findings: WebsiteFinding[] = [];

  switch (analysis.status) {
    case "NAO_ENCONTRADO":
      findings.push({ label: "Não foi identificado um site oficial para este negócio.", verified: true });
      return findings;
    case "INACESSIVEL":
      findings.push({
        label: "Um site foi encontrado, mas não foi possível acessá-lo no momento da verificação.",
        verified: true,
      });
      return findings;
    case "NAO_VERIFICADO":
      findings.push({ label: "Não foi possível verificar o site.", verified: false });
      return findings;
  }

  // ACESSIVEL
  findings.push({ label: "O site está acessível e respondeu com sucesso.", verified: true });

  if (analysis.hasHttps === true) {
    findings.push({ label: "O site utiliza conexão segura (HTTPS).", verified: true });
  } else if (analysis.hasHttps === false) {
    findings.push({ label: "O site não utiliza conexão segura (HTTPS).", verified: true });
  }

  if (analysis.title) {
    findings.push({ label: `Título da página: "${analysis.title}".`, verified: true });
  } else {
    findings.push({ label: "Não foi possível identificar um título claro na página.", verified: true });
  }

  if (analysis.hasViewportMeta === true) {
    findings.push({ label: "A página possui configuração básica para exibição em dispositivos móveis.", verified: true });
  } else if (analysis.hasViewportMeta === false) {
    findings.push({ label: "A página aparenta não estar otimizada para dispositivos móveis.", verified: true });
  }

  if (analysis.hasCallToAction === true) {
    findings.push({ label: "Foram identificadas chamadas para ação (ex: contato, orçamento).", verified: true });
  } else if (analysis.hasCallToAction === false) {
    findings.push({ label: "Não foram identificadas chamadas para ação claras.", verified: true });
  }

  return findings;
}
