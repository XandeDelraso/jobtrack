# JobTrack

**Seu centro de controle para candidaturas de emprego.**

JobTrack é uma plataforma pessoal para organizar e acompanhar candidaturas a
vagas de emprego: um Kanban visual por status de processo seletivo, detecção
de duplicidade, busca e filtros, dashboard com métricas, estatísticas,
histórico automático de cada candidatura, follow-ups/lembretes, exportação em
CSV e autenticação com isolamento total de dados por usuário.

## Stack técnica

- **Frontend**: React 18 + TypeScript + Vite
- **Estilo**: Tailwind CSS + Radix UI (primitivas acessíveis, padrão shadcn/ui)
- **Estado de servidor**: TanStack Query (cache, mutações otimistas, invalidação)
- **Estado de UI**: Zustand (tema, filtros, modais/drawers)
- **Formulários**: React Hook Form + Zod
- **Drag and drop**: dnd-kit
- **Gráficos**: Recharts
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Testes**: Vitest + Testing Library

## Funcionalidades

- Autenticação completa (cadastro, login, logout, recuperação de senha, sessão persistente)
- Kanban com 5 colunas (Currículo enviado, Entrevista marcada, Sem retorno, Retorno positivo, Retorno negativo) com drag and drop
- Cadastro completo de candidaturas (empresa, vaga, cargo, salário, contratação, modelo de trabalho, localização, link, recrutador, entrevista, observações, follow-up, favorito, prioridade)
- **Detecção de duplicidade** por similaridade (empresa + vaga), tolerante a maiúsculas/minúsculas, espaços e pequenas variações de digitação
- Busca e filtros (status, modelo de trabalho, contratação, prioridade, favoritas, período)
- Dashboard com indicadores (total, por status, favoritas, entrevistas próximas, follow-ups vencidos)
- Estatísticas (candidaturas por período, taxas de entrevista/resposta/retorno positivo, distribuição por modelo de trabalho e contratação, salário médio esperado)
- Histórico automático por candidatura (criação, mudança de status, agendamento de entrevista, follow-up, favorito)
- Exportação de candidaturas em CSV
- Perfil e configurações (nome, senha, tema, sair da conta)
- Dark mode, responsividade completa (desktop → mobile) e estados de carregamento/erro/vazio em toda a aplicação
- **Segurança por padrão**: isolamento de dados entre usuários garantido no banco via Row Level Security, não apenas no frontend

## Estrutura do projeto

```
src/
  components/
    ui/            # Primitivas de UI (Button, Dialog, Sheet, Select, ...)
    layout/         # AppShell, Sidebar, Topbar, ProtectedRoute
    kanban/         # Board, coluna e card com drag and drop
    applications/   # Formulário, drawer de detalhes, duplicidade, filtros, histórico
    dashboard/      # Cartões de estatística e alertas de follow-up
    stats/          # Gráficos da página de estatísticas
  hooks/            # useAuth, useApplications, useProfile, useDebounce
  lib/              # supabase client, validação (zod), duplicidade, csv, stats, mappers
  store/            # Zustand: tema, filtros, estado de UI (modais/drawers)
  pages/            # Rotas (auth/, Dashboard, Stats, Profile, NotFound)
  types/            # Tipos do banco de dados (Database, Row/Insert/Update)
supabase/
  migrations/       # Schema SQL (tabelas, RLS, triggers, funções)
```

## Configurando o Supabase

O projeto usa Supabase (PostgreSQL + Auth) como backend. É necessário criar um
projeto Supabase e aplicar a migração incluída — isso exige uma conta
Supabase, então esta etapa precisa ser feita manualmente:

1. Crie uma conta e um novo projeto em [supabase.com](https://supabase.com/dashboard).
2. No painel do projeto, vá em **SQL Editor** → **New query**, cole todo o
   conteúdo de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   e execute. Isso cria as tabelas (`profiles`, `applications`,
   `application_history`), habilita Row Level Security com policies que
   restringem cada usuário aos próprios dados, os triggers de histórico
   automático e a função de busca de candidaturas similares.
   - Alternativamente, com a [Supabase CLI](https://supabase.com/docs/guides/cli)
     instalada e logada: `supabase link --project-ref SEU_PROJETO` e depois
     `supabase db push`.
3. Em **Authentication → URL Configuration**, defina a **Site URL** e adicione
   `http://localhost:5173/reset-password` (e a URL de produção equivalente)
   em **Redirect URLs**, para que o link de recuperação de senha funcione.
4. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
5. Copie `.env.example` para `.env.local` e preencha os dois valores:

   ```bash
   cp .env.example .env.local
   ```

   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
   ```

Por padrão, o Supabase exige confirmação de e-mail para novas contas. Isso
pode ser desativado em **Authentication → Providers → Email** durante o
desenvolvimento, se preferir testar sem configurar envio de e-mail.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Scripts

| Comando           | Descrição                                  |
| ------------------ | ------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento (Vite)          |
| `npm run build`     | Typecheck + build de produção               |
| `npm run preview`   | Preview do build de produção                |
| `npm run lint`      | ESLint                                      |
| `npm test`          | Testes unitários (Vitest)                   |
| `npm run test:watch`| Testes em modo watch                        |

## Decisões de arquitetura

- **Prevenção de duplicidade** roda inteiramente no cliente, comparando a
  nova candidatura com as já carregadas via coeficiente de similaridade
  Dice sobre bigramas (após normalizar acentos/caixa/espaços) — ver
  `src/lib/duplicate.ts`. Não bloqueia a criação; apenas avisa e deixa o
  usuário decidir. A mesma normalização e uma busca por similaridade
  (`pg_trgm`) também existem no banco (`find_similar_applications`), prontas
  para uso caso o volume de candidaturas cresça a ponto de não ser mais
  prático carregar tudo no cliente.
- **Histórico automático**: um trigger no Postgres (`log_application_history`)
  registra criação, mudança de status, agendamento/remoção de entrevista,
  follow-up e favorito — não depende do frontend "lembrar" de registrar cada
  evento, o que também impede que o histórico seja adulterado por requisições
  feitas fora da UI.
- **Segurança**: toda a proteção de acesso entre usuários é feita via Row
  Level Security no Postgres (`auth.uid() = user_id` em todas as tabelas),
  não apenas em filtros client-side — um usuário autenticado não consegue ler,
  editar ou excluir dados de outro mesmo manipulando requisições diretamente.
- **Estado**: dados de servidor (candidaturas, histórico, perfil) vivem no
  cache do TanStack Query; estado de UI (tema, filtros ativos, modal/drawer
  aberto) vive em stores Zustand pequenas e focadas, sem misturar as duas
  responsabilidades.

## Limitações conhecidas

- A criação do projeto Supabase e execução da migração inicial não pôde ser
  automatizada nesta sessão — requer uma conta e credenciais que só o usuário
  possui (ver "Configurando o Supabase" acima). Todo o restante (schema,
  RLS, triggers, frontend completo) está pronto para uso assim que essas
  credenciais forem configuradas em `.env.local`.
- Sem acesso a Docker neste ambiente, não foi possível rodar o Supabase
  localmente (`supabase start`) para testes de integração ponta a ponta
  contra um banco real; a aplicação foi validada com testes unitários da
  lógica de negócio (duplicidade, CSV, estatísticas, validação, filtros) e
  verificação manual da interface (build, lint, navegação, formulários).
- `react-router-dom` está pinado em 6.x; a versão 7 corrige um CVE de open
  redirect que não é explorável aqui (a aplicação não constrói redirects a
  partir de entrada do usuário), mas fica registrado como possível upgrade
  futuro.
