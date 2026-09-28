import { getSettings } from "@/database/sdrData";
import { isSupabaseConfigured } from "@/lib/env";
import { isAnthropicConfigured, isGooglePlacesConfigured, isWhatsappApiConfigured, isEmailApiConfigured } from "@/lib/env";
import { CommercialProfileForm } from "@/components/settings/CommercialProfileForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function IntegrationRow({ label, configured, hint }: { label: string; configured: boolean; hint: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      {configured ? (
        <span className="flex items-center gap-1 shrink-0 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Configurado
        </span>
      ) : (
        <span className="flex items-center gap-1 shrink-0 text-xs font-medium text-slate-400">
          <XCircle className="h-3.5 w-3.5" /> Não configurado
        </span>
      )}
    </div>
  );
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted">
          Perfil comercial usado pela IA e status das integrações externas.
        </p>
      </div>

      <div className="space-y-6">
        <CommercialProfileForm initial={settings} />

        <Card>
          <CardHeader>
            <CardTitle>Integrações</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <IntegrationRow
              label="Supabase (banco de dados)"
              configured={isSupabaseConfigured}
              hint="Persistência de leads, interações, reuniões e follow-ups."
            />
            <IntegrationRow
              label="Anthropic Claude (IA)"
              configured={isAnthropicConfigured}
              hint="Análises, mensagens, briefings e o assistente de IA."
            />
            <IntegrationRow
              label="Google Places (busca de negócios)"
              configured={isGooglePlacesConfigured}
              hint="Pesquisa real de empresas no Agente."
            />
            <IntegrationRow
              label="WhatsApp Business API (oficial)"
              configured={isWhatsappApiConfigured}
              hint="Sem isso, o envio abre o WhatsApp manualmente (wa.me) e você confirma o envio."
            />
            <IntegrationRow
              label="Provedor de e-mail transacional"
              configured={isEmailApiConfigured}
              hint="Sem isso, o envio abre seu cliente de e-mail (mailto:) e você confirma o envio."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
