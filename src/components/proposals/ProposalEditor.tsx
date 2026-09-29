"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Trash2,
  Download,
  Plus,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatCurrencyBRL } from "@/lib/proposalCalc";
import { formatDateOnly } from "@/lib/utils";
import { PROPOSAL_STATUSES } from "@/types/proposal";
import { ProposalItemsEditor, type EditableItem } from "@/components/proposals/ProposalItemsEditor";
import { RefinableTextField } from "@/components/proposals/RefinableTextField";
import { ProposalVersionsPanel } from "@/components/proposals/ProposalVersionsPanel";
import { ProposalEventsTimeline } from "@/components/proposals/ProposalEventsTimeline";
import { ProposalSharePanel } from "@/components/proposals/ProposalSharePanel";
import type { Lead } from "@/types/lead";
import type {
  DiscountType,
  ProposalEvent,
  ProposalTokenInfo,
  ProposalVersion,
  ProposalWithItems,
  Service,
} from "@/types/proposal";

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  PRONTA: "Pronta",
  ENVIADA: "Enviada",
  VISUALIZADA: "Visualizada",
  EM_NEGOCIACAO: "Em negociação",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  EXPIRADA: "Expirada",
  CANCELADA: "Cancelada",
};

interface ProposalEditorProps {
  proposal: ProposalWithItems;
  lead: Lead;
  services: Service[];
  versions: ProposalVersion[];
  events: ProposalEvent[];
  initialToken: ProposalTokenInfo | null;
}

