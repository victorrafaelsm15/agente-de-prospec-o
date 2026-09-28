import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { isSupabaseConfigured } from "@/lib/env";
import type {
  ActivityLogRow,
  FollowUpRow,
  InteractionRow,
  MeetingRow,
  SettingsRow,
} from "@/lib/supabase/databaseTypes";
import type {
  ActivityLogEntry,
  Channel,
  CommercialSettings,
  FollowUp,
  FollowUpStatus,
  Interaction,
  InteractionDirection,
  InteractionStatus,
  Meeting,
  MeetingStatus,
} from "@/types/lead";

/**
 * Camada de dados para os recursos de CRM avançado da V3 (interações,
 * reuniões, follow-ups, auditoria e configurações comerciais).
 *
 * Diferente do repositório de leads (que tem um fallback completo em
 * arquivo local para desenvolvimento sem Supabase), estes recursos exigem
 * Supabase configurado — são dados relacionais que não valeria a pena
 * duplicar em um segundo adapter de arquivo só para dev. Sem Supabase,
 * leituras retornam listas vazias (a UI mostra estado vazio normalmente) e
 * escritas lançam um erro claro, nunca fingem sucesso.
 */
function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Este recurso (interações, reuniões, follow-ups ou configurações) exige o Supabase configurado. Veja o README."
    );
  }
  return getSupabaseAdminClient();
}

function interactionRowToDomain(row: InteractionRow): Interaction {
  return {
    id: row.id,
    leadId: row.lead_id,
    channel: row.channel,
    direction: row.direction,
    message: row.message,
    status: row.status,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  };
}

export async function listInteractions(leadId: string): Promise<Interaction[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("interactions")
    .select("*")
    .eq("lead_id", leadId)
    .order("occurred_at", { ascending: false });
  if (error) throw new Error(`Erro ao buscar interações: ${error.message}`);
  return (data as InteractionRow[]).map(interactionRowToDomain);
}

export async function createInteraction(input: {
  leadId: string;
  channel: Channel;
  direction: InteractionDirection;
  message: string | null;
  status: InteractionStatus;
}): Promise<Interaction> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("interactions")
    .insert({
      lead_id: input.leadId,
      channel: input.channel,
      direction: input.direction,
      message: input.message,
      status: input.status,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Erro ao registrar interação: ${error.message}`);
  return interactionRowToDomain(data as InteractionRow);
}

export async function listRecentInteractions(limit: number): Promise<Interaction[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("interactions")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Erro ao buscar interações recentes: ${error.message}`);
  return (data as InteractionRow[]).map(interactionRowToDomain);
}

function meetingRowToDomain(row: MeetingRow): Meeting {
  return {
    id: row.id,
    leadId: row.lead_id,
    scheduledAt: row.scheduled_at,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listMeetings(leadId: string): Promise<Meeting[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("meetings")
    .select("*")
    .eq("lead_id", leadId)
    .order("scheduled_at", { ascending: true });
  if (error) throw new Error(`Erro ao buscar reuniões: ${error.message}`);
  return (data as MeetingRow[]).map(meetingRowToDomain);
}

export async function listUpcomingMeetings(limit: number): Promise<(Meeting & { leadName: string })[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("meetings")
    .select("*, leads(name)")
    .eq("status", "AGENDADA")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`Erro ao buscar próximas reuniões: ${error.message}`);
  return (data as (MeetingRow & { leads: { name: string } | null })[]).map((row) => ({
    ...meetingRowToDomain(row),
    leadName: row.leads?.name ?? "Lead",
  }));
}

export async function createMeeting(input: {
  leadId: string;
  scheduledAt: string;
  notes: string | null;
}): Promise<Meeting> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("meetings")
    .insert({ lead_id: input.leadId, scheduled_at: input.scheduledAt, notes: input.notes, status: "AGENDADA" })
    .select("*")
    .single();
  if (error) throw new Error(`Erro ao agendar reunião: ${error.message}`);
  return meetingRowToDomain(data as MeetingRow);
}

export async function updateMeetingStatus(id: string, status: MeetingStatus): Promise<Meeting | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("meetings")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(`Erro ao atualizar reunião: ${error.message}`);
  return data ? meetingRowToDomain(data as MeetingRow) : null;
}

