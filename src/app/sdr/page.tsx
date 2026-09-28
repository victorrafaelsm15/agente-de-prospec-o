import { getLeadsRepository } from "@/database";
import {
  listDueFollowUps,
  listRecentActivity,
  listRecentInteractions,
  listUpcomingMeetings,
} from "@/database/sdrData";
import { buildAttentionSummary, computeInsights } from "@/lib/sdrInsights";
import { AttentionSection } from "@/components/sdr/AttentionSection";
import { AiAssistantPanel } from "@/components/sdr/AiAssistantPanel";
import { ActivityFeed } from "@/components/sdr/ActivityFeed";
import { InsightsList } from "@/components/sdr/InsightsList";
import { usingLocalFileDatabase } from "@/database";

export const dynamic = "force-dynamic";

export default async function SdrPage() {
  const repository = await getLeadsRepository();
  const [leads, interactions, dueFollowUps, upcomingMeetings, activity] = await Promise.all([
    repository.listAll({}),
    listRecentInteractions(1000),
    listDueFollowUps(50),
    listUpcomingMeetings(20),
    listRecentActivity(15),
  ]);

  const attention = buildAttentionSummary(leads, interactions, dueFollowUps, upcomingMeetings);
  const insights = computeInsights(leads);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">SDR AI</h1>
        <p className="mt-1 text-sm text-muted">
          Sua central de prospecção — o que precisa de atenção hoje, em um só lugar.
        </p>
      </div>

      {usingLocalFileDatabase && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <strong className="font-semibold">Modo desenvolvimento:</strong> interações, reuniões,
          follow-ups e configurações exigem o Supabase configurado (o fallback em arquivo local
          cobre apenas o CRM básico de leads). Configure o Supabase para usar o SDR AI completo.
        </div>
      )}

      <div className="space-y-6">
        <AttentionSection summary={attention} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AiAssistantPanel />
          <InsightsList insights={insights} />
        </div>

        <ActivityFeed activity={activity} />
      </div>
    </div>
  );
}
