-- 0001_init.sql
-- Esquema inicial del sistema de citas (Bakery Nails)

create extension if not exists "pgcrypto";

-- ============================================================
-- Tablas
-- ============================================================

create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  timezone text not null default 'America/Mazatlan',
  google_calendar_id text,
  google_refresh_token text,
  created_at timestamptz not null default now()
);

-- vincula usuarios de Supabase Auth con un negocio, para el panel admin
create table business_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table service_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,          -- ej. Manos, Pies, Uñas, Extras
  sort_order int not null default 0
);

create table services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid not null references service_categories(id) on delete cascade,
  name text not null,
  price_cents int not null,
  duration_minutes int not null,
  size text,                    -- null, o 'S'/'M'/'L'/'XL' para servicios de Uñas
  active boolean not null default true
);

create table staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  phone text,
  google_calendar_id text,      -- solo si más adelante se usa calendario por empleada
  active boolean not null default true
);

create table staff_services (
  staff_id uuid not null references staff(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  primary key (staff_id, service_id)
);

create table staff_schedules (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0=domingo
  start_time time not null,
  end_time time not null
);

create table staff_schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  date date not null,
  is_day_off boolean not null default true,
  start_time time,              -- si es medio día en vez de libre completo
  end_time time
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid not null references customers(id),
  service_id uuid not null references services(id),
  staff_id uuid not null references staff(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed', -- confirmed | cancelled | completed | no_show
  google_event_id text,
  google_sync_pending boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Índices de soporte para las consultas de disponibilidad/reportes
-- ============================================================

create index idx_service_categories_business on service_categories(business_id);
create index idx_services_business on services(business_id);
create index idx_services_category on services(category_id);
create index idx_staff_business on staff(business_id);
create index idx_staff_schedules_staff on staff_schedules(staff_id, weekday);
create index idx_staff_schedule_exceptions_staff_date on staff_schedule_exceptions(staff_id, date);
create index idx_customers_business on customers(business_id);
create index idx_appointments_business on appointments(business_id);
create index idx_appointments_staff_starts on appointments(staff_id, starts_at);
create index idx_appointments_starts on appointments(starts_at);

-- ============================================================
-- Row Level Security
--
-- El sitio público de reservas y las rutas /api/* usan la
-- service role key desde el servidor (Fase 2), por lo que no
-- necesitan políticas propias: la service role ignora RLS.
-- Estas políticas protegen el acceso desde el panel admin,
-- donde el usuario está autenticado con Supabase Auth y usa
-- la anon key + sesión.
-- ============================================================

create or replace function is_business_member(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from business_users
    where business_id = target_business_id
      and user_id = auth.uid()
  );
$$;

alter table businesses enable row level security;
alter table business_users enable row level security;
alter table service_categories enable row level security;
alter table services enable row level security;
alter table staff enable row level security;
alter table staff_services enable row level security;
alter table staff_schedules enable row level security;
alter table staff_schedule_exceptions enable row level security;
alter table customers enable row level security;
alter table appointments enable row level security;

create policy "businesses_select_own" on businesses for select
  using (is_business_member(id));
create policy "businesses_update_own" on businesses for update
  using (is_business_member(id));

create policy "business_users_select_own" on business_users for select
  using (is_business_member(business_id));

create policy "service_categories_all_own" on service_categories for all
  using (is_business_member(business_id))
  with check (is_business_member(business_id));

create policy "services_all_own" on services for all
  using (is_business_member(business_id))
  with check (is_business_member(business_id));

create policy "staff_all_own" on staff for all
  using (is_business_member(business_id))
  with check (is_business_member(business_id));

create policy "customers_all_own" on customers for all
  using (is_business_member(business_id))
  with check (is_business_member(business_id));

create policy "appointments_all_own" on appointments for all
  using (is_business_member(business_id))
  with check (is_business_member(business_id));

-- staff_services / staff_schedules / staff_schedule_exceptions no tienen
-- business_id directo: se valida a través de la empleada (staff).
create policy "staff_services_all_own" on staff_services for all
  using (exists (
    select 1 from staff s where s.id = staff_id and is_business_member(s.business_id)
  ))
  with check (exists (
    select 1 from staff s where s.id = staff_id and is_business_member(s.business_id)
  ));

create policy "staff_schedules_all_own" on staff_schedules for all
  using (exists (
    select 1 from staff s where s.id = staff_id and is_business_member(s.business_id)
  ))
  with check (exists (
    select 1 from staff s where s.id = staff_id and is_business_member(s.business_id)
  ));

create policy "staff_schedule_exceptions_all_own" on staff_schedule_exceptions for all
  using (exists (
    select 1 from staff s where s.id = staff_id and is_business_member(s.business_id)
  ))
  with check (exists (
    select 1 from staff s where s.id = staff_id and is_business_member(s.business_id)
  ));

-- ============================================================
-- Seed: negocio "Bakery Nails" + categorías base
--
-- El catálogo de servicios (Anexo A: nombres, precios, duración,
-- tamaños S/M/L/XL) no se incluyó en la propuesta que tengo a la
-- mano, así que aquí solo se crean el negocio y las categorías.
-- Los servicios se cargan después, ya sea a mano en Supabase o
-- desde /admin/servicios una vez construido el panel (Fase 5).
-- ============================================================

insert into businesses (name, slug, timezone)
values ('Bakery Nails', 'bakery-nails', 'America/Mazatlan');

insert into service_categories (business_id, name, sort_order)
select id, name, sort_order
from businesses, (values
  ('Manos', 1),
  ('Pies', 2),
  ('Uñas', 3),
  ('Extras', 4)
) as c(name, sort_order)
where businesses.slug = 'bakery-nails';
