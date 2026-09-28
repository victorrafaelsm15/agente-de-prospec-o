import type {
  LeadPriority,
  Opportunity,
  WebsiteAnalysis,
} from "@/types/lead";

interface ScoringInput {
  websiteAnalysis: WebsiteAnalysis;
  hasWebsite: boolean;
  hasInstagram: boolean;
  hasPhone: boolean;
  hasAddress: boolean;
  category: string;
}

const DIGITAL_PRESENCE_DEPENDENT_CATEGORIES = [
  "estética",
  "beleza",
  "moda",
  "decoração",
  "arquitetura",
  "fotografia",
  "gastronomia",
  "restaurante",
  "academia",
  "fitness",
  "consultoria",
  "imobiliária",
];

export interface ScoreResult {
  score: number;
  priority: LeadPriority;
  opportunities: Opportunity[];
}

export function calculateOpportunityScore(input: ScoringInput): ScoreResult {
  const opportunities: Opportunity[] = [];
  const { websiteAnalysis, hasWebsite, hasInstagram, hasPhone, hasAddress, category } =
    input;

  // Necessidade de site
  if (!hasWebsite) {
    opportunities.push({
      label: "Nenhum site oficial identificado",
      points: 30,
      category: "necessidade_de_site",
    });
  } else if (
    websiteAnalysis.status === "ACESSIVEL" &&
    websiteAnalysis.hasViewportMeta === false
  ) {
    opportunities.push({
      label: "Site encontrado parece não ser otimizado para dispositivos móveis",
      points: 20,
      category: "necessidade_de_site",
    });
  } else if (websiteAnalysis.status === "INACESSIVEL") {
    opportunities.push({
      label: "Site encontrado está atualmente inacessível",
      points: 20,
      category: "necessidade_de_site",
    });
  }

  if (
    hasWebsite &&
    websiteAnalysis.status === "ACESSIVEL" &&
    websiteAnalysis.hasCallToAction === false
  ) {
    opportunities.push({
      label: "Site não apresenta chamadas para ação claras",
      points: 15,
      category: "necessidade_de_site",
    });
  }

  if (
    hasWebsite &&
    websiteAnalysis.status === "ACESSIVEL" &&
    websiteAnalysis.hasHttps === false
  ) {
    opportunities.push({
      label: "Site não utiliza conexão segura (HTTPS)",
      points: 15,
      category: "necessidade_de_site",
    });
  }

  if (
    hasWebsite &&
    websiteAnalysis.status === "ACESSIVEL" &&
    !websiteAnalysis.hasWhatsappLink &&
    !websiteAnalysis.hasPhoneLink &&
    !websiteAnalysis.hasEmailLink
  ) {
    opportunities.push({
      label: "Site não oferece nenhum canal de contato direto (telefone, WhatsApp ou e-mail)",
      points: 10,
      category: "necessidade_de_site",
    });
  }

  if (
    hasWebsite &&
    websiteAnalysis.status === "ACESSIVEL" &&
    (websiteAnalysis.h1Count === 0 || !websiteAnalysis.metaDescription)
  ) {
    opportunities.push({
      label: "Site com sinais básicos de SEO fracos (sem heading principal e/ou meta description)",
      points: 10,
      category: "necessidade_de_site",
    });
  }

  // Presença comercial
  if (hasInstagram) {
    opportunities.push({
      label: "Presença ativa em redes sociais (Instagram)",
      points: 10,
      category: "presenca_comercial",
    });
  }

  if (hasPhone && hasAddress) {
    opportunities.push({
      label: "Negócio aparentemente estabelecido (telefone e endereço públicos)",
      points: 10,
      category: "presenca_comercial",
    });
  }

  const categoryLower = category.toLowerCase();
  const dependsOnDigitalPresence = DIGITAL_PRESENCE_DEPENDENT_CATEGORIES.some(
    (keyword) => categoryLower.includes(keyword)
  );
  if (dependsOnDigitalPresence) {
    opportunities.push({
      label: "Segmento com serviços que dependem de boa apresentação digital",
      points: 5,
      category: "presenca_comercial",
    });
  }

  // Oportunidade
  if (!hasWebsite && hasInstagram) {
    opportunities.push({
      label: "Forte sinal de que uma presença digital própria poderia ajudar o negócio",
      points: 10,
      category: "oportunidade",
    });
  }

  const rawScore = opportunities.reduce((sum, o) => sum + o.points, 0);
  const score = Math.min(100, rawScore);

  let priority: LeadPriority = "BAIXA";
  if (score >= 60) priority = "ALTA";
  else if (score >= 30) priority = "MEDIA";

  return { score, priority, opportunities };
}