function followUpRowToDomain(row: FollowUpRow): FollowUp {
  return {
    id: row.id,
    leadId: row.lead_id,
    dueDate: row.due_date,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listFollowUps(filters: {
  leadId?: string;
  status?: FollowUpStatus;
}): Promise<FollowUp[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseAdminClient();
  let query = client.from("follow_ups").select("*");
  if (filters.leadId) query = query.eq("lead_id", filters.leadId);
  if (filters.status) query = query.eq("status", filters.status);
  query = query.order("due_date", { ascending: true });
  const { data, error } = await query;
  if (error) throw new Error(`Erro ao buscar follow-ups: ${error.message}`);
  return (data as FollowUpRow[]).map(followUpRowToDomain);
}

export async function listDueFollowUps(limit: number): Promise<(FollowUp & { leadName: string })[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await client
    .from("follow_ups")
    .select("*, leads(name)")
    .eq("status", "PENDENTE")
    .lte("due_date", today)
    .order("due_date", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`Erro ao buscar follow-ups pendentes: ${error.message}`);
  return (data as (FollowUpRow & { leads: { name: string } | null })[]).map((row) => ({
    ...followUpRowToDomain(row),
    leadName: row.leads?.name ?? "Lead",
  }));
}

export async function createFollowUp(input: {
  leadId: string;
  dueDate: string;
  reason: string | null;
}): Promise<FollowUp> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("follow_ups")
    .insert({ lead_id: input.leadId, due_date: input.dueDate, reason: input.reason, status: "PENDENTE" })
    .select("*")
    .single();
  if (error) throw new Error(`Erro ao criar follow-up: ${error.message}`);
  return followUpRowToDomain(data as FollowUpRow);
}

export async function updateFollowUpStatus(id: string, status: FollowUpStatus): Promise<FollowUp | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("follow_ups")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(`Erro ao atualizar follow-up: ${error.message}`);
  return data ? followUpRowToDomain(data as FollowUpRow) : null;
}

function activityRowToDomain(row: ActivityLogRow): ActivityLogEntry {
  return {
    id: row.id,
    leadId: row.lead_id,
    actor: row.actor as ActivityLogEntry["actor"],
    action: row.action,
    description: row.description,
    createdAt: row.created_at,
  };
}

export async function logActivity(input: {
  leadId?: string | null;
  actor: "ia" | "usuario" | "sistema";
  action: string;
  description: string;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  const client = getSupabaseAdminClient();
  const { error } = await client.from("activity_log").insert({
    lead_id: input.leadId ?? null,
    actor: input.actor,
    action: input.action,
    description: input.description,
  });
  if (error) {
    // Auditoria nunca deve quebrar o fluxo principal — apenas registra no console do servidor.
    console.error("Falha ao registrar activity_log:", error.message);
  }
}

export async function listRecentActivity(limit: number): Promise<ActivityLogEntry[]> {
  if (!isSupabaseConfigured) return [];
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Erro ao buscar atividade: ${error.message}`);
  return (data as ActivityLogRow[]).map(activityRowToDomain);
}

function settingsRowToDomain(row: SettingsRow): CommercialSettings {
  return {
    businessName: row.business_name,
    services: row.services,
    differentiator: row.differentiator,
    targetAudience: row.target_audience,
    tone: row.tone,
    emailSignature: row.email_signature,
    updatedAt: row.updated_at,
  };
}

const EMPTY_SETTINGS: CommercialSettings = {
  businessName: null,
  services: null,
  differentiator: null,
  targetAudience: null,
  tone: null,
  emailSignature: null,
  updatedAt: new Date(0).toISOString(),
};

export async function getSettings(): Promise<CommercialSettings> {
  if (!isSupabaseConfigured) return EMPTY_SETTINGS;
  const client = getSupabaseAdminClient();
  const { data, error } = await client.from("settings").select("*").eq("id", "default").maybeSingle();
  if (error) throw new Error(`Erro ao buscar configurações: ${error.message}`);
  return data ? settingsRowToDomain(data as SettingsRow) : EMPTY_SETTINGS;
}

export async function updateSettings(
  input: Partial<Omit<CommercialSettings, "updatedAt">>
): Promise<CommercialSettings> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("settings")
    .update({
      business_name: input.businessName,
      services: input.services,
      differentiator: input.differentiator,
      target_audience: input.targetAudience,
      tone: input.tone,
      email_signature: input.emailSignature,
    })
    .eq("id", "default")
    .select("*")
    .single();
  if (error) throw new Error(`Erro ao salvar configurações: ${error.message}`);
  return settingsRowToDomain(data as SettingsRow);
}
