function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export const env = {
  supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),

  anthropicApiKey: readEnv("ANTHROPIC_API_KEY"),
  anthropicModel: readEnv("ANTHROPIC_MODEL") ?? "claude-sonnet-5",

  googlePlacesApiKey: readEnv("GOOGLE_PLACES_API_KEY"),

  demoModeEnabled: readEnv("ENABLE_DEMO_MODE") === "true",
};

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseServiceRoleKey
);

export const isAnthropicConfigured = Boolean(env.anthropicApiKey);

export const isGooglePlacesConfigured = Boolean(env.googlePlacesApiKey);
