-- JobTrack — schema inicial
-- Tabelas: profiles, applications, application_history
-- Todo o isolamento entre usuários é garantido via Row Level Security (RLS),
-- não confiando em nenhuma verificação feita apenas no frontend.

create extension if not exists pg_trgm;

-- ============================================================================
-- ENUMS
-- ============================================================================

create type public.application_status as enum (
  'applied',
  'interview',
  'no_response',
  'positive',
  'negative'
);

create type public.employment_type as enum (
  'clt',
  'pj',
  'internship',
  'freelance',
  'other'
);

create type public.work_model as enum (
  'remote',
  'hybrid',
  'onsite'
);

create type public.priority_level as enum (
  'low',
  'medium',
  'high'
);

-- ============================================================================
-- PROFILES
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  theme_preference text not null default 'system' check (theme_preference in ('system', 'light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Cria automaticamente um profile quando um novo usuário se cadastra.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- APPLICATIONS
-- ============================================================================

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Informações básicas
  company_name text not null,
  job_title text not null,
  role_area text,
  status public.application_status not null default 'applied',
  applied_date date not null default current_date,
  expected_salary_min numeric(12, 2),
  expected_salary_max numeric(12, 2),
  salary_currency text not null default 'BRL',

  -- Informações da oportunidade
  employment_type public.employment_type,
  work_model public.work_model,
  location text,
  job_url text,
  job_description text,

  -- Informações do processo seletivo
  recruiter_name text,
  recruiter_email text,
  recruiter_phone text,
  interview_date timestamptz,
  interview_notes text,
  general_notes text,

  -- Organização pessoal
  is_favorite boolean not null default false,
  priority public.priority_level not null default 'medium',
  follow_up_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Normalização usada para detectar duplicidade (minúsculo, sem espaços extras)
  company_name_normalized text generated always as (
    lower(regexp_replace(trim(company_name), '\s+', ' ', 'g'))
  ) stored,
  job_title_normalized text generated always as (
    lower(regexp_replace(trim(job_title), '\s+', ' ', 'g'))
  ) stored,

  constraint applications_salary_range_check check (
    expected_salary_min is null
    or expected_salary_max is null
    or expected_salary_min <= expected_salary_max
  )
);

alter table public.applications enable row level security;

create policy "applications_select_own"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "applications_insert_own"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "applications_update_own"
  on public.applications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "applications_delete_own"
  on public.applications for delete
  using (auth.uid() = user_id);

create index applications_user_id_idx on public.applications (user_id);
create index applications_user_status_idx on public.applications (user_id, status);
create index applications_user_favorite_idx on public.applications (user_id, is_favorite);
create index applications_company_trgm_idx on public.applications using gin (company_name_normalized gin_trgm_ops);
create index applications_job_title_trgm_idx on public.applications using gin (job_title_normalized gin_trgm_ops);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- APPLICATION HISTORY
-- ============================================================================

create table public.application_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.application_history enable row level security;

create policy "application_history_select_own"
  on public.application_history for select
  using (auth.uid() = user_id);

create policy "application_history_insert_own"
  on public.application_history for insert
  with check (auth.uid() = user_id);

-- Sem policies de update/delete: histórico é imutável (apenas leitura após criado).

create index application_history_application_id_idx on public.application_history (application_id, created_at desc);

-- Registra automaticamente eventos relevantes no histórico da candidatura.
create function public.log_application_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  status_labels jsonb := '{
    "applied": "Currículo enviado",
    "interview": "Entrevista marcada",
    "no_response": "Sem retorno",
    "positive": "Retorno positivo",
    "negative": "Retorno negativo"
  }'::jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.application_history (application_id, user_id, event_type, description, metadata)
    values (
      new.id,
      new.user_id,
      'created',
      'Candidatura criada para ' || new.job_title || ' em ' || new.company_name,
      jsonb_build_object('status', new.status)
    );
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into public.application_history (application_id, user_id, event_type, description, metadata)
      values (
        new.id,
        new.user_id,
        'status_changed',
        'Status alterado: ' || (status_labels ->> old.status::text) || ' → ' || (status_labels ->> new.status::text),
        jsonb_build_object('from', old.status, 'to', new.status)
      );
    end if;

    if new.interview_date is distinct from old.interview_date then
      if new.interview_date is not null then
        insert into public.application_history (application_id, user_id, event_type, description, metadata)
        values (
          new.id,
          new.user_id,
          'interview_scheduled',
          'Entrevista agendada para ' || to_char(new.interview_date, 'DD/MM/YYYY "às" HH24:MI'),
          jsonb_build_object('interview_date', new.interview_date)
        );
      else
        insert into public.application_history (application_id, user_id, event_type, description, metadata)
        values (new.id, new.user_id, 'interview_removed', 'Data de entrevista removida', '{}'::jsonb);
      end if;
    end if;

    if new.follow_up_date is distinct from old.follow_up_date and new.follow_up_date is not null then
      insert into public.application_history (application_id, user_id, event_type, description, metadata)
      values (
        new.id,
        new.user_id,
        'follow_up_set',
        'Follow-up marcado para ' || to_char(new.follow_up_date, 'DD/MM/YYYY'),
        jsonb_build_object('follow_up_date', new.follow_up_date)
      );
    end if;

    if new.is_favorite is distinct from old.is_favorite then
      insert into public.application_history (application_id, user_id, event_type, description, metadata)
      values (
        new.id,
        new.user_id,
        'favorite_toggled',
        case when new.is_favorite then 'Marcada como favorita' else 'Removida dos favoritos' end,
        '{}'::jsonb
      );
    end if;

    return new;
  end if;

  return null;
end;
$$;

create trigger applications_log_history
  after insert or update on public.applications
  for each row execute function public.log_application_history();

-- ============================================================================
-- BUSCA DE CANDIDATURAS SIMILARES (prevenção de duplicidade)
-- ============================================================================

-- SECURITY INVOKER (padrão): respeita RLS de "applications" automaticamente,
-- retornando apenas candidaturas do próprio usuário autenticado.
create function public.find_similar_applications(
  p_company text,
  p_job_title text,
  p_exclude_id uuid default null
)
returns table (
  id uuid,
  company_name text,
  job_title text,
  status public.application_status,
  applied_date date,
  similarity_score real
)
language sql
stable
as $$
  select
    a.id,
    a.company_name,
    a.job_title,
    a.status,
    a.applied_date,
    greatest(
      similarity(a.company_name_normalized, lower(regexp_replace(trim(p_company), '\s+', ' ', 'g'))),
      0
    ) * 0.6
    + greatest(
      similarity(a.job_title_normalized, lower(regexp_replace(trim(p_job_title), '\s+', ' ', 'g'))),
      0
    ) * 0.4 as similarity_score
  from public.applications a
  where (p_exclude_id is null or a.id <> p_exclude_id)
    and (
      a.company_name_normalized = lower(regexp_replace(trim(p_company), '\s+', ' ', 'g'))
      or a.company_name_normalized % lower(regexp_replace(trim(p_company), '\s+', ' ', 'g'))
    )
  order by similarity_score desc
  limit 5;
$$;
