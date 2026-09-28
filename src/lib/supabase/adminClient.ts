import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/lib/supabase/databaseTypes";

let cachedClient: SupabaseClient<Database> | null = null;

/**
 * Cliente Supabase com a service role key. Usado SOMENTE em código de
 * servidor (API routes / server actions). Nunca importe este arquivo em
 * um componente cliente.
 */
export function getSupabaseAdminClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local."
    );
  }

  if (!cachedClient) {
    cachedClient = createClient<Database>(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
      auth: { persistSession: false },
    });
  }

  return cachedClient;
}
