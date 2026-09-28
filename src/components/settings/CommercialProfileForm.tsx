"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { CommercialSettings } from "@/types/lead";

export function CommercialProfileForm({ initial }: { initial: CommercialSettings }) {
  const [businessName, setBusinessName] = useState(initial.businessName ?? "");
  const [services, setServices] = useState(initial.services ?? "");
  const [differentiator, setDifferentiator] = useState(initial.differentiator ?? "");
  const [targetAudience, setTargetAudience] = useState(initial.targetAudience ?? "");
  const [tone, setTone] = useState(initial.tone ?? "");
  const [emailSignature, setEmailSignature] = useState(initial.emailSignature ?? "");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName || null,
          services: services || null,
          differentiator: differentiator || null,
          targetAudience: targetAudience || null,
          tone: tone || null,
          emailSignature: emailSignature || null,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Falha ao salvar.");
      }
      showToast("Configurações salvas. A IA vai usá-las nas próximas mensagens e briefings.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível salvar.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil comercial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted">
          Essas informações são usadas pela IA para personalizar mensagens de abordagem e
          briefings — nunca são enviadas a leads automaticamente.
        </p>

        <div>
          <Label htmlFor="businessName">Nome comercial</Label>
          <Input
            id="businessName"
            placeholder="Ex: Estúdio Ideia Digital"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="services">O que eu vendo</Label>
          <Textarea
            id="services"
            rows={2}
            placeholder="Ex: Criação de sites profissionais para empresas e profissionais da saúde."
            value={services}
            onChange={(e) => setServices(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="differentiator">Meu diferencial</Label>
          <Textarea
            id="differentiator"
            rows={2}
            placeholder="Ex: Sites premium, modernos e focados em conversão."
            value={differentiator}
            onChange={(e) => setDifferentiator(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="targetAudience">Público-alvo</Label>
          <Input
            id="targetAudience"
            placeholder="Ex: Clínicas, dentistas e profissionais da saúde."
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="tone">Tom de comunicação padrão</Label>
          <Select id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="">Sem preferência</option>
            <option value="profissional">Profissional</option>
            <option value="consultivo">Consultivo</option>
            <option value="direto">Direto</option>
            <option value="casual">Casual</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="emailSignature">Assinatura de e-mail</Label>
          <Textarea
            id="emailSignature"
            rows={3}
            placeholder={"Ex: Atenciosamente,\nSeu Nome\nEstúdio Ideia Digital"}
            value={emailSignature}
            onChange={(e) => setEmailSignature(e.target.value)}
          />
        </div>

        <Button type="button" onClick={handleSave} disabled={saving} loading={saving}>
          Salvar configurações
        </Button>
      </CardContent>
    </Card>
  );
}
