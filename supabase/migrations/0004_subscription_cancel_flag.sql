-- Docenza · añade el flag de cancelación programada de Stripe.
--
-- Al cancelar desde el Portal de Facturación, Stripe NO cambia
-- subscription_status de inmediato (sigue "active" hasta que el periodo ya
-- pagado termina de verdad) — solo marca cancel_at_period_end=true en el
-- objeto Subscription. Sin guardar ese flag, "Mi Suscripción" no podría
-- distinguir "se renueva sola" de "termina el DD/MM y no se renovará".

alter table public.profiles
  add column if not exists cancel_at_period_end boolean not null default false;
