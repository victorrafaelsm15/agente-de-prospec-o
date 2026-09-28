import { env, isWhatsappApiConfigured } from "@/lib/env";

export interface SendWhatsappResult {
  sent: boolean;
  error: string | null;
}

/**
 * sendWhatsapp — envio real via WhatsApp Business Cloud API (Meta), a única
 * forma OFICIAL de automatizar WhatsApp sem violar os termos da plataforma.
 * https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 *
 * Requer WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID configurados. Sem
 * isso, esta função não deve ser chamada — o fluxo da aplicação usa o link
 * wa.me (abertura manual pelo usuário) e apenas registra a interação.
 */
export async function sendWhatsapp(toPhoneDigits: string, message: string): Promise<SendWhatsappResult> {
  if (!isWhatsappApiConfigured) {
    return { sent: false, error: "WhatsApp Business API não configurada." };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${env.whatsappPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.whatsappAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toPhoneDigits,
          type: "text",
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return { sent: false, error: `Falha na API do WhatsApp: ${response.status} ${errorText}` };
    }

    return { sent: true, error: null };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao enviar WhatsApp.",
    };
  }
}
