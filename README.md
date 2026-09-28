# Prospect AI

Plataforma de prospecção, análise e organização comercial com IA, feita para
quem trabalha com criação e redesign de sites profissionais. Você descreve o
tipo de cliente que procura (ex: *"20 dentistas em Teresina, Piauí, com
Instagram ativo e site desatualizado"*), o agente pesquisa negócios reais,
analisa a presença digital de cada um, calcula um score de oportunidade e
sugere uma mensagem de abordagem personalizada — **sem enviar nada
automaticamente**. Os leads viram um CRM completo: tabela, cards, Kanban,
notas, próxima ação e histórico de status.

**V2:** CRM (tabela/cards/Kanban com arrastar-e-soltar), contatos clicáveis
(site/Instagram/WhatsApp/telefone/e-mail, sempre extraídos de uma fonte real),
critérios de qualificação no Agente, notas internas, próxima ação, histórico
de status, exportação CSV, dashboard com distribuições, e uma revisão geral
de UI (hover/active/loading em todos os elementos interativos).

## Sumário

- [Como funciona](#como-funciona)
- [Stack](#stack)
- [Instalação](#instalação)
- [Configuração das variáveis de ambiente](#configuração-das-variáveis-de-ambiente)
- [Configuração do banco de dados (Supabase)](#configuração-do-banco-de-dados-supabase)
- [Configuração da IA (Anthropic Claude)](#configuração-da-ia-anthropic-claude)
- [Configuração da busca de negócios (Google Places)](#configuração-da-busca-de-negócios-google-places)
- [Rodando em desenvolvimento](#rodando-em-desenvolvimento)
- [Deploy na Vercel](#deploy-na-vercel)
- [O que está implementado](#o-que-está-implementado)
- [O que depende de configuração externa](#o-que-depende-de-configuração-externa)
- [Arquitetura do código](#arquitetura-do-código)

## Como funciona

1. Na tela **Agente** (`/agent`), você informa nicho, cidade, estado,
   quantidade de leads, critérios de qualificação opcionais (sem site, site
   desatualizado, Instagram ativo, negócio estabelecido) e instruções
   adicionais.
2. O `ProspectingAgent` (`src/agents/ProspectingAgent.ts`) executa uma
   sequência de ferramentas, emitindo o progresso em tempo real: pesquisar
   negócios → remover duplicados → inspecionar site → analisar presença
   digital → identificar oportunidades → qualificar (se houver critérios) →
   gerar mensagens personalizadas → salvar lead. Leads que não atendem aos
   critérios selecionados são descartados automaticamente, com o motivo
   mostrado na tela.
3. Os leads salvos aparecem no **Dashboard** (`/`, com distribuições por
   status/score e leads de maior oportunidade) e no **CRM de Leads**
   (`/leads`), com três visualizações — tabela, cards e Kanban (arraste um
   card para mudar o status) —, filtros avançados, busca, seleção múltipla
   com ações em lote e exportação CSV.
4. Em `/leads/[id]` você vê a análise completa, a presença digital detalhada
   (SEO básico, mobile, conversão, conteúdo), o score com as razões de cada
   ponto, contatos clicáveis (site/Instagram/WhatsApp/telefone/e-mail), a
   mensagem sugerida (editável e copiável), notas internas, próxima ação e o
   histórico de mudanças de status.

O sistema **nunca inventa dados**: quando uma informação não pôde ser
verificada, os campos mostram "Não encontrado" ou "Não foi possível
verificar" em vez de um valor inventado. Quando uma integração externa não
está configurada, a interface avisa isso explicitamente em vez de simular um
resultado.

## Stack

- **Frontend/Backend:** Next.js 16 (App Router) + React 19 + TypeScript, com
  API routes fazendo o papel de backend dentro do mesmo projeto.
- **UI:** Tailwind CSS v4, componentes próprios (sem biblioteca de UI
  pesada), ícones via `lucide-react`.
- **Banco de dados:** Supabase/PostgreSQL (schema em `database/schema.sql`).
- **IA:** Anthropic Claude via `@anthropic-ai/sdk`, usada para gerar a
  análise do lead e a mensagem de abordagem.
- **Busca de negócios:** Google Places API (New).

## Instalação

Pré-requisitos: Node.js 20+ e npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

**Sem nenhuma variável de ambiente configurada, a aplicação já funciona**:
o Dashboard, o Agente e a lista de Leads carregam normalmente. A única
diferença é que a pesquisa de negócios mostrará "Pesquisa externa não
configurada" em vez de leads reais (veja
[O que depende de configuração externa](#o-que-depende-de-configuração-externa)),
e os leads (quando existirem) são salvos em um arquivo local em vez do
Supabase.

## Configuração das variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha o que for aplicável. Nenhum
valor de exemplo é um segredo real — cada chave deve ser obtida no serviço
correspondente.

| Variável | Obrigatória? | Para quê |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Recomendada | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Recomendada | Acesso privilegiado ao banco, usado só no servidor |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Opcional nesta V1 | Reservada para uso futuro no client |
| `ANTHROPIC_API_KEY` | Opcional | Habilita análise e mensagens geradas por IA |
| `ANTHROPIC_MODEL` | Opcional | Padrão: `claude-sonnet-5` |
| `GOOGLE_PLACES_API_KEY` | Opcional | Habilita a busca real de negócios |
| `ENABLE_DEMO_MODE` | Opcional (dev) | `true` mostra negócios fictícios claramente rotulados quando a busca real não está configurada |

**Nunca** coloque valores reais no `.env.example` (ele é versionado). Use
sempre `.env.local` (ignorado pelo git) para as chaves reais.

## Configuração do banco de dados (Supabase)

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. **Projeto novo:** no SQL Editor, rode o conteúdo de
   [`database/schema.sql`](database/schema.sql) (schema completo, já com os
   campos da V2). Isso cria a tabela `leads`, os índices e habilita Row
   Level Security.
   **Projeto que já rodava a V1:** rode apenas
   [`database/migrations/002_v2_crm_fields.sql`](database/migrations/002_v2_crm_fields.sql) —
   é aditivo, não apaga nenhum lead existente. O histórico completo de
   migrations fica em [`database/migrations/`](database/migrations/).
3. Em **Project Settings → API Keys**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` (ou `secret key`, em projetos novos) → `SUPABASE_SERVICE_ROLE_KEY`
     (secreta — nunca exponha no frontend; usada apenas nas API routes do
     servidor, é quem ignora o RLS)
   - `anon` (ou `publishable key`, em projetos novos) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     (reservada para uso futuro no client)

### Modo de desenvolvimento sem Supabase

Se `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` não estiverem
configuradas, a aplicação usa automaticamente um repositório alternativo que
grava os leads em `.data/leads.json` (pasta ignorada pelo git). Isso permite
testar todo o restante do produto — Dashboard, Agente, Leads — sem precisar
criar um projeto Supabase primeiro.

**Importante:** esse modo é só para desenvolvimento local. O sistema de
arquivos de uma função serverless na Vercel é efêmero e não é compartilhado
entre instâncias — **configure o Supabase antes de publicar em produção**.

## Configuração da IA (Anthropic Claude)

1. Crie uma chave em [console.anthropic.com](https://console.anthropic.com).
2. Defina `ANTHROPIC_API_KEY` no `.env.local`.

Sem essa chave, o sistema continua funcionando normalmente, mas a análise do
lead e a mensagem de abordagem são geradas por um algoritmo baseado em regras
(usando apenas os fatos verificados), e a interface marca claramente esse
conteúdo como "Gerado por regras (IA não configurada)" em vez de atribuí-lo à
IA.

## Configuração da busca de negócios (Google Places)

1. No [Google Cloud Console](https://console.cloud.google.com), ative a
   **Places API (New)** e habilite faturamento no projeto.
2. Crie uma chave de API e defina `GOOGLE_PLACES_API_KEY` no `.env.local`.

Sem essa chave, o Agente informa explicitamente "Pesquisa externa não
configurada" e não retorna leads — **o sistema nunca inventa resultados de
pesquisa**. Para testar o restante do fluxo (score, análise, UI) sem essa
chave, defina `ENABLE_DEMO_MODE=true`: o agente passa a usar negócios
fictícios, sempre marcados como dado de demonstração no campo "Fonte" de
cada lead.

## Rodando em desenvolvimento

```bash
npm run dev      # servidor de desenvolvimento em http://localhost:3000
npm run lint     # ESLint
npm run build    # build de produção (também roda checagem de tipos)
npm run start    # serve o build de produção localmente
```

## Deploy na Vercel

1. Suba o projeto para um repositório Git (GitHub, GitLab ou Bitbucket).
2. Em [vercel.com](https://vercel.com), importe o repositório.
3. Em **Environment Variables**, configure as mesmas variáveis do
   `.env.local` (no mínimo `NEXT_PUBLIC_SUPABASE_URL` e
   `SUPABASE_SERVICE_ROLE_KEY` para persistência real; `ANTHROPIC_API_KEY` e
   `GOOGLE_PLACES_API_KEY` para as integrações completas).
4. Deploy. O build (`next build`) já é validado localmente antes de cada
   entrega — não há passos adicionais de configuração na Vercel.

Não configure `ENABLE_DEMO_MODE=true` em produção.

## O que está implementado

**Da V1:**
- Dashboard com métricas reais e atividade recente, com estado vazio elegante.
- Agente de prospecção com progresso em tempo real (streaming), proteção
  contra execuções simultâneas e tratamento de erros.
- Ferramentas do agente desacopladas (`src/tools/`): `findBusinesses`,
  `inspectWebsite` (verificação HTTP real, sem depender de API paga),
  `analyzeWebsite`, `generateLeadAnalysis`, `generateOutreachMessage`,
  `saveLead`, e `searchWeb` (reservada para o futuro).
- Score de oportunidade (0–100) convertido em prioridade Baixa/Média/Alta.
- Deduplicação de leads por site ou por nome + cidade.
- Segurança: chaves sensíveis nunca chegam ao frontend; a tabela do Supabase
  fica protegida por Row Level Security e só é acessada pelo servidor via
  service role.

**Novo na V2:**
- **CRM completo em `/leads`:** tabela, cards e Kanban (arrastar-e-soltar
  entre colunas de status, com atualização otimista e rollback em caso de
  erro), seleção múltipla com ações em lote (mudar status, excluir),
  exclusão individual, exportação CSV.
- **Filtros avançados:** possui/não possui site, Instagram, WhatsApp, site
  desatualizado, além de busca, status, prioridade e ordenação.
- **Contatos clicáveis e reais:** site, Instagram (`@handle ↗`), WhatsApp
  (`wa.me`), telefone (`tel:`) e e-mail (`mailto:`) — o WhatsApp, e-mail e
  Instagram são extraídos de links reais encontrados no HTML do site do
  negócio (nunca inventados); quando não encontrados, mostram "não
  encontrado" em vez de um link fabricado.
- **Critérios de qualificação no Agente:** sem site, site desatualizado,
  Instagram ativo, negócio estabelecido — leads que não atendem, após a
  análise real, são descartados automaticamente e listados com o motivo.
- **Análise de presença digital mais profunda:** sinais de SEO básico
  (title, meta description, quantidade de H1), mobile (viewport), conversão
  (CTA, links de telefone/WhatsApp) e conteúdo (volume de texto) — sempre
  extraídos do HTML, nunca uma avaliação de design "inventada" (isso exigiria
  renderização/captura de tela, fora do escopo desta versão).
- **Score com razões visíveis:** cada ponto do score vem acompanhado do
  motivo (ex.: "Site desatualizado: +20"), exibido na página do lead.
- **CRM relacional por lead:** notas internas, campo de "próxima ação" com
  data, e histórico completo de mudanças de status com timestamp.
- **Dashboard V2:** distribuição por status, distribuição por score, leads
  de maior oportunidade e últimas pesquisas realizadas.
- **Revisão geral de UI:** hover/active/focus/loading/disabled consistentes
  em todos os botões, cards e links clicáveis; microinterações (botão copiar
  vira ✓, barra de ações em lote, toasts de confirmação).
- Design responsivo (desktop, tablet e mobile) com estados de carregamento,
  vazio e erro tratados em toda a aplicação.

## O que depende de configuração externa

| Funcionalidade | Depende de | Sem a chave |
|---|---|---|
| Persistência real dos leads | Supabase | Usa arquivo local (`.data/leads.json`), só para dev |
| Busca de negócios reais | Google Places API | Mostra "Pesquisa externa não configurada" (ou dados de demonstração com `ENABLE_DEMO_MODE=true`) |
| Análise e mensagem geradas por IA | Anthropic Claude | Usa geração heurística baseada em regras, claramente identificada na interface |
| Pesquisa web genérica (`searchWeb`) | Nenhum provedor configurado nesta versão | Reservada para uso futuro (ex.: enriquecer leads com notícias/avaliações) |

## Arquitetura do código

```
src/
  app/                    # Rotas (App Router): dashboard, /agent, /leads, /leads/[id], API routes
  agents/                 # ProspectingAgent — orquestra as ferramentas
  tools/                  # Ferramentas do agente, uma responsabilidade por arquivo
  database/               # Interface do repositório + adapters (Supabase / arquivo local)
  lib/                    # env, scoring, utils, cliente Supabase, cliente Anthropic, hooks
  components/             # Componentes de UI, layout, dashboard, agente e leads
  types/                  # Tipos compartilhados (Lead, filtros, etc.)
database/schema.sql        # Schema completo do Supabase/PostgreSQL (V1+V2)
database/migrations/       # Histórico de migrations (aplicar em projetos já existentes)
```

A arquitetura foi pensada para crescer sem reescrever o agente: novas
ferramentas (ex.: um provedor real de `searchWeb`, enriquecimento via
LinkedIn/Instagram, geração de proposta) entram em `src/tools/` com uma
interface própria e são plugadas no `ProspectingAgent` sem afetar as
existentes.

### Fora do escopo desta V2 (propositalmente)

Envio automático de mensagens (WhatsApp/e-mail), follow-ups automáticos,
múltiplos agentes especializados, geração automática de proposta/briefing,
cobrança e sistema de usuários complexo ficam para versões futuras (V3+),
conforme definido no escopo do produto. A arquitetura (ferramentas
desacopladas, histórico de status, evidências rastreáveis) já foi pensada
para suportar essas evoluções sem reescrever o que existe.
