-- Prospect AI — migration 001 (schema inicial V1)
-- Execute este script no SQL Editor do seu projeto Supabase.

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
    'DESCARTADO'
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

  -- Fluxo comercial
  status lead_status not null default 'NOVO',

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
-- SUPABASE_SERVICE_ROLE_KEY, que ignora RLS por padrão. Isso garante que a
-- tabela fique inacessível diretamente pelo cliente (browser).
alter table public.leads enable row level security;

comment on table public.leads is 'Leads de prospecção gerados pelo Prospect AI agent.';
