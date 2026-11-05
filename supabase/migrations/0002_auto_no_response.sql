-- JobTrack — mover automaticamente para "Sem retorno"
--
-- Candidaturas em "Currículo enviado" ou "Entrevista marcada" que passam
-- 40 dias sem mudança de status são movidas automaticamente para
-- "Sem retorno" por um job diário (pg_cron). Essas candidaturas ficam
-- sinalizadas com `auto_moved_at` até que o usuário mova o card manualmente.
--
-- Exceções (não são movidas):
--   * entrevista com data no futuro;
--   * follow-up marcado para hoje ou para o futuro.

-- ============================================================================
-- COLUNAS
-- ============================================================================

alter table public.applications
  add column status_changed_at timestamptz,
  add column auto_moved_at timestamptz;

comment on column public.applications.status_changed_at is
  'Momento da última mudança de status (manual ou automática).';
comment on column public.applications.auto_moved_at is
  'Preenchido quando o status foi alterado automaticamente para no_response; limpo na próxima mudança manual de status.';

-- Backfill: última mudança de status registrada no histórico, ou a criação.
-- O trigger de updated_at é desligado para não "tocar" todas as linhas.
alter table public.applications disable trigger applications_set_updated_at;

update public.applications a
set status_changed_at = coalesce(
  (
    select max(h.created_at)
    from public.application_history h
    where h.application_id = a.id
      and h.event_type = 'status_changed'
  ),
  a.created_at
);

alter table public.applications enable trigger applications_set_updated_at;

alter table public.applications
  alter column status_changed_at set default now(),
  alter column status_changed_at set not null;

create index applications_stale_status_idx
  on public.applications (status_changed_at)
  where status in ('applied', 'interview');

-- ============================================================================
-- TRIGGER: controla status_changed_at / auto_moved_at
-- ============================================================================
-- Essas colunas são gerenciadas só pelo banco. Atualizações vindas do app
-- nunca conseguem definir a flag; apenas o job (que liga a configuração
-- local de transação `jobtrack.auto_move`) pode.

create function public.track_application_status_change()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('jobtrack.auto_move', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status_changed_at := now();
    new.auto_moved_at := null;
    return new;
  end if;

  if new.status is distinct from old.status then
    -- Movimento manual: reinicia a contagem e remove a flag automática.
    new.status_changed_at := now();
    new.auto_moved_at := null;
  else
    new.status_changed_at := old.status_changed_at;
    new.auto_moved_at := old.auto_moved_at;
  end if;

  return new;
end;
$$;

create trigger applications_track_status_change
  before insert or update on public.applications
  for each row execute function public.track_application_status_change();

-- ============================================================================
-- HISTÓRICO: evento próprio para a movimentação automática
-- ============================================================================

create or replace function public.log_application_history()
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
  auto_days text;
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
      if new.auto_moved_at is not null and new.auto_moved_at is distinct from old.auto_moved_at then
        auto_days := coalesce(nullif(current_setting('jobtrack.auto_move_days', true), ''), '40');
        insert into public.application_history (application_id, user_id, event_type, description, metadata)
        values (
          new.id,
          new.user_id,
          'status_auto_changed',
          'Movida automaticamente: ' || (status_labels ->> old.status::text) || ' → '
            || (status_labels ->> new.status::text) || ' após ' || auto_days || ' dias sem movimentação',
          jsonb_build_object('from', old.status, 'to', new.status, 'days', auto_days::int)
        );
      else
        insert into public.application_history (application_id, user_id, event_type, description, metadata)
        values (
          new.id,
          new.user_id,
          'status_changed',
          'Status alterado: ' || (status_labels ->> old.status::text) || ' → ' || (status_labels ->> new.status::text),
          jsonb_build_object('from', old.status, 'to', new.status)
        );
      end if;
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

-- ============================================================================
-- JOB: move candidaturas paradas
-- ============================================================================

create function public.auto_move_stale_applications(p_days integer default 40)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  moved integer;
begin
  perform set_config('jobtrack.auto_move', 'on', true);
  perform set_config('jobtrack.auto_move_days', p_days::text, true);

  update public.applications
  set status = 'no_response',
      auto_moved_at = now(),
      status_changed_at = now()
  where status in ('applied', 'interview')
    and status_changed_at < now() - make_interval(days => p_days)
    and (interview_date is null or interview_date < now())
    and (follow_up_date is null or follow_up_date < current_date);

  get diagnostics moved = row_count;

  perform set_config('jobtrack.auto_move', 'off', true);
  return moved;
end;
$$;

-- Roda para todos os usuários (security definer): não expor via API.
revoke execute on function public.auto_move_stale_applications(integer) from public, anon, authenticated;

-- ============================================================================
-- AGENDAMENTO (pg_cron) — todo dia às 06:00 UTC (03:00 em Brasília)
-- ============================================================================

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'jobtrack-auto-no-response',
  '0 6 * * *',
  $$select public.auto_move_stale_applications(40)$$
);
