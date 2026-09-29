"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import type { ProposalStatus } from "@/types/proposal";

const REJECTION_REASONS = ["Preço", "Prazo", "Não é o momento", "Outro"];

export function PublicProposalActions({ token, status }: { token: string; status: ProposalStatus }) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [confirmingAccept, setConfirmingAccept] = useState(false);
  const [confirmingReject, setConfirmingReject] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  async function handleAccept() {
    setBusy(true);
    try {
      const response = await fetch(`/api/proposal/view/${token}/accept`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao registrar aceite.");
      setCurrentStatus("APROVADA");
      showToast("Proposta aceita! Obrigado.");
      setConfirmingAccept(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao aceitar.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    try {
      const response = await fetch(`/api/proposal/view/${token}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao registrar recusa.");
      setCurrentStatus("RECUSADA");
      showToast("Recusa registrada. Obrigado pelo retorno.");
      setConfirmingReject(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao recusar.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (currentStatus === "APROVADA") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">Proposta aceita. Em breve entraremos em contato.</p>
      </div>
    );
  }

  if (currentStatus === "RECUSADA") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
        <XCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">Proposta recusada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!confirmingAccept && !confirmingReject && (
          <>
            <Button type="button" onClick={() => setConfirmingAccept(true)} size="lg">
              <CheckCircle2 className="h-4 w-4" /> Aceitar proposta
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmingReject(true)} size="lg">
              <XCircle className="h-4 w-4" /> Recusar
            </Button>
          </>
        )}
      </div>

      {confirmingAccept && (
        <div className="animate-fade-in flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="flex-1 text-sm font-medium text-emerald-900">Você confirma a aceitação desta proposta?</p>
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmingAccept(false)}>
            <X className="h-3.5 w-3.5" /> Cancelar
          </Button>
          <Button type="button" size="sm" onClick={handleAccept} disabled={busy} loading={busy}>
            Confirmar aceite
          </Button>
        </div>
      )}

      {confirmingReject && (
        <div className="animate-fade-in space-y-2 rounded-xl border border-border bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-foreground">Pode nos contar o motivo? (opcional)</p>
          <div className="flex flex-wrap gap-1.5">
            {REJECTION_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`cursor-pointer rounded-full border px-2.5 py-1 text-[12px] transition-colors ${reason === r ? "border-brand bg-brand-soft text-brand" : "border-border-strong bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea rows={2} placeholder="Comentário adicional (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmingReject(false)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={handleReject} disabled={busy} loading={busy}>
              Confirmar recusa
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DownloadPdfLink({ proposalPdfUrl }: { proposalPdfUrl: string }) {
  return (
    <a href={proposalPdfUrl} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
      <Download className="h-4 w-4" /> Baixar PDF
    </a>
  );
}
