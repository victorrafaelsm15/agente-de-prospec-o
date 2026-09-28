"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, X, MessageCircle, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { useToast } from "@/components/ui/Toast";
import { normalizeWhatsappUrl, normalizeEmailUrl } from "@/lib/contactLinks";
import { OUTREACH_STYLE_LABELS } from "@/lib/constants";
import type { Lead, OutreachStyle } from "@/types/lead";

type OutreachChannel = "WHATSAPP" | "EMAIL";

interface OutreachPanelProps {
  lead: Lead;
}

export function OutreachPanel({ lead }: OutreachPanelProps) {
  const [channel, setChannel] = useState<OutreachChannel>(lead.whatsapp || lead.phone ? "WHATSAPP" : "EMAIL");
  const [style, setStyle] = useState<OutreachStyle>("CONSULTIVA");
  const [message, setMessage] = useState(lead.outreachMessage ?? "");
  const [subject, setSubject] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const targetContact = channel === "WHATSAPP" ? lead.whatsapp ?? lead.phone : lead.email;
  const hasTarget = Boolean(targetContact);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, style }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao gerar mensagem.");

      if (channel === "EMAIL") {
        setSubject(data.subject);
        setMessage(data.body);
      } else {
        setMessage(data.message);
      }
      showToast(data.aiGenerated ? "Mensagem gerada por IA." : "Mensagem gerada por regras (IA não configurada).");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao gerar mensagem.", "error");
    } finally {
      setGenerating(false);
    }
  }

  function openManualChannel() {
    if (!targetContact) return;
    if (channel === "WHATSAPP") {
      const url = normalizeWhatsappUrl(targetContact);
      if (url) window.open(`${url}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    } else {
      const url = normalizeEmailUrl(targetContact);
      if (url) {
        window.open(
          `${url}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,
          "_self"
        );
      }
    }
  }

  async function confirmSend() {
    setSending(true);
    try {
      openManualChannel();
      const response = await fetch(`/api/leads/${lead.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          message,
          subject: channel === "EMAIL" ? subject : undefined,
          confirmedManually: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.sent) throw new Error(data.error ?? "Falha ao registrar envio.");
      showToast("Envio registrado no histórico do lead.");
      setConfirming(false);
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível registrar o envio.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abordagem</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
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

          <Select
            value={style}
            onChange={(e) => setStyle(e.target.value as OutreachStyle)}
            className="h-9 w-40 text-[13px]"
          >
            {Object.entries(OUTREACH_STYLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Button type="button" size="sm" variant="secondary" onClick={handleGenerate} disabled={generating} loading={generating}>
            <Sparkles className="h-3.5 w-3.5" />
            Gerar mensagem
          </Button>
        </div>

        {!hasTarget && (
          <p className="text-xs text-amber-700">
            {channel === "WHATSAPP" ? "Nenhum WhatsApp/telefone verificado para este lead." : "Nenhum e-mail verificado para este lead."}
          </p>
        )}

        {channel === "EMAIL" && (
          <Input placeholder="Assunto" value={subject} onChange={(e) => setSubject(e.target.value)} />
        )}

        <Textarea
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Gere ou escreva a mensagem antes de enviar..."
        />

        {!confirming ? (
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value={channel === "EMAIL" ? `${subject}\n\n${message}` : message} label="Copiar" />
            <Button
              type="button"
              size="sm"
              onClick={() => setConfirming(true)}
              disabled={!message.trim() || !hasTarget}
            >
              <Send className="h-3.5 w-3.5" />
              Enviar
            </Button>
          </div>
        ) : (
          <div className="animate-fade-in flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="flex-1 text-[13px] font-medium text-amber-900">
              Esta mensagem será enviada para o lead pelo {channel === "WHATSAPP" ? "WhatsApp" : "e-mail"}. Confirmar?
            </p>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              <X className="h-3.5 w-3.5" /> Cancelar
            </Button>
            <Button type="button" size="sm" onClick={confirmSend} disabled={sending} loading={sending}>
              Enviar
            </Button>
          </div>
        )}

        <p className="text-xs text-muted">
          A mensagem nunca é enviada automaticamente — você revisa, edita se quiser e confirma o
          envio, que abre o {channel === "WHATSAPP" ? "WhatsApp" : "seu app de e-mail"} com o
          conteúdo já preenchido.
        </p>
      </CardContent>
    </Card>
  );
}
