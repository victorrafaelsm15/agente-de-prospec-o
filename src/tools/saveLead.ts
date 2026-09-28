import { getLeadsRepository } from "@/database";
import type { NewLead } from "@/database/leadsRepository";
import type { Lead } from "@/types/lead";

export interface SaveLeadResult {
  lead: Lead;
  wasDuplicate: boolean;
}

/**
 * saveLead — persiste um lead evitando duplicidade (por site, ou por
 * nome + cidade quando não há site). Não sobrescreve leads existentes.
 */
export async function saveLead(candidate: NewLead): Promise<SaveLeadResult> {
  const repository = await getLeadsRepository();

  const duplicate = await repository.findDuplicate({
    name: candidate.name,
    city: candidate.city,
    website: candidate.website,
    phone: candidate.phone,
  });

  if (duplicate) {
    return { lead: duplicate.lead, wasDuplicate: true };
  }

  const lead = await repository.create(candidate);
  return { lead, wasDuplicate: false };
}
