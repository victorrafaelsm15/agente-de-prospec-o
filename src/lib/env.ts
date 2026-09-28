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
  // Necessário quando a API key é de organização (não escopada a um único
  // workspace) — a API da Anthropic exige esse header nesse caso.
  anthropicWorkspaceId: readEnv("ANTHROPIC_WORKSPACE_ID"),

  googlePlacesApiKey: readEnv("GOOGLE_PLACES_API_KEY"),

  demoModeEnabled: readEnv("ENABLE_DEMO_MODE") === "true",

  // WhatsApp Business Cloud API (Meta) — oficial. Sem isso, o envio de
  // WhatsApp abre o link wa.me manualmente (o usuário envia pelo próprio
  // WhatsApp) e o sistema apenas registra a interação.
  whatsappAccessToken: readEnv("WHATSAPP_ACCESS_TOKEN"),
  whatsappPhoneNumberId: readEnv("WHATSAPP_PHONE_NUMBER_ID"),

  // Provedor de e-mail transacional (ex.: Resend). Sem isso, o envio de
  // e-mail abre o cliente de e-mail do usuário via mailto: e o sistema
  // apenas registra a interação.
  emailApiKey: readEnv("EMAIL_API_KEY"),
  emailFromAddress: readEnv("EMAIL_FROM_ADDRESS"),

  // Limite de chamadas de IA por minuto (proteção de custo/abuso). Padrão: 20.
  aiRateLimitPerMinute: Number(readEnv("AI_RATE_LIMIT_PER_MINUTE") ?? "20"),
};

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseServiceRoleKey
);

export const isAnthropicConfigured = Boolean(env.anthropicApiKey);

export const isGooglePlacesConfigured = Boolean(env.googlePlacesApiKey);

export const isWhatsappApiConfigured = Boolean(
  env.whatsappAccessToken && env.whatsappPhoneNumberId
);

export const isEmailApiConfigured = Boolean(env.emailApiKey && env.emailFromAddress);
