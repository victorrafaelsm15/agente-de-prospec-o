-- Prospect AI — schema completo do Supabase/PostgreSQL (V3)
-- Execute este script no SQL Editor de um projeto Supabase NOVO.
--
-- Se você já tem um projeto rodando uma versão anterior, NÃO rode este
-- arquivo — rode apenas as migrations que ainda não aplicou, em ordem, em
-- database/migrations/. Cada uma é aditiva e não apaga dados existentes.

create extension if not exists "pgcrypto";

do $$ begin
  create type lead_status as enum (
    'NOVO',
    'ANALISADO',
    'INTERESSANTE',
    'CONTATADO',
    'RESPONDEU',
    'REUNIAO',
    'PROPOSTA',
    'CLIENTE',
    'DESCARTADO',
    'QUALIFICADO',
    'CONTATO_PENDENTE',
    'NEGOCIACAO'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type lead_priority as enum ('BAIXA', 'MEDIA', 'ALTA');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type website_status as enum (
    'NAO_ENCONTRADO',
    'ACESSIVEL',
    'INACESSIVEL',
    'NAO_VERIFICADO'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),

  -- Identificação
  name text not null,
  category text not null,
  city text not null,
  state text not null,

  -- Contato / presença digital
  website text,
  instagram text,
  phone text,
  whatsapp text,
  email text,
  address text,
  description text,

  -- Análise do site
  website_status website_status not null default 'NAO_VERIFICADO',
  website_analysis jsonb not null default '{}'::jsonb,

  -- Oportunidade
  opportunities jsonb not null default '[]'::jsonb,
  score integer not null default 0 check (score >= 0 and score <= 100),
  priority lead_priority not null default 'BAIXA',

  -- Conteúdo gerado por IA
  ai_analysis text,
  outreach_message text,
  ai_generated boolean not null default false,

  -- Fluxo comercial (CRM)
  status lead_status not null default 'NOVO',
  status_history jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  next_action text,
  next_action_date date,
  briefing text,

  -- Rastreabilidade / anti-alucinação
  source text not null default 'Não verificado',
  evidence jsonb not null default '[]'::jsonb,
  research_query text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_priority_idx on public.leads (priority);
create index if not exists leads_score_idx on public.leads (score desc);
create index if not exists leads_category_idx on public.leads (category);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_next_action_date_idx on public.leads (next_action_date);

-- Índice único parcial para ajudar na deduplicação por site
create unique index if not exists leads_website_unique_idx
  on public.leads (lower(website))
  where website is not null and website <> '';

-- Índice auxiliar para deduplicação por nome + cidade
create index if not exists leads_name_city_idx
  on public.leads (lower(name), lower(city));

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row
  execute function public.set_updated_at();

-- Row Level Security: habilitada e SEM policies para anon/authenticated.
-- Toda a leitura/escrita acontece no servidor (API routes) usando a
-- SUPABASE_SERVICE_ROLE_KEY (ou "secret key", em projetos novos), que
-- ignora RLS por padrão. Isso garante que a tabela fique inacessível
-- diretamente pelo cliente (browser).
alter table public.leads enable row level security;

comment on table public.leads is 'Leads de prospecção gerados pelo Prospect AI agent.';

-- =============================================================================
-- V3 — SDR AI: canais de contato, reuniões, follow-ups, auditoria e config.
-- =============================================================================

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
