"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Input";
import { PROPOSAL_STATUSES } from "@/types/proposal";

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

export function ProposalStatusFilter({ current }: { current: string }) {
  const router = useRouter();

  return (
    <Select
      value={current}
      onChange={(e) => router.push(e.target.value ? `/proposals?status=${e.target.value}` : "/proposals")}
      className="h-9 w-52 text-[13px]"
    >
      <option value="">Todos os status</option>
      {PROPOSAL_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </Select>
  );
}
