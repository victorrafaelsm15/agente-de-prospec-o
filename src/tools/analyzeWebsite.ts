import type { WebsiteAnalysis } from "@/types/lead";

export type FindingCategory = "geral" | "seo" | "mobile" | "conversao" | "conteudo";

export interface WebsiteFinding {
  label: string;
  verified: boolean;
  category: FindingCategory;
}

/**
 * analyzeWebsite — interpreta o resultado de inspectWebsite() e produz uma
 * lista de achados em linguagem natural, categorizados, sempre marcando
 * quando algo não pôde ser verificado em vez de presumir. Não avalia design
 * ou identidade visual — isso exigiria renderização/captura de tela, que
 * esta versão não faz; só reporta sinais extraíveis do HTML.
 */
export function analyzeWebsite(analysis: WebsiteAnalysis): WebsiteFinding[] {
  const findings: WebsiteFinding[] = [];

  switch (analysis.status) {
    case "NAO_ENCONTRADO":
      findings.push({
        label: "Não foi identificado um site oficial para este negócio.",
        verified: true,
        category: "geral",
      });
      return findings;
    case "INACESSIVEL":
      findings.push({
        label: "Um site foi encontrado, mas não foi possível acessá-lo no momento da verificação.",
        verified: true,
        category: "geral",
      });
      return findings;
    case "NAO_VERIFICADO":
      findings.push({ label: "Não foi possível verificar o site.", verified: false, category: "geral" });
      return findings;
  }

  // ACESSIVEL
  findings.push({ label: "O site está acessível e respondeu com sucesso.", verified: true, category: "geral" });

  if (analysis.hasHttps === true) {
    findings.push({ label: "O site utiliza conexão segura (HTTPS).", verified: true, category: "geral" });
  } else if (analysis.hasHttps === false) {
    findings.push({ label: "O site não utiliza conexão segura (HTTPS).", verified: true, category: "geral" });
  }

  // SEO básico
  if (analysis.title) {
    findings.push({ label: `Título da página: "${analysis.title}".`, verified: true, category: "seo" });
  } else {
    findings.push({ label: "Não foi possível identificar um título claro na página.", verified: true, category: "seo" });
  }
  if (analysis.metaDescription) {
    findings.push({ label: "A página possui meta description configurada.", verified: true, category: "seo" });
  } else {
    findings.push({ label: "A página não possui meta description (afeta como aparece no Google).", verified: true, category: "seo" });
  }
  if (analysis.h1Count !== null) {
    if (analysis.h1Count === 0) {
      findings.push({ label: "A página não possui um heading H1 principal.", verified: true, category: "seo" });
    } else if (analysis.h1Count > 1) {
      findings.push({ label: `A página possui ${analysis.h1Count} headings H1 (ideal é apenas 1).`, verified: true, category: "seo" });
    } else {
      findings.push({ label: "A estrutura de heading principal (H1) está presente.", verified: true, category: "seo" });
    }
  }

  // Mobile
  if (analysis.hasViewportMeta === true) {
    findings.push({ label: "A página possui configuração básica para exibição em dispositivos móveis.", verified: true, category: "mobile" });
  } else if (analysis.hasViewportMeta === false) {
    findings.push({ label: "A página aparenta não estar otimizada para dispositivos móveis.", verified: true, category: "mobile" });
  }

  // Conversão / contato
  if (analysis.hasCallToAction === true) {
    findings.push({ label: "Foram identificadas chamadas para ação (ex: contato, orçamento).", verified: true, category: "conversao" });
  } else if (analysis.hasCallToAction === false) {
    findings.push({ label: "Não foram identificadas chamadas para ação claras.", verified: true, category: "conversao" });
  }
  if (analysis.hasWhatsappLink) {
    findings.push({ label: "O site possui um link direto para WhatsApp.", verified: true, category: "conversao" });
  }
  if (analysis.hasPhoneLink) {
    findings.push({ label: "O site possui um link de telefone clicável.", verified: true, category: "conversao" });
  }
  if (!analysis.hasWhatsappLink && !analysis.hasPhoneLink && analysis.hasCallToAction === false) {
    findings.push({ label: "Não foram encontrados links diretos de contato (telefone ou WhatsApp) no site.", verified: true, category: "conversao" });
  }

  // Conteúdo
  if (analysis.wordCount !== null) {
    if (analysis.wordCount < 80) {
      findings.push({ label: "A página tem pouco conteúdo textual visível (pode indicar informações insuficientes).", verified: true, category: "conteudo" });
    } else {
      findings.push({ label: "A página apresenta um volume de conteúdo textual razoável.", verified: true, category: "conteudo" });
    }
  }

  return findings;
}
