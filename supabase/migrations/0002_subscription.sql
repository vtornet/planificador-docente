-- Docenza · pasa el modelo de pago de único a suscripción anual.
-- No modifica 0001_init.sql (ya aplicada) — esto es un ALTER incremental.
--
-- Con pago único, has_paid era un interruptor que solo pasaba a true una
-- vez. Con suscripción recurrente hace falta reflejar también cuando deja de
-- estar activa (cancelación, impago) — el webhook de Stripe (stripe-webhook)
-- escribirá subscription_status en cada evento del ciclo de vida
-- (checkout.session.completed, customer.subscription.updated/deleted), y
-- has_paid se deriva de ese estado en vez de ponerse a mano.

alter table public.profiles
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text
    check (subscription_status is null or subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid')),
  add column if not exists subscription_current_period_end timestamptz;

-- has_paid pasa a ser una columna generada: siempre coherente con
-- subscription_status, no hay dos sitios que puedan desincronizarse. El
-- coalesce evita que dé NULL (en vez de false) cuando aún no hay
-- subscription_status — mantiene el mismo "siempre boolean" que tenía antes.
alter table public.profiles drop column if exists has_paid;
alter table public.profiles
  add column has_paid boolean generated always as (
    coalesce(subscription_status in ('active', 'trialing'), false)
  ) stored;
