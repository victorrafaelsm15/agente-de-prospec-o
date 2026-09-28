import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import type { LeadsRepository } from "@/database/leadsRepository";

let cachedRepository: LeadsRepository | null = null;

/**
 * Retorna o repositório de leads a ser usado pela aplicação.
 *
 * - Se o Supabase estiver configurado (NEXT_PUBLIC_SUPABASE_URL +
 *   SUPABASE_SERVICE_ROLE_KEY), usa o adapter real do Supabase/Postgres.
 * - Caso contrário, usa um adapter de arquivo local (.data/leads.json)
 *   apenas para desenvolvimento — ver aviso em fileLeadsRepository.ts.
 */
export async function getLeadsRepository(): Promise<LeadsRepository> {
  if (cachedRepository) return cachedRepository;

  if (isSupabaseConfigured) {
    const { SupabaseLeadsRepository } = await import(
      "@/database/adapters/supabaseLeadsRepository"
    );
    cachedRepository = new SupabaseLeadsRepository();
  } else {
    const { FileLeadsRepository } = await import(
      "@/database/adapters/fileLeadsRepository"
    );
    cachedRepository = new FileLeadsRepository();
  }

  return cachedRepository;
}

export const usingLocalFileDatabase = !isSupabaseConfigured;
