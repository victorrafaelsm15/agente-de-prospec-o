import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Lightbulb } from "lucide-react";
import type { Insight } from "@/types/lead";

export function InsightsList({ insights }: { insights: Insight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="text-sm text-muted">Dados insuficientes para gerar insights ainda.</p>
        ) : (
          <ul className="space-y-2.5">
            {insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span className="text-foreground">{insight.label}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
