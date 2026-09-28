"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsCardsView } from "@/components/leads/LeadsCardsView";
import { BulkActionBar } from "@/components/leads/BulkActionBar";
import type { Lead } from "@/types/lead";
import type { LeadsView } from "@/components/leads/LeadsFilters";

export function LeadsWorkspace({ leads, view }: { leads: Lead[]; view: LeadsView }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? new Set(leads.map((l) => l.id)) : new Set());
    },
    [leads]
  );

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleDone = useCallback(() => {
    clearSelection();
    router.refresh();
  }, [clearSelection, router]);

  return (
    <div className="space-y-4">
      {view === "cards" ? (
        <LeadsCardsView leads={leads} selectedIds={selectedIds} onToggle={toggle} />
      ) : (
        <LeadsTable leads={leads} selectedIds={selectedIds} onToggle={toggle} onToggleAll={toggleAll} />
      )}
      <BulkActionBar selectedIds={Array.from(selectedIds)} onClear={clearSelection} onDone={handleDone} />
    </div>
  );
}