export function ProposalEditor({ proposal, lead, services, versions, events, initialToken }: ProposalEditorProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [title, setTitle] = useState(proposal.title);
  const [status, setStatus] = useState(proposal.status);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [generatingBriefing, setGeneratingBriefing] = useState(false);
  const [generatingDiagnosis, setGeneratingDiagnosis] = useState(false);

  const [briefing, setBriefing] = useState(proposal.briefing);
  const [diagnosis, setDiagnosis] = useState(proposal.diagnosis);
  const [scopeNotes, setScopeNotes] = useState(proposal.scopeNotes ?? "");
  const [paymentTerms, setPaymentTerms] = useState(proposal.paymentTerms ?? "");
  const [timeline, setTimeline] = useState(proposal.timeline ?? "");
  const [terms, setTerms] = useState(proposal.terms ?? "");
  const [nextSteps, setNextSteps] = useState<string[]>(proposal.nextSteps);
  const [newStep, setNewStep] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType | "">(proposal.discountType ?? "");
  const [discountValue, setDiscountValue] = useState(proposal.discountValue);
  const [validityDays, setValidityDays] = useState(proposal.validityDays);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [savingValidity, setSavingValidity] = useState(false);
  const [savingNextSteps, setSavingNextSteps] = useState(false);
  const [savingBriefing, setSavingBriefing] = useState(false);

  const items: EditableItem[] = proposal.items.map((i) => ({
    key: i.id,
    serviceId: i.serviceId,
    name: i.name,
    description: i.description ?? "",
    quantity: i.quantity,
    unitPrice: i.unitPrice,
  }));

  async function patchProposal(body: Record<string, unknown>) {
    const response = await fetch(`/api/proposals/${proposal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Falha ao salvar.");
    return data.proposal;
  }

  async function handleTitleSave() {
    setSavingTitle(true);
    try {
      await patchProposal({ title });
      showToast("Título salvo.");
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao salvar título.", "error");
    } finally {
      setSavingTitle(false);
    }
  }

  async function handleStatusChange(newStatus: typeof status) {
    const previous = status;
    setStatus(newStatus);
    setSavingStatus(true);
    try {
      await patchProposal({ status: newStatus });
      showToast(`Status atualizado para "${STATUS_LABELS[newStatus]}".`);
      router.refresh();
    } catch (error) {
      setStatus(previous);
      showToast(error instanceof Error ? error.message : "Erro ao atualizar status.", "error");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Excluir a proposta "${proposal.title}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      showToast("Proposta excluída.");
      router.push(`/leads/${lead.id}`);
    } catch {
      showToast("Não foi possível excluir a proposta.", "error");
      setDeleting(false);
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/duplicate`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao duplicar.");
      showToast("Proposta duplicada.");
      router.push(`/proposals/${data.proposal.id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao duplicar.", "error");
      setDuplicating(false);
    }
  }

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/pdf`);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Falha ao gerar PDF.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proposta-${lead.name.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("PDF gerado com sucesso.");
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao gerar PDF.", "error");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleGenerateBriefing() {
    setGeneratingBriefing(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/ai/briefing`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao gerar briefing.");
      setBriefing(data.briefing);
      showToast(data.aiGenerated ? "Briefing gerado por IA." : "Briefing gerado por regras (IA não configurada).");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao gerar briefing.", "error");
    } finally {
      setGeneratingBriefing(false);
    }
  }

  async function handleSaveBriefing() {
    setSavingBriefing(true);
    try {
      await patchProposal({ briefing });
      showToast("Briefing salvo.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao salvar briefing.", "error");
    } finally {
      setSavingBriefing(false);
    }
  }

  async function handleGenerateDiagnosis() {
    setGeneratingDiagnosis(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}/ai/diagnosis`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao gerar diagnóstico.");
      setDiagnosis(data.diagnosis);
      showToast(data.aiGenerated ? "Diagnóstico gerado por IA." : "Diagnóstico gerado por regras (IA não configurada).");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao gerar diagnóstico.", "error");
    } finally {
      setGeneratingDiagnosis(false);
    }
  }

  async function handleSaveDiscount() {
    setSavingDiscount(true);
    try {
      await patchProposal({ discountType: discountType || null, discountValue });
      showToast("Desconto atualizado.");
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao salvar desconto.", "error");
    } finally {
      setSavingDiscount(false);
    }
  }

  async function handleSaveValidity() {
    setSavingValidity(true);
    try {
      await patchProposal({ validityDays });
      showToast("Validade atualizada.");
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao salvar validade.", "error");
    } finally {
      setSavingValidity(false);
    }
  }

  async function handleSaveNextSteps() {
    setSavingNextSteps(true);
    try {
      await patchProposal({ nextSteps });
      showToast("Próximos passos salvos.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao salvar.", "error");
    } finally {
      setSavingNextSteps(false);
    }
  }

  const discountAmount = proposal.subtotal - proposal.total;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href={`/leads/${lead.id}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para {lead.name}
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-md text-lg font-semibold" />
            {title !== proposal.title && (
              <Button type="button" size="sm" variant="secondary" onClick={handleTitleSave} disabled={savingTitle} loading={savingTitle}>
                Salvar
              </Button>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Proposta para <strong className="text-foreground">{lead.name}</strong> · v{proposal.currentVersion}
            {proposal.expiresAt && ` · válida até ${formatDateOnly(proposal.expiresAt)}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as typeof status)}
            disabled={savingStatus}
            className="h-9 w-44 text-[13px]"
          >
            {PROPOSAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <Button type="button" size="sm" variant="secondary" onClick={handleDownloadPdf} disabled={downloadingPdf} loading={downloadingPdf}>
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={handleDuplicate} disabled={duplicating} loading={duplicating}>
            <Copy className="h-3.5 w-3.5" /> Duplicar
          </Button>
          <Button type="button" size="sm" variant="danger" onClick={handleDelete} disabled={deleting} loading={deleting}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Briefing</CardTitle>
              <Button type="button" size="sm" variant="ghost" onClick={handleGenerateBriefing} disabled={generatingBriefing} loading={generatingBriefing}>
                <Sparkles className="h-3.5 w-3.5" /> Gerar com IA
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Empresa</Label>
                  <Input
                    value={briefing.cliente?.empresa ?? ""}
                    onChange={(e) => setBriefing({ ...briefing, cliente: { ...briefing.cliente, empresa: e.target.value } })}
                  />
                </div>
                <div>
                  <Label>Responsável</Label>
                  <Input
                    value={briefing.cliente?.responsavel ?? ""}
                    onChange={(e) => setBriefing({ ...briefing, cliente: { ...briefing.cliente, responsavel: e.target.value } })}
                  />
                </div>
              </div>
              <div>
                <Label>Objetivo do projeto</Label>
                <Textarea
                  rows={2}
                  value={briefing.projeto?.objetivo ?? ""}
                  onChange={(e) => setBriefing({ ...briefing, projeto: { ...briefing.projeto, objetivo: e.target.value } })}
                />
              </div>
              <div>
                <Label>Necessidades identificadas</Label>
                <Textarea
                  rows={2}
                  value={briefing.projeto?.necessidades ?? ""}
                  onChange={(e) => setBriefing({ ...briefing, projeto: { ...briefing.projeto, necessidades: e.target.value } })}
                />
              </div>
              <div>
                <Label>Funcionalidades desejadas</Label>
                <Textarea
                  rows={2}
                  value={briefing.projeto?.funcionalidades ?? ""}
                  onChange={(e) => setBriefing({ ...briefing, projeto: { ...briefing.projeto, funcionalidades: e.target.value } })}
                />
              </div>
              <Button type="button" size="sm" onClick={handleSaveBriefing} disabled={savingBriefing} loading={savingBriefing}>
                Salvar briefing
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Diagnóstico</CardTitle>
              <Button type="button" size="sm" variant="ghost" onClick={handleGenerateDiagnosis} disabled={generatingDiagnosis} loading={generatingDiagnosis}>
                <Sparkles className="h-3.5 w-3.5" /> Gerar com IA
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <RefinableTextField
                label="Situação atual"
                proposalId={proposal.id}
                field="diagnosis.situacaoAtual"
                value={diagnosis.situacaoAtual ?? ""}
                onChange={(v) => setDiagnosis({ ...diagnosis, situacaoAtual: v })}
                onSave={(v) => patchProposal({ diagnosis: { ...diagnosis, situacaoAtual: v } })}
              />
              <RefinableTextField
                label="Oportunidades"
                proposalId={proposal.id}
                field="diagnosis.oportunidades"
                value={diagnosis.oportunidades ?? ""}
                onChange={(v) => setDiagnosis({ ...diagnosis, oportunidades: v })}
                onSave={(v) => patchProposal({ diagnosis: { ...diagnosis, oportunidades: v } })}
              />
              <RefinableTextField
                label="Solução proposta"
                proposalId={proposal.id}
                field="diagnosis.solucaoProposta"
                value={diagnosis.solucaoProposta ?? ""}
                onChange={(v) => setDiagnosis({ ...diagnosis, solucaoProposta: v })}
                onSave={(v) => patchProposal({ diagnosis: { ...diagnosis, solucaoProposta: v } })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escopo e investimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RefinableTextField
                label="Notas sobre o escopo (opcional)"
                proposalId={proposal.id}
                field="scopeNotes"
                value={scopeNotes}
                onChange={setScopeNotes}
                onSave={(v) => patchProposal({ scopeNotes: v })}
                rows={2}
              />
              <ProposalItemsEditor proposalId={proposal.id} initialItems={items} services={services} onSaved={() => router.refresh()} />

              <div className="border-t border-border pt-4">
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <Label>Desconto</Label>
                    <Select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType | "")} className="h-9 w-36 text-[13px]">
                      <option value="">Sem desconto</option>
                      <option value="PERCENTUAL">Percentual (%)</option>
                      <option value="FIXO">Valor fixo (R$)</option>
                    </Select>
                  </div>
                  {discountType && (
                    <Input
                      type="number"
                      min={0}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="h-9 w-28"
                    />
                  )}
                  <Button type="button" size="sm" variant="secondary" onClick={handleSaveDiscount} disabled={savingDiscount} loading={savingDiscount}>
                    Aplicar
                  </Button>
                </div>

                <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 sm:ml-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="text-foreground">{formatCurrencyBRL(proposal.subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Desconto</span>
                      <span className="text-foreground">-{formatCurrencyBRL(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-1.5 text-base font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-brand">{formatCurrencyBRL(proposal.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Condições</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RefinableTextField
                label="Condições de pagamento"
                proposalId={proposal.id}
                field="paymentTerms"
                value={paymentTerms}
                onChange={setPaymentTerms}
                onSave={(v) => patchProposal({ paymentTerms: v })}
                placeholder="Ex: 50% na contratação, 50% na entrega."
              />
              <RefinableTextField
                label="Prazo estimado"
                proposalId={proposal.id}
                field="timeline"
                value={timeline}
                onChange={setTimeline}
                onSave={(v) => patchProposal({ timeline: v })}
                placeholder="Ex: 15 dias úteis após aprovação e recebimento do material."
                rows={2}
              />
              <div>
                <Label>Validade da proposta (dias)</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min={1} value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))} className="w-24" />
                  <Button type="button" size="sm" variant="secondary" onClick={handleSaveValidity} disabled={savingValidity} loading={savingValidity}>
                    Salvar
                  </Button>
                  {proposal.expiresAt && <span className="text-xs text-muted">Expira em {formatDateOnly(proposal.expiresAt)}</span>}
                </div>
              </div>
              <RefinableTextField
                label="Termos e condições"
                proposalId={proposal.id}
                field="terms"
                value={terms}
                onChange={setTerms}
                onSave={(v) => patchProposal({ terms: v })}
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextSteps.length > 0 && (
                <ul className="space-y-2">
                  {nextSteps.map((step, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-sm text-foreground">{step}</span>
                      <button
                        type="button"
                        onClick={() => setNextSteps((prev) => prev.filter((_, i) => i !== idx))}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-danger"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Reunião de briefing"
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newStep.trim()) {
                      e.preventDefault();
                      setNextSteps((prev) => [...prev, newStep.trim()]);
                      setNewStep("");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (!newStep.trim()) return;
                    setNextSteps((prev) => [...prev, newStep.trim()]);
                    setNewStep("");
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button type="button" size="sm" onClick={handleSaveNextSteps} disabled={savingNextSteps} loading={savingNextSteps}>
                Salvar próximos passos
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compartilhar e enviar</CardTitle>
            </CardHeader>
            <CardContent>
              <ProposalSharePanel proposalId={proposal.id} lead={lead} proposalTitle={proposal.title} initialToken={initialToken} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Versões</CardTitle>
            </CardHeader>
            <CardContent>
              <ProposalVersionsPanel proposalId={proposal.id} versions={versions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <ProposalEventsTimeline events={events} />
            </CardContent>
          </Card>

          {proposal.status === "RECUSADA" && proposal.rejectionReason && (
            <Card>
              <CardHeader>
                <CardTitle>Motivo da recusa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{proposal.rejectionReason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
