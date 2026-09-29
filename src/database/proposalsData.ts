import "server-only";
import { randomBytes } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { isSupabaseConfigured } from "@/lib/env";
import { calculateExpiresAt, calculateProposalTotals } from "@/lib/proposalCalc";
import { getSettings } from "@/database/sdrData";
import { getLeadsRepository } from "@/database";
import type {
  ProposalEventRow,
  ProposalItemRow,
  ProposalRow,
  ProposalTokenRow,
  ProposalUpdate as ProposalRowUpdate,
  ProposalVersionRow,
  ServiceRow,
} from "@/lib/supabase/databaseTypes";
import type {
  DiscountType,
  PublicProposal,
  Proposal,
  ProposalEvent,
  ProposalItem,
  ProposalStatus,
  ProposalTokenInfo,
  ProposalVersion,
  ProposalWithItems,
  Service,
} from "@/types/proposal";

function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error("Propostas exigem o Supabase configurado. Veja o README.");
  }
  return getSupabaseAdminClient();
}

// ---------------------------------------------------------------------------
// Services (catálogo)
// ---------------------------------------------------------------------------

function serviceRowToDomain(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    defaultPrice: row.default_price,
    unit: row.unit,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listServices(includeInactive = false): Promise<Service[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseAdminClient();
  let query = client.from("services").select("*").order("name", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(`Erro ao buscar serviços: ${error.message}`);
  return (data as ServiceRow[]).map(serviceRowToDomain);
}

export async function createService(input: {
  name: string;
  description: string | null;
  defaultPrice: number | null;
  unit: string;
}): Promise<Service> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("services")
    .insert({
      name: input.name,
      description: input.description,
      default_price: input.defaultPrice,
      unit: input.unit || "projeto",
      active: true,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Erro ao criar serviço: ${error.message}`);
  return serviceRowToDomain(data as ServiceRow);
}

export async function updateService(
  id: string,
  input: Partial<{ name: string; description: string | null; defaultPrice: number | null; unit: string; active: boolean }>
): Promise<Service | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("services")
    .update({
      name: input.name,
      description: input.description,
      default_price: input.defaultPrice,
      unit: input.unit,
      active: input.active,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(`Erro ao atualizar serviço: ${error.message}`);
  return data ? serviceRowToDomain(data as ServiceRow) : null;
}

export async function deleteService(id: string): Promise<boolean> {
  const client = requireSupabase();
  const { error, count } = await client.from("services").delete({ count: "exact" }).eq("id", id);
  if (error) throw new Error(`Erro ao excluir serviço: ${error.message}`);
  return (count ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Proposals
// ---------------------------------------------------------------------------

function proposalRowToDomain(row: ProposalRow): Proposal {
  return {
    id: row.id,
    leadId: row.lead_id,
    title: row.title,
    status: row.status,
    tone: row.tone as Proposal["tone"],
    briefing: row.briefing ?? {},
    diagnosis: row.diagnosis ?? {},
    scopeNotes: row.scope_notes,
    nextSteps: row.next_steps ?? [],
    terms: row.terms,
    paymentTerms: row.payment_terms,
    timeline: row.timeline,
    validityDays: row.validity_days,
    expiresAt: row.expires_at,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    rejectionReason: row.rejection_reason,
    acceptedAt: row.accepted_at,
    currentVersion: row.current_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function itemRowToDomain(row: ProposalItemRow): ProposalItem {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    serviceId: row.service_id,
    name: row.name,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    total: Number(row.total),
    position: row.position,
    createdAt: row.created_at,
  };
}

export async function listProposalsForLead(leadId: string): Promise<Proposal[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("proposals")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Erro ao buscar propostas: ${error.message}`);
  return (data as ProposalRow[]).map(proposalRowToDomain);
}

export async function listAllProposals(): Promise<Proposal[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseAdminClient();
  const { data, error } = await client.from("proposals").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Erro ao buscar propostas: ${error.message}`);
  return (data as ProposalRow[]).map(proposalRowToDomain);
}

export async function getProposalItems(proposalId: string): Promise<ProposalItem[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("proposal_items")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("position", { ascending: true });
  if (error) throw new Error(`Erro ao buscar itens da proposta: ${error.message}`);
  return (data as ProposalItemRow[]).map(itemRowToDomain);
}

export async function getProposal(id: string): Promise<ProposalWithItems | null> {
  if (!isSupabaseConfigured) return null;
  const client = getSupabaseAdminClient();
  const { data, error } = await client.from("proposals").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Erro ao buscar proposta: ${error.message}`);
  if (!data) return null;
  const items = await getProposalItems(id);
  return { ...proposalRowToDomain(data as ProposalRow), items };
}

export async function createProposal(input: {
  leadId: string;
  title: string;
  tone?: string | null;
}): Promise<Proposal> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("proposals")
    .insert({
      lead_id: input.leadId,
      title: input.title,
      status: "RASCUNHO",
      tone: input.tone ?? null,
      briefing: {},
      diagnosis: {},
      next_steps: [],
      validity_days: 7,
      expires_at: calculateExpiresAt(new Date(), 7),
      discount_type: null,
      discount_value: 0,
      subtotal: 0,
      total: 0,
      current_version: 1,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Erro ao criar proposta: ${error.message}`);
  const proposal = proposalRowToDomain(data as ProposalRow);
  await logProposalEvent(proposal.id, "criada", "usuario");
  return proposal;
}

export interface ProposalUpdateInput {
  title?: string;
  status?: ProposalStatus;
  tone?: string | null;
  briefing?: Proposal["briefing"];
  diagnosis?: Proposal["diagnosis"];
  scopeNotes?: string | null;
  nextSteps?: string[];
  terms?: string | null;
  paymentTerms?: string | null;
  timeline?: string | null;
  validityDays?: number;
  discountType?: DiscountType | null;
  discountValue?: number;
  rejectionReason?: string | null;
}

export async function updateProposal(id: string, input: ProposalUpdateInput): Promise<ProposalWithItems | null> {
  const client = requireSupabase();

  const patch: ProposalRowUpdate = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.status !== undefined) patch.status = input.status;
  if (input.tone !== undefined) patch.tone = input.tone;
  if (input.briefing !== undefined) patch.briefing = input.briefing;
  if (input.diagnosis !== undefined) patch.diagnosis = input.diagnosis;
  if (input.scopeNotes !== undefined) patch.scope_notes = input.scopeNotes;
  if (input.nextSteps !== undefined) patch.next_steps = input.nextSteps;
  if (input.terms !== undefined) patch.terms = input.terms;
  if (input.paymentTerms !== undefined) patch.payment_terms = input.paymentTerms;
  if (input.timeline !== undefined) patch.timeline = input.timeline;
  if (input.rejectionReason !== undefined) patch.rejection_reason = input.rejectionReason;

  if (input.discountType !== undefined) patch.discount_type = input.discountType;
  if (input.discountValue !== undefined) patch.discount_value = input.discountValue;

  if (input.validityDays !== undefined) {
    patch.validity_days = input.validityDays;
    patch.expires_at = calculateExpiresAt(new Date(), input.validityDays);
  }

  // Se desconto mudou, recalcula os totais a partir dos itens já salvos.
  if (input.discountType !== undefined || input.discountValue !== undefined) {
    const items = await getProposalItems(id);
    const { data: current } = await client.from("proposals").select("discount_type, discount_value").eq("id", id).single();
    const discountType = input.discountType !== undefined ? input.discountType : (current?.discount_type ?? null);
    const discountValue = input.discountValue !== undefined ? input.discountValue : Number(current?.discount_value ?? 0);
    const totals = calculateProposalTotals(items, discountType, discountValue);
    patch.subtotal = totals.subtotal;
    patch.total = totals.total;
  }

  if (input.status === "APROVADA") patch.accepted_at = new Date().toISOString();

  const { data, error } = await client.from("proposals").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(`Erro ao atualizar proposta: ${error.message}`);
  if (!data) return null;

  if (input.status !== undefined) {
    await logProposalEvent(id, "status_alterado", "usuario", { status: input.status });
  } else {
    await logProposalEvent(id, "editada", "usuario");
  }

  const items = await getProposalItems(id);
  return { ...proposalRowToDomain(data as ProposalRow), items };
}

export async function deleteProposal(id: string): Promise<boolean> {
  const client = requireSupabase();
  const { error, count } = await client.from("proposals").delete({ count: "exact" }).eq("id", id);
  if (error) throw new Error(`Erro ao excluir proposta: ${error.message}`);
  return (count ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Items (substituição em lote — cobre adicionar/remover/reordenar/editar)
// ---------------------------------------------------------------------------

export async function replaceProposalItems(
  proposalId: string,
  items: { serviceId: string | null; name: string; description: string | null; quantity: number; unitPrice: number }[]
): Promise<ProposalWithItems | null> {
  const client = requireSupabase();

  const { error: deleteError } = await client.from("proposal_items").delete().eq("proposal_id", proposalId);
  if (deleteError) throw new Error(`Erro ao atualizar itens: ${deleteError.message}`);

  if (items.length > 0) {
    const rows = items.map((item, index) => ({
      proposal_id: proposalId,
      service_id: item.serviceId,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: Math.round(Math.max(0, item.quantity) * Math.max(0, item.unitPrice) * 100) / 100,
      position: index,
    }));
    const { error: insertError } = await client.from("proposal_items").insert(rows);
    if (insertError) throw new Error(`Erro ao salvar itens: ${insertError.message}`);
  }

  const { data: proposalRow, error: proposalError } = await client
    .from("proposals")
    .select("discount_type, discount_value")
    .eq("id", proposalId)
    .single();
  if (proposalError) throw new Error(`Erro ao buscar proposta: ${proposalError.message}`);

  const totals = calculateProposalTotals(items, proposalRow.discount_type, Number(proposalRow.discount_value));
  const { data, error } = await client
    .from("proposals")
    .update({ subtotal: totals.subtotal, total: totals.total })
    .eq("id", proposalId)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(`Erro ao atualizar totais: ${error.message}`);
  if (!data) return null;

  await logProposalEvent(proposalId, "editada", "usuario", { itemCount: items.length });

  const savedItems = await getProposalItems(proposalId);
  return { ...proposalRowToDomain(data as ProposalRow), items: savedItems };
}

// ---------------------------------------------------------------------------
// Duplicate
// ---------------------------------------------------------------------------

export async function duplicateProposal(id: string): Promise<ProposalWithItems | null> {
  const client = requireSupabase();
  const original = await getProposal(id);
  if (!original) return null;

  const { data, error } = await client
    .from("proposals")
    .insert({
      lead_id: original.leadId,
      title: `${original.title} (cópia)`,
      status: "RASCUNHO",
      tone: original.tone,
      briefing: original.briefing,
      diagnosis: original.diagnosis,
      scope_notes: original.scopeNotes,
      next_steps: original.nextSteps,
      terms: original.terms,
      payment_terms: original.paymentTerms,
      timeline: original.timeline,
      validity_days: original.validityDays,
      expires_at: calculateExpiresAt(new Date(), original.validityDays),
      discount_type: original.discountType,
      discount_value: original.discountValue,
      subtotal: original.subtotal,
      total: original.total,
      current_version: 1,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Erro ao duplicar proposta: ${error.message}`);

  const newProposal = proposalRowToDomain(data as ProposalRow);

  if (original.items.length > 0) {
    const rows = original.items.map((item) => ({
      proposal_id: newProposal.id,
      service_id: item.serviceId,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total,
      position: item.position,
    }));
    const { error: insertError } = await client.from("proposal_items").insert(rows);
    if (insertError) throw new Error(`Erro ao duplicar itens: ${insertError.message}`);
  }

  await logProposalEvent(newProposal.id, "criada", "usuario", { duplicatedFrom: id });

  const items = await getProposalItems(newProposal.id);
  return { ...newProposal, items };
}

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

function versionRowToDomain(row: ProposalVersionRow): ProposalVersion {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    versionNumber: row.version_number,
    snapshot: row.snapshot,
    total: Number(row.total),
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function listProposalVersions(proposalId: string): Promise<ProposalVersion[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("proposal_versions")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("version_number", { ascending: false });
  if (error) throw new Error(`Erro ao buscar versões: ${error.message}`);
  return (data as ProposalVersionRow[]).map(versionRowToDomain);
}

export async function createProposalVersion(proposalId: string, note: string | null): Promise<ProposalVersion | null> {
  const client = requireSupabase();
  const proposal = await getProposal(proposalId);
  if (!proposal) return null;

  const nextVersionNumber = proposal.currentVersion;

  const { data, error } = await client
    .from("proposal_versions")
    .insert({
      proposal_id: proposalId,
      version_number: nextVersionNumber,
      snapshot: proposal,
      total: proposal.total,
      note,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Erro ao criar versão: ${error.message}`);

  await client.from("proposals").update({ current_version: nextVersionNumber + 1 }).eq("id", proposalId);
  await logProposalEvent(proposalId, "versao_criada", "usuario", { versionNumber: nextVersionNumber, note });

  return versionRowToDomain(data as ProposalVersionRow);
}

// ---------------------------------------------------------------------------
// Events (auditoria)
// ---------------------------------------------------------------------------

function eventRowToDomain(row: ProposalEventRow): ProposalEvent {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    event: row.event,
    actor: row.actor as ProposalEvent["actor"],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export async function logProposalEvent(
  proposalId: string,
  event: string,
  actor: "usuario" | "cliente" | "ia" | "sistema",
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const client = getSupabaseAdminClient();
  const { error } = await client.from("proposal_events").insert({ proposal_id: proposalId, event, actor, metadata });
  if (error) console.error("Falha ao registrar proposal_event:", error.message);
}

export async function listProposalEvents(proposalId: string): Promise<ProposalEvent[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("proposal_events")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Erro ao buscar histórico: ${error.message}`);
  return (data as ProposalEventRow[]).map(eventRowToDomain);
}

// ---------------------------------------------------------------------------
// Tokens (link público)
// ---------------------------------------------------------------------------

function tokenRowToDomain(row: ProposalTokenRow): ProposalTokenInfo {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    token: row.token,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  };
}

export async function getActiveProposalToken(proposalId: string): Promise<ProposalTokenInfo | null> {
  if (!isSupabaseConfigured) return null;
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("proposal_tokens")
    .select("*")
    .eq("proposal_id", proposalId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar link: ${error.message}`);
  return data ? tokenRowToDomain(data as ProposalTokenRow) : null;
}

export async function createProposalToken(proposalId: string): Promise<ProposalTokenInfo> {
  const client = requireSupabase();
  const token = randomBytes(24).toString("base64url");
  const { data, error } = await client
    .from("proposal_tokens")
    .insert({ proposal_id: proposalId, token })
    .select("*")
    .single();
  if (error) throw new Error(`Erro ao criar link: ${error.message}`);
  return tokenRowToDomain(data as ProposalTokenRow);
}

export async function revokeProposalToken(id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("proposal_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(`Erro ao revogar link: ${error.message}`);
}

export async function getProposalByToken(token: string): Promise<ProposalWithItems | null> {
  if (!isSupabaseConfigured) return null;
  const client = getSupabaseAdminClient();
  const { data: tokenRow, error: tokenError } = await client
    .from("proposal_tokens")
    .select("*")
    .eq("token", token)
    .is("revoked_at", null)
    .maybeSingle();
  if (tokenError) throw new Error(`Erro ao validar link: ${tokenError.message}`);
  if (!tokenRow) return null;
  return getProposal(tokenRow.proposal_id);
}

/**
 * Monta a visão pública (client-safe) de uma proposta — nunca inclui score,
 * notas internas, análise interna ou qualquer dado que não deva ser visto
 * pelo cliente. Usada tanto pelo link público quanto pela geração de PDF
 * (mesmo conteúdo em ambos os casos).
 */
export async function toPublicProposal(proposal: ProposalWithItems): Promise<PublicProposal | null> {
  const repository = await getLeadsRepository();
  const lead = await repository.getById(proposal.leadId);
  if (!lead) return null;

  const settings = await getSettings().catch(() => null);

  return {
    title: proposal.title,
    status: proposal.status,
    tone: proposal.tone,
    briefing: proposal.briefing,
    diagnosis: proposal.diagnosis,
    items: proposal.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
    scopeNotes: proposal.scopeNotes,
    nextSteps: proposal.nextSteps,
    terms: proposal.terms,
    paymentTerms: proposal.paymentTerms,
    timeline: proposal.timeline,
    discountType: proposal.discountType,
    discountValue: proposal.discountValue,
    subtotal: proposal.subtotal,
    total: proposal.total,
    validityDays: proposal.validityDays,
    expiresAt: proposal.expiresAt,
    currentVersion: proposal.currentVersion,
    createdAt: proposal.createdAt,
    leadName: lead.name,
    brand: {
      businessName: settings?.businessName ?? null,
      logoUrl: settings?.logoUrl ?? null,
      primaryColor: settings?.primaryColor ?? null,
      secondaryColor: settings?.secondaryColor ?? null,
      contactPhone: settings?.contactPhone ?? null,
      contactEmail: settings?.contactEmail ?? null,
      socialLinks: settings?.socialLinks ?? [],
    },
  };
}

export async function getPublicProposalByToken(token: string): Promise<PublicProposal | null> {
  const proposal = await getProposalByToken(token);
  if (!proposal) return null;
  return toPublicProposal(proposal);
}

/** Registra a visualização do cliente e promove ENVIADA -> VISUALIZADA (nunca regride um status mais avançado). */
export async function recordProposalView(token: string): Promise<void> {
  const proposal = await getProposalByToken(token);
  if (!proposal) return;
  if (proposal.status === "ENVIADA") {
    await updateProposal(proposal.id, { status: "VISUALIZADA" });
  }
  await logProposalEvent(proposal.id, "visualizada", "cliente");
}

export async function getPublicProposalById(id: string): Promise<PublicProposal | null> {
  const proposal = await getProposal(id);
  if (!proposal) return null;
  return toPublicProposal(proposal);
}
