import { env, isEmailApiConfigured } from "@/lib/env";

export interface SendEmailResult {
  sent: boolean;
  error: string | null;
}

/**
 * sendEmail — envio real via provedor de e-mail transacional (Resend).
 * https://resend.com/docs/api-reference/emails/send-email
 *
 * Requer EMAIL_API_KEY e EMAIL_FROM_ADDRESS configurados. Sem isso, esta
 * função não deve ser chamada — o fluxo da aplicação usa mailto: (abertura
 * manual pelo usuário) e apenas registra a interação.
 */
export async function sendEmail(
  toAddress: string,
  subject: string,
  body: string
): Promise<SendEmailResult> {
  if (!isEmailApiConfigured) {
    return { sent: false, error: "Provedor de e-mail não configurado." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.emailApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.emailFromAddress,
        to: [toAddress],
        subject,
        text: body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return { sent: false, error: `Falha no envio de e-mail: ${response.status} ${errorText}` };
    }

    return { sent: true, error: null };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao enviar e-mail.",
    };
  }
}
