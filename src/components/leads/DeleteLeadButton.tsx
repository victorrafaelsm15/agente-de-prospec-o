"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function DeleteLeadButton({ leadId, leadName }: { leadId: string; leadName: string }) {
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm(`Excluir "${leadName}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      showToast("Lead excluído.");
      router.push("/leads");
      router.refresh();
    } catch {
      showToast("Não foi possível excluir o lead.", "error");
      setDeleting(false);
    }
  }

  return (
    <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={deleting} loading={deleting}>
      <Trash2 className="h-3.5 w-3.5" />
      Excluir
    </Button>
  );
}
