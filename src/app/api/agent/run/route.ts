import { NextRequest } from "next/server";
import { ProspectingAgent } from "@/agents/ProspectingAgent";
import type { AgentEvent, ProspectingCriteria } from "@/agents/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface RunRequestBody {
  niche?: string;
  city?: string;
  state?: string;
  quantity?: number;
  additionalInstructions?: string;
}

function validateCriteria(body: RunRequestBody): ProspectingCriteria | { error: string } {
  const niche = body.niche?.trim();
  const city = body.city?.trim();
  const state = body.state?.trim();
  const quantity = Number(body.quantity);

  if (!niche) return { error: "Informe o nicho (ex: Dentistas)." };
  if (!city) return { error: "Informe a cidade." };
  if (!state) return { error: "Informe o estado." };
  if (!Number.isFinite(quantity) || quantity < 1) {
    return { error: "Informe uma quantidade válida de leads (mínimo 1)." };
  }
  if (quantity > 50) {
    return { error: "Quantidade máxima por pesquisa é 50 leads." };
  }

  return {
    niche,
    city,
    state,
    quantity: Math.floor(quantity),
    additionalInstructions: body.additionalInstructions?.trim() || undefined,
  };
}

export async function POST(request: NextRequest) {
  let body: RunRequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Corpo da requisição inválido." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const criteria = validateCriteria(body);
  if ("error" in criteria) {
    return new Response(JSON.stringify({ error: criteria.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: AgentEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        const agent = new ProspectingAgent();
        await agent.run(criteria, emit);
      } catch (error) {
        emit({
          type: "error",
          message: error instanceof Error ? error.message : "Erro inesperado no agente.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
