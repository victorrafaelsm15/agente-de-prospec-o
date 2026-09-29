"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, RefreshCw, Send, X, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Textarea, Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import type { Lead } from "@/types/lead";
import type { ProposalTokenInfo } from "@/types/proposal";

interface ProposalSharePanelProps {
  proposalId: string;
  lead: Lead;
  proposalTitle: string;
  initialToken: ProposalTokenInfo | null;
}

export function ProposalSharePanel({ proposalId, lead, proposalTitle, initialToken }: ProposalSharePanelProps) {
  const [token, setToken] = useState(initialToken);
  const [generating, setGenerating] = useState(false);
  const [channel, setChannel] = useState<"WHATSAPP" | "EMAIL">(lead.whatsapp || lead.phone ? "WHATSAPP" : "EMAIL");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState(`Proposta: ${proposalTitle}`);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const publicUrl = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/proposal/view/${token.token}` : null;

  async function handleGenerateLink() {
    setGenerating(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/token`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao gerar link.");
      setToken(data.token);
      showToast("Link gerado.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao gerar link.", "error");
    } finally {
      setGenerating(false);
    }
  }

  function buildDefaultMessage() {
    if (!publicUrl) return "";
    return `Olá! Preparei uma proposta comercial para vocês: ${publicUrl}`;
  }

  function openManualChannel(msg: string) {
    const target = channel === "WHATSAPP" ? lead.whatsapp ?? lead.phone : lead.email;
    if (!target) return;
    if (channel === "WHATSAPP") {
      const digits = target.replace(/\D/g, "");
      window.open(`https://wa.me/${digits.length <= 11 ? "55" + digits : digits}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
    } else {
      window.open(`mailto:${target}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`, "_self");
    }
  }

  async function confirmSend() {
    const msg = message || buildDefaultMessage();
    setSending(true);
    try {
      openManualChannel(msg);
      const response = await fetch(`/api/proposals/${proposalId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, message: msg, subject: channel === "EMAIL" ? subject : undefined, confirmedManually: true }),
      });
      const data = await response.json();
      if (!response.ok || !data.sent) throw new Error(data.error ?? "Falha ao registrar envio.");
      showToast("Envio registrado. Status da proposta atualizado para Enviada.");
      setConfirming(false);
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível registrar o envio.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-foreground">Link público</p>
        {publicUrl ? (
          <div className="flex items-center gap-2">
            <Input readOnly value={publicUrl} className="flex-1 text-xs" />
            <CopyButton value={publicUrl} label="Copiar" />
          </div>
        ) : (
          <p className="text-sm text-muted">Nenhum link gerado ainda.</p>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={handleGenerateLink} disabled={generating} loading={generating} className="mt-2">
          <RefreshCw className="h-3.5 w-3.5" />
          {token ? "Gerar novo link (revoga o atual)" : "Gerar link"}
        </Button>
      </div>

      <div className="border-t border-border pt-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex rounded-lg border border-border-strong bg-white p-0.5">
            <button
              type="button"
              onClick={() => setChannel("WHATSAPP")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${channel === "WHATSAPP" ? "bg-brand-soft text-brand" : "text-slate-500 hover:bg-slate-100"}`}
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setChannel("EMAIL")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${channel === "EMAIL" ? "bg-brand-soft text-brand" : "text-slate-500 hover:bg-slate-100"}`}
            >
              <Mail className="h-3.5 w-3.5" /> E-mail
            </button>
          </div>
        </div>

        {channel === "EMAIL" && <Input placeholder="Assunto" value={subject} onChange={(e) => setSubject(e.target.value)} className="mb-2" />}

        <Textarea
          rows={3}
          placeholder={publicUrl ? buildDefaultMessage() : "Gere o link público primeiro."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {!confirming ? (
          <Button type="button" size="sm" onClick={() => setConfirming(true)} disabled={!publicUrl} className="mt-2">
            <Send className="h-3.5 w-3.5" /> Enviar proposta
          </Button>
        ) : (
          <div className="animate-fade-in mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="flex-1 text-[13px] font-medium text-amber-900">Esta proposta será enviada para o lead. Confirmar?</p>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              <X className="h-3.5 w-3.5" /> Cancelar
            </Button>
            <Button type="button" size="sm" onClick={confirmSend} disabled={sending} loading={sending}>
              Enviar
            </Button>
          </div>
        )}
        <p className="mt-1.5 text-xs text-muted">
          <Link2 className="mr-1 inline h-3 w-3" />
          Nunca é enviado automaticamente — você revisa e confirma antes.
        </p>
      </div>
    </div>
  );
}
