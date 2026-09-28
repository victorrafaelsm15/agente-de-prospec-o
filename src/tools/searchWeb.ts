export interface WebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResult {
  configured: boolean;
  results: WebSearchResultItem[];
  warning: string | null;
}

/**
 * searchWeb — ferramenta de pesquisa geral na web.
 *
 * Reservada para uso futuro (ex.: enriquecer leads com notícias, avaliações
 * ou menções públicas). Nenhum provedor de busca genérica está configurado
 * nesta V1 — apenas findBusinesses() (Google Places) e inspectWebsite()
 * (fetch direto) fazem chamadas externas reais.
 *
 * Para habilitar no futuro: implemente a chamada a um provedor (ex.: Bing
 * Web Search API, SerpAPI) usando uma variável de ambiente própria (ex.:
 * SEARCH_API_KEY) e mantenha esta mesma assinatura de retorno.
 */
export async function searchWeb(query: string): Promise<WebSearchResult> {
  return {
    configured: false,
    results: [],
    warning: `Pesquisa web genérica não configurada nesta versão (consulta ignorada: "${query}").`,
  };
}
