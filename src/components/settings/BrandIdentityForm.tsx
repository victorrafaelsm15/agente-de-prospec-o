"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { CommercialSettings, SocialLink } from "@/types/lead";

export function BrandIdentityForm({ initial }: { initial: CommercialSettings }) {
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(initial.primaryColor ?? "#4338ca");
  const [secondaryColor, setSecondaryColor] = useState(initial.secondaryColor ?? "");
  const [contactPhone, setContactPhone] = useState(initial.contactPhone ?? "");
  const [contactEmail, setContactEmail] = useState(initial.contactEmail ?? "");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initial.socialLinks ?? []);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: logoUrl || null,
          primaryColor: primaryColor || null,
          secondaryColor: secondaryColor || null,
          contactPhone: contactPhone || null,
          contactEmail: contactEmail || null,
          socialLinks,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Falha ao salvar.");
      }
      showToast("Identidade visual salva. Usada nas propostas e no PDF.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível salvar.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identidade visual (propostas)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted">Usada no PDF e na página pública das suas propostas comerciais.</p>

        <div>
          <Label htmlFor="logoUrl">URL do logo (opcional)</Label>
          <Input id="logoUrl" placeholder="https://..." value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="primaryColor">Cor principal</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor || "#4338ca"}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border border-border-strong"
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="secondaryColor">Cor secundária (opcional)</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor || "#64748b"}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border border-border-strong"
              />
              <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="contactPhone">Telefone de contato</Label>
            <Input id="contactPhone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="contactEmail">E-mail de contato</Label>
            <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Redes sociais</Label>
          {socialLinks.length > 0 && (
            <ul className="mb-2 space-y-1.5">
              {socialLinks.map((link, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate text-foreground">
                    {link.label} — <span className="text-muted">{link.url}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSocialLinks((prev) => prev.filter((_, i) => i !== idx))}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Input placeholder="Instagram" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="w-32" />
            <Input placeholder="https://instagram.com/..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="flex-1" />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                if (!newLabel.trim() || !newUrl.trim()) return;
                setSocialLinks((prev) => [...prev, { label: newLabel.trim(), url: newUrl.trim() }]);
                setNewLabel("");
                setNewUrl("");
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <Button type="button" onClick={handleSave} disabled={saving} loading={saving}>
          Salvar identidade visual
        </Button>
      </CardContent>
    </Card>
  );
}
