import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Sparkles, FileText, History, ListTodo } from "lucide-react";
import { getLeadsRepository } from "@/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PriorityBadge, StatusBadge } from "@/components/leads/StatusBadge";
import { LeadStatusControl } from "@/components/leads/LeadStatusControl";
import { DeleteLeadButton } from "@/components/leads/DeleteLeadButton";
import { OutreachMessageCard } from "@/components/leads/OutreachMessageCard";
import { WebsiteAnalysisPanel } from "@/components/leads/WebsiteAnalysisPanel";
import { StatusHistoryTimeline } from "@/components/leads/StatusHistoryTimeline";
import { NotesSection } from "@/components/leads/NotesSection";
import { NextActionCard } from "@/components/leads/NextActionCard";
import {
  SiteTextLink,
  InstagramTextLink,
  WhatsappTextLink,
  PhoneTextLink,
  EmailTextLink,
} from "@/components/leads/ContactLinks";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const repository = await getLeadsRepository();
  const lead = await repository.getById(id);

  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/leads" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para leads
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{lead.name}</h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {lead.city}/{lead.state} · Pesquisado em {formatDateTime(lead.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LeadStatusControl leadId={lead.id} status={lead.status} />
          <DeleteLeadButton leadId={lead.id} leadName={lead.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações da empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-start gap-x-6 gap-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="text-foreground">{lead.category}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="text-foreground">{lead.address ?? "Endereço não encontrado"}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-4">
                <SiteTextLink website={lead.website} />
                <InstagramTextLink instagram={lead.instagram} />
                <WhatsappTextLink whatsapp={lead.whatsapp} />
                <PhoneTextLink phone={lead.phone} />
                <EmailTextLink email={lead.email} />
              </div>

              {lead.description && (
                <p className="mt-4 border-t border-border pt-4 text-sm text-muted">{lead.description}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Presença digital</CardTitle>
            </CardHeader>
            <CardContent>
              <WebsiteAnalysisPanel analysis={lead.websiteAnalysis} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Análise da IA</CardTitle>
              {lead.aiGenerated ? (
                <span className="flex items-center gap-1 text-xs font-medium text-brand">
                  <Sparkles className="h-3.5 w-3.5" /> Gerada por IA
                </span>
              ) : (
                <span className="text-xs font-medium text-muted">Gerada por regras</span>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground">
                {lead.aiAnalysis ?? "Não foi possível verificar."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Oportunidades e razões do score</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.opportunities.length === 0 ? (
                <p className="text-sm text-muted">Nenhuma oportunidade relevante identificada.</p>
              ) : (
                <ul className="space-y-2">
                  {lead.opportunities.map((opp, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-foreground">{opp.label}</span>
                      <span className="shrink-0 text-xs font-medium text-emerald-700">
                        +{opp.points} pts
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <OutreachMessageCard
            leadId={lead.id}
            initialMessage={lead.outreachMessage}
            aiGenerated={lead.aiGenerated}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-slate-400" />
                Notas internas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotesSection leadId={lead.id} notes={lead.notes} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Score de oportunidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight text-foreground">{lead.score}</span>
                <span className="text-sm text-muted">/100</span>
              </div>
              <div className="mt-3">
                <PriorityBadge priority={lead.priority} />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                O score é apenas uma ferramenta interna de triagem para ajudar a priorizar
                contatos — não é um julgamento definitivo sobre o negócio. Veja as razões ao lado.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <ListTodo className="h-4 w-4 text-slate-400" />
                Próxima ação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NextActionCard
                leadId={lead.id}
                initialNextAction={lead.nextAction}
                initialNextActionDate={lead.nextActionDate}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evidências</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.evidence.length === 0 ? (
                <p className="text-sm text-muted">Nenhuma evidência registrada.</p>
              ) : (
                <ul className="space-y-3">
                  {lead.evidence.map((ev, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <p className="text-foreground">{ev.description}</p>
                        <p className="text-xs text-muted">Fonte: {ev.source}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted">
                Consulta de pesquisa: {lead.researchQuery ?? "não registrada"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <History className="h-4 w-4 text-slate-400" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusHistoryTimeline history={lead.statusHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
