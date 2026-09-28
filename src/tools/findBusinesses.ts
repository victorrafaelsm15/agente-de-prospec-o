import { env, isGooglePlacesConfigured } from "@/lib/env";
import type { BusinessCandidate, ProspectingCriteria } from "@/agents/types";

export interface FindBusinessesResult {
  candidates: BusinessCandidate[];
  configured: boolean;
  usedDemoData: boolean;
  warning: string | null;
}

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  primaryTypeDisplayName?: { text: string };
}

interface GooglePlacesResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
}

const GOOGLE_PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.internationalPhoneNumber",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.primaryTypeDisplayName",
  "nextPageToken",
].join(",");

/**
 * findBusinesses — ferramenta real de busca de negócios usando a Google
 * Places API (New). Requer GOOGLE_PLACES_API_KEY.
 *
 * Se a chave não estiver configurada:
 *  - por padrão, retorna configured=false e nenhum candidato (a UI deve
 *    exibir "Pesquisa externa não configurada.");
 *  - se ENABLE_DEMO_MODE=true, retorna candidatos fictícios claramente
 *    marcados como demonstração, para permitir testar o restante do fluxo.
 */
export async function findBusinesses(
  criteria: ProspectingCriteria
): Promise<FindBusinessesResult> {
  if (!isGooglePlacesConfigured) {
    if (env.demoModeEnabled) {
      return {
        candidates: buildDemoCandidates(criteria),
        configured: false,
        usedDemoData: true,
        warning:
          "GOOGLE_PLACES_API_KEY não configurada. Exibindo dados de demonstração (ENABLE_DEMO_MODE=true) apenas para teste da interface.",
      };
    }
    return {
      candidates: [],
      configured: false,
      usedDemoData: false,
      warning: "Pesquisa externa não configurada (GOOGLE_PLACES_API_KEY ausente).",
    };
  }

  const candidates: BusinessCandidate[] = [];
  let pageToken: string | undefined;
  const textQuery = `${criteria.niche} em ${criteria.city}, ${criteria.state}`;

  do {
    const body: Record<string, unknown> = pageToken
      ? { pageToken }
      : {
          textQuery,
          languageCode: "pt-BR",
          maxResultCount: Math.min(20, criteria.quantity),
        };

    const response = await fetch(GOOGLE_PLACES_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.googlePlacesApiKey!,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Falha na busca de negócios (Google Places API): ${response.status} ${errorText}`
      );
    }

    const data = (await response.json()) as GooglePlacesResponse;
    for (const place of data.places ?? []) {
      candidates.push({
        name: place.displayName?.text ?? "Não encontrado",
        category: place.primaryTypeDisplayName?.text ?? criteria.niche,
        city: criteria.city,
        state: criteria.state,
        address: place.formattedAddress ?? null,
        phone: place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? null,
        whatsapp: null,
        email: null,
        website: place.websiteUri ?? null,
        instagram: null,
        description: null,
        source: "Google Places API",
      });
    }

    pageToken = data.nextPageToken;
    // A API exige um pequeno intervalo antes que o nextPageToken fique válido.
    if (pageToken && candidates.length < criteria.quantity) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } while (pageToken && candidates.length < criteria.quantity);

  return {
    candidates: candidates.slice(0, criteria.quantity),
    configured: true,
    usedDemoData: false,
    warning: null,
  };
}

function buildDemoCandidates(criteria: ProspectingCriteria): BusinessCandidate[] {
  const count = Math.min(criteria.quantity, 10);
  return Array.from({ length: count }, (_, i) => ({
    name: `${criteria.niche} Demonstração ${i + 1}`,
    category: criteria.niche,
    city: criteria.city,
    state: criteria.state,
    address: "Não encontrado",
    phone: "Não encontrado",
    whatsapp: null,
    email: null,
    website: i % 3 === 0 ? null : `https://exemplo-demo-${i + 1}.com.br`,
    instagram: i % 2 === 0 ? `@demo_${criteria.niche.toLowerCase().replace(/\s+/g, "_")}_${i + 1}` : null,
    description: "Dado de demonstração — não corresponde a um negócio real.",
    source: "Dados de demonstração (mock, ENABLE_DEMO_MODE=true)",
  }));
}
