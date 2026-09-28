"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Input";
import { STATUS_LABELS } from "@/lib/constants";
import { LEAD_STATUSES, type LeadStatus } from "@/types/lead";
import { useToast } from "@/components/ui/Toast";

export function LeadStatusControl({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  async function handleChange(newStatus: LeadStatus) {
    const previous = current;
    setCurrent(newStatus);

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error();
      showToast(`Status atualizado para "${STATUS_LABELS[newStatus]}".`);
      startTransition(() => router.refresh());
    } catch {
      setCurrent(previous);
      showToast("Não foi possível atualizar o status. Tente novamente.", "error");
    }
  }

  return (
    <Select
      value={current}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as LeadStatus)}
      className="w-full sm:w-52"
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </Select>
  );
}
