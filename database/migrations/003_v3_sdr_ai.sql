-- Prospect AI V3 — SDR AI: pipeline expandido, canais de contato, reuniões,
-- follow-ups, briefing, configurações comerciais e trilha de auditoria.
-- Migration aditiva: não remove nem altera dados existentes.

-- Novos status no pipeline comercial (mantém todos os existentes da V1/V2).
alter type lead_status add value if not exists 'QUALIFICADO';
alter type lead_status add value if not exists 'CONTATO_PENDENTE';
alter type lead_status add value if not exists 'NEGOCIACAO';

-- Rascunho de briefing comercial gerado pela IA (V3) — preparação para a V4.
alter table public.leads
  add column if not exists briefing text;

do $$ begin
  create type interaction_channel as enum ('WHATSAPP', 'EMAIL', 'INSTAGRAM', 'TELEFONE', 'OUTRO');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type interaction_direction as enum ('SAIDA', 'ENTRADA');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type interaction_status as enum ('RASCUNHO', 'ENVIADO', 'FALHOU', 'RECEBIDO');
exception
  when duplicate_object then null;
end $$;

-- Histórico de contatos multicanal (WhatsApp/E-mail/Instagram/Telefone).
create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel interaction_channel not null,
  direction interaction_direction not null default 'SAIDA',
  message text,
  status interaction_status not null default 'RASCUNHO',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists interactions_lead_id_idx on public.interactions (lead_id);
create index if not exists interactions_occurred_at_idx on public.interactions (occurred_at desc);
alter table public.interactions enable row level security;

do $$ begin
  create type meeting_status as enum ('AGENDADA', 'REALIZADA', 'CANCELADA');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  scheduled_at timestamptz not null,
  notes text,
  status meeting_status not null default 'AGENDADA',
  created_at timestamptz not null default now()
);

create index if not exists meetings_lead_id_idx on public.meetings (lead_id);
create index if not exists meetings_scheduled_at_idx on public.meetings (scheduled_at);
alter table public.meetings enable row level security;

do $$ begin
  create type follow_up_status as enum ('PENDENTE', 'CONCLUIDO', 'IGNORADO');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  due_date date not null,
  reason text,
  status follow_up_status not null default 'PENDENTE',
  created_at timestamptz not null default now()
);

create index if not exists follow_ups_lead_id_idx on public.follow_ups (lead_id);
create index if not exists follow_ups_due_date_idx on public.follow_ups (due_date);
create index if not exists follow_ups_status_idx on public.follow_ups (status);
alter table public.follow_ups enable row level security;

-- Trilha de auditoria de ações importantes (IA e usuário).
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  actor text not null default 'sistema',
  action text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_lead_id_idx on public.activity_log (lead_id);
create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);
alter table public.activity_log enable row level security;

-- Perfil comercial (singleton) usado para personalizar mensagens/briefings.
create table if not exists public.settings (
  id text primary key default 'default',
  business_name text,
  services text,
  differentiator text,
  target_audience text,
  tone text,
  email_signature text,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row
  execute function public.set_updated_at();

insert into public.settings (id) values ('default')
  on conflict (id) do nothing;

comment on table public.interactions is 'Histórico de contatos multicanal por lead (Prospect AI V3).';
comment on table public.meetings is 'Reuniões agendadas por lead (Prospect AI V3).';
comment on table public.follow_ups is 'Follow-ups pendentes por lead, criados manualmente após sugestão da IA (Prospect AI V3).';
comment on table public.activity_log is 'Trilha de auditoria de ações da IA e do usuário (Prospect AI V3).';
comment on table public.settings is 'Perfil comercial usado para personalizar mensagens e briefings (Prospect AI V3).';
