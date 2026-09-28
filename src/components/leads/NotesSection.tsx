"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/utils";
import type { Note } from "@/types/lead";

export function NotesSection({ leadId, notes }: { leadId: string; notes: Note[] }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: trimmed }),
      });
      if (!response.ok) throw new Error();
      setText("");
      showToast("Nota adicionada.");
      router.refresh();
    } catch {
      showToast("Não foi possível salvar a nota.", "error");
    } finally {
      setSaving(false);
    }
  }

  const sorted = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Adicionar uma nota interna (não é enviada ao lead)..."
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={!text.trim() || saving}
          loading={saving}
          className="self-end"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </Button>
      </div>

      {sorted.length > 0 && (
        <ul className="space-y-2.5">
          {sorted.map((note) => (
            <li key={note.id} className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
              <p className="text-foreground">{note.text}</p>
              <p className="mt-1 text-[11px] text-muted">{formatDateTime(note.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
