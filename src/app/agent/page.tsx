"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AgentForm } from "@/components/agent/AgentForm";
import { AgentProgress } from "@/components/agent/AgentProgress";
import { AgentResults } from "@/components/agent/AgentResults";
import { useProspectingAgent } from "@/lib/hooks/useProspectingAgent";
import { AlertTriangle } from "lucide-react";

export default function AgentPage() {
  const { phase, steps, leads, errorMessage, summary, run } = useProspectingAgent();
  const isRunning = phase === "running";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Agente de prospecção</h1>
        <p className="mt-1 text-sm text-muted">
          Descreva o tipo de cliente que você procura e o agente vai pesquisar, analisar a
          presença digital e sugerir uma abordagem para cada lead.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Nova pesquisa</CardTitle>
        </CardHeader>
        <CardContent>
          <AgentForm disabled={isRunning} onSubmit={run} />
        </CardContent>
      </Card>

      {errorMessage && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Não foi possível concluir a pesquisa</p>
            <p className="mt-0.5 text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <AgentProgress steps={steps} />
        <AgentResults leads={leads} summary={summary} />
      </div>
    </div>
  );
}
