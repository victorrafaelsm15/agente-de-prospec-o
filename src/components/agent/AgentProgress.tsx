import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { AgentStepLog } from "@/lib/hooks/useProspectingAgent";

export function AgentProgress({ steps }: { steps: AgentStepLog[] }) {
  if (steps.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso da pesquisa</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {steps.map((step) => (
            <li key={step.id} className="flex items-start gap-2.5 text-sm animate-fade-in">
              {step.status === "running" && (
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-brand" />
              )}
              {step.status === "done" && (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              )}
              {step.status === "error" && (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              )}
              <span className={step.status === "error" ? "text-danger" : "text-foreground"}>
                {step.message}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
