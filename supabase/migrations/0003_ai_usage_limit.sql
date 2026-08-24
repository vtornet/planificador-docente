-- Docenza · límite diario de mensajes al asistente de IA (Fase 9, V2).
-- No modifica 0001_init.sql/0002_subscription.sql (ya aplicadas) — esto es
-- un añadido incremental.
--
-- El cupo gratuito de Groq es compartido entre todas las cuentas de
-- Docenza — sin un tope por cuenta, una sola docente podría agotarlo para
-- el resto. Se aplica en el servidor (esta tabla + función), no solo en el
-- cliente, por el mismo motivo que enforce_trial_limits: un guard
-- client-side es solo UX, nunca la aplicación real.

create table if not exists public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  count int not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage_daily enable row level security;
-- Sin policies: esta tabla solo la toca la Edge Function ai-assistant, con
-- la service_role key (que salta RLS) — nunca se lee/escribe desde el
-- cliente directamente.

-- Upsert atómico en una sola sentencia (INSERT ... ON CONFLICT ... DO
-- UPDATE ... RETURNING) para que dos peticiones concurrentes de la misma
-- cuenta no puedan leer el mismo "count" antes de incrementarlo y saltarse
-- el límite (evita el race condition de un patrón "leer, comprobar,
-- escribir" en dos pasos separados).
create or replace function public.increment_ai_usage(p_user_id uuid, p_limite int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.ai_usage_daily (user_id, day, count)
  values (p_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day)
  do update set count = public.ai_usage_daily.count + 1
  returning count into v_count;

  return v_count <= p_limite;
end;
$$;
