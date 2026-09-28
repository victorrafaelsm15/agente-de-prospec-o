import { Lightbulb } from "lucide-react";
import type { NextActionRecommendation } from "@/types/lead";

export function NextActionRecommendationCard({ recommendation }: { recommendation: NextActionRecommendation }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-brand-soft/60 px-3 py-3">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
      <div>
        <p className="text-sm font-semibold text-foreground">Recomendação: {recommendation.action}</p>
        <p className="mt-0.5 text-xs text-muted">{recommendation.reason}</p>
      </div>
    </div>
  );
}
