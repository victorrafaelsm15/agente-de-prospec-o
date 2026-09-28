-- Prospect AI V2 — campos de CRM (notas, próxima ação, histórico de status,
-- WhatsApp e e-mail). Migration aditiva: não remove nem altera dados
-- existentes. Segura para rodar em um banco já em uso.
--
-- Execute no SQL Editor do Supabase (ou via `database/schema.sql` completo
-- em um projeto novo, que já inclui estas colunas).

alter table public.leads
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists notes jsonb not null default '[]'::jsonb,
  add column if not exists next_action text,
  add column if not exists next_action_date date,
  add column if not exists status_history jsonb not null default '[]'::jsonb;

-- Preenche o histórico de status dos leads já existentes com o status atual,
-- para que a timeline nunca comece vazia para leads antigos.
update public.leads
set status_history = jsonb_build_array(
  jsonb_build_object('status', status, 'changedAt', coalesce(updated_at, created_at))
)
where status_history = '[]'::jsonb;

create index if not exists leads_next_action_date_idx on public.leads (next_action_date);
