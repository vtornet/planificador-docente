-- Docenza · panel de administración.
-- No modifica las migraciones anteriores (ya aplicadas) — añadido incremental.
--
-- Cómo aplicar (las migraciones 0001-0004 se aplicaron a mano, no están en el
-- historial de la CLI, así que `supabase db push` no sirve aquí):
--   npx supabase db query --linked --file supabase/migrations/0005_admin.sql
--
-- Qué añade:
--  1. profiles.is_admin — quién puede entrar al panel. Se marca a mano por SQL
--     (abajo, para la cuenta del propietario). No hay ninguna policy de
--     escritura sobre profiles para el cliente, así que un usuario normal no
--     puede ponerse is_admin a sí mismo — solo el service_role (Edge Function
--     admin-api) o SQL directo.
--  2. profiles.manual_premium (+ nota / metadatos) — "premium concedido a mano"
--     por un admin, independiente de Stripe. El webhook de Stripe nunca toca
--     esta columna, así que un evento de suscripción no puede pisar un premium
--     manual, ni al revés.
--  3. has_paid pasa a ser (suscripción activa) OR manual_premium.
--  4. admin_audit_log — registro de cada acción del panel (dar/quitar premium,
--     cancelar suscripción, borrar cuenta). Sin FK a auth.users a propósito:
--     el registro debe sobrevivir al borrado del usuario al que se refiere.

-- ============== 1. is_admin ==============
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ============== 2. premium manual ==============
alter table public.profiles
  add column if not exists manual_premium boolean not null default false,
  add column if not exists manual_premium_note text,
  add column if not exists manual_premium_at timestamptz,
  add column if not exists manual_premium_by text; -- email del admin que lo concedió

-- ============== 3. has_paid = suscripción activa OR premium manual ==============
-- (Igual que en 0002, hay que recrear la columna generada — no se puede
-- alterar la expresión de una columna GENERATED in situ.)
alter table public.profiles drop column if exists has_paid;
alter table public.profiles
  add column has_paid boolean generated always as (
    coalesce(subscription_status in ('active', 'trialing'), false) or manual_premium
  ) stored;

-- ============== 4. registro de auditoría ==============
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,                 -- admin que ejecutó la acción (sin FK: debe sobrevivir borrados)
  actor_email text,
  action text not null,          -- 'grant_manual_premium' | 'revoke_manual_premium' | 'cancel_subscription' | 'delete_user'
  target_user_id uuid,
  target_email text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_user_id);

alter table public.admin_audit_log enable row level security;
-- Sin policies: solo la Edge Function admin-api (service_role) la escribe/lee.

-- ============== 5. marcar el/los admin(s) ==============
-- Ajusta el email si el propietario cambia o hay más de un admin.
update public.profiles set is_admin = true where email = 'vtornet@gmail.com';
