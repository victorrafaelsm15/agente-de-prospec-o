-- Prospect AI V4 — Proposal AI: catálogo de serviços, propostas comerciais,
-- itens/preços, versionamento, auditoria, links públicos e identidade visual.
-- Migration aditiva: não remove nem altera dados existentes.

do $$ begin
  create type proposal_status as enum (
    'RASCUNHO',
    'PRONTA',
    'ENVIADA',
    'VISUALIZADA',
    'EM_NEGOCIACAO',
    'APROVADA',
    'RECUSADA',
    'EXPIRADA',
    'CANCELADA'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type discount_type as enum ('PERCENTUAL', 'FIXO');
exception
  when duplicate_object then null;
end $$;

-- Catálogo interno de serviços (reutilizável entre propostas).
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  default_price numeric(12, 2),
  unit text not null default 'projeto',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services enable row level security;

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row
  execute function public.set_updated_at();

-- Proposta comercial vinculada a um lead.
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,

  title text not null,
  status proposal_status not null default 'RASCUNHO',
  tone text,

  -- Briefing estruturado (cliente, projeto, presença atual) — editável.
  briefing jsonb not null default '{}'::jsonb,

  -- Diagnóstico comercial (situação atual, oportunidades, solução proposta).
  diagnosis jsonb not null default '{}'::jsonb,

  scope_notes text,
  next_steps jsonb not null default '[]'::jsonb,
  terms text,
  payment_terms text,
  timeline text,

  validity_days integer not null default 7,
  expires_at date,

  discount_type discount_type,
  discount_value numeric(12, 2) not null default 0,
  subtotal numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,

  rejection_reason text,
  accepted_at timestamptz,
  current_version integer not null default 1,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposals_lead_id_idx on public.proposals (lead_id);
create index if not exists proposals_status_idx on public.proposals (status);
create index if not exists proposals_created_at_idx on public.proposals (created_at desc);
alter table public.proposals enable row level security;

drop trigger if exists proposals_set_updated_at on public.proposals;
create trigger proposals_set_updated_at
  before update on public.proposals
  for each row
  execute function public.set_updated_at();

-- Itens de escopo/investimento da proposta.
create table if not exists public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  name text not null,
  description text,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists proposal_items_proposal_id_idx on public.proposal_items (proposal_id);
alter table public.proposal_items enable row level security;

-- Versões (snapshot completo a cada mudança relevante, ex.: negociação).
create table if not exists public.proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  total numeric(12, 2) not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists proposal_versions_proposal_id_idx on public.proposal_versions (proposal_id);
alter table public.proposal_versions enable row level security;

-- Auditoria de eventos da proposta (interno e do cliente via link público).
create table if not exists public.proposal_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  event text not null,
  actor text not null default 'usuario',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists proposal_events_proposal_id_idx on public.proposal_events (proposal_id);
create index if not exists proposal_events_created_at_idx on public.proposal_events (created_at desc);
alter table public.proposal_events enable row level security;

-- Tokens de link público seguro (nunca usar o id da proposta como link).
create table if not exists public.proposal_tokens (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists proposal_tokens_token_idx on public.proposal_tokens (token);
create index if not exists proposal_tokens_proposal_id_idx on public.proposal_tokens (proposal_id);
alter table public.proposal_tokens enable row level security;

-- Identidade visual e dados comerciais usados na proposta (na tabela
-- settings já existente da V3 — evita criar uma segunda tabela singleton).
alter table public.settings
  add column if not exists logo_url text,
  add column if not exists primary_color text,
  add column if not exists secondary_color text,
  add column if not exists social_links jsonb not null default '[]'::jsonb,
  add column if not exists contact_phone text,
  add column if not exists contact_email text;

comment on table public.services is 'Catálogo interno de serviços vendidos, reutilizável entre propostas (Prospect AI V4).';
comment on table public.proposals is 'Propostas comerciais vinculadas a um lead (Prospect AI V4).';
comment on table public.proposal_items is 'Itens de escopo/investimento de uma proposta (Prospect AI V4).';
comment on table public.proposal_versions is 'Snapshots de versões de uma proposta, criados em mudanças relevantes (Prospect AI V4).';
comment on table public.proposal_events is 'Trilha de auditoria de eventos de uma proposta, incluindo ações do cliente via link público (Prospect AI V4).';
comment on table public.proposal_tokens is 'Tokens seguros para o link público de visualização de uma proposta (Prospect AI V4).';
