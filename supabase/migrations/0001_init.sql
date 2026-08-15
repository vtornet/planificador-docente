-- Docenza · esquema inicial para cuentas de usuario, sincronización y pago único.
-- Ver el punto 8 "Crear BBDD" de CLAUDE.md para el contexto de esta migración.
--
-- Cómo aplicar: pégalo en el editor SQL del panel de Supabase (Database > SQL
-- Editor) de un proyecto nuevo, o `supabase db push` si usas la CLI. No
-- requiere extensiones adicionales (auth.users ya existe, gestionado por
-- Supabase Auth).

-- ============== PROFILES ==============
-- Un perfil por usuario, con el estado de pago. Solo el webhook de Stripe
-- (con la service_role key, que salta RLS) puede poner has_paid a true — no
-- hay ninguna política de escritura para el cliente sobre esa columna.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  has_paid boolean not null default false,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "select own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Crea el perfil automáticamente al registrarse, para que enforce_trial_limits
-- (más abajo) siempre encuentre una fila que consultar, incluso si el primer
-- guardado de un cuaderno llega antes de cualquier otra inicialización.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============== CUADERNOS ==============
-- Mismo id que genera generateId() en el cliente (string, no uuid) para que
-- un cuaderno local y su copia remota compartan identidad sin traducción —
-- ver src/stores/useCuadernoStore.ts. `data` es el CuadernoDocente completo
-- serializado igual que el backup JSON (fechas como ISO string, ver
-- src/utils/export.ts::prepareCuadernoForExport).
create table public.cuadernos (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  metadata jsonb not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index cuadernos_user_id_idx on public.cuadernos(user_id);

alter table public.cuadernos enable row level security;

create policy "select own cuadernos"
  on public.cuadernos for select
  using (auth.uid() = user_id);

create policy "insert own cuadernos"
  on public.cuadernos for insert
  with check (auth.uid() = user_id);

create policy "update own cuadernos"
  on public.cuadernos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own cuadernos"
  on public.cuadernos for delete
  using (auth.uid() = user_id);

-- Mantiene updated_at correcto en cada upsert, independientemente de lo que
-- mande el cliente (evita depender de que el cliente calcule bien la hora).
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_cuadernos_touch_updated_at
  before update on public.cuadernos
  for each row execute function public.touch_updated_at();

-- ============== LÍMITE DE PRUEBA (aplicado en servidor) ==============
-- Cada uno de los 5 módulos tiene su propio tope independiente de 1 mientras
-- has_paid sea false. Compara solo la LONGITUD de cada array: nunca bloquea
-- una edición o un borrado (que no la aumentan), solo un alta que la supere
-- — correcto y suficiente para lo que se pide. El tope está duplicado en
-- TypeScript como TRIAL_LIMIT_PER_MODULE (src/constants/trial.ts); si cambia
-- aquí, cambiar también allí.
create or replace function public.enforce_trial_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  paid boolean;
  caps text[] := array['horarios', 'reuniones', 'notas', 'eventos'];
  mod text;
  trial_limit constant int := 1;
begin
  select has_paid into paid from public.profiles where id = new.user_id;
  if coalesce(paid, false) then
    return new;
  end if;

  foreach mod in array caps loop
    if jsonb_array_length(coalesce(new.data->mod, '[]'::jsonb)) > trial_limit then
      raise exception 'trial_limit_exceeded: % capped at % item(s) during trial', mod, trial_limit
        using errcode = 'P0001';
    end if;
  end loop;

  -- planificacion.semanal está un nivel más anidado que el resto.
  if jsonb_array_length(coalesce(new.data #> '{planificacion,semanal}', '[]'::jsonb)) > trial_limit then
    raise exception 'trial_limit_exceeded: semanas capped at % item(s) during trial', trial_limit
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger trg_enforce_trial_limits
  before insert or update on public.cuadernos
  for each row execute function public.enforce_trial_limits();
