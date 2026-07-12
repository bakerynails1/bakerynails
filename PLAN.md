# Plan de desarrollo — Sistema de citas (Bakery Nails)

Este plan traduce la propuesta de arquitectura ya acordada en tareas concretas para construir el sistema con **Claude Code**. Está pensado para irse ejecutando fase por fase: le pegas cada fase (o cada tarea) a Claude Code dentro de la carpeta del proyecto, revisas el resultado, haces commit, y pasas a la siguiente.

**Stack decidido:** Next.js (React) en Cloudflare Pages para el frontend · Supabase (Postgres + Auth + Storage) para base de datos, login y permisos · Google Calendar API v3 para sincronizar citas.

---

## 0. Antes de empezar — cuentas y credenciales

Necesitas tener listo esto antes de la Fase 1:

- [x] Cuenta de Cloudflare (gratis) — para Pages.
- [x] Proyecto de Supabase creado (gratis) — copiar `Project URL` y `anon key`.
- [ ] Proyecto en Google Cloud Console con la **Google Calendar API** habilitada. (proyecto creado)
- [ ] Credenciales OAuth 2.0 (Client ID + Client Secret) en Google Cloud, con URI de redirección apuntando a tu dominio. (pendiente — se necesita antes de la Fase 3)
- [ ] Dominio (opcional para el MVP, se puede probar con el subdominio gratis de Cloudflare Pages primero).
- [x] Repositorio en GitHub/GitLab vacío para el proyecto. (https://github.com/bakerynails1/bakerynails.git)

---

## 1. Estructura del proyecto

```
salon-citas/
├── app/                      # rutas de Next.js (App Router)
│   ├── (public)/             # sitio de reservas del cliente
│   │   ├── page.tsx          # paso 1: datos de contacto
│   │   ├── servicios/        # paso 2-3: categoría y servicio
│   │   ├── empleada/         # paso 4: elegir empleada
│   │   ├── horario/          # paso 5: elegir horario
│   │   └── confirmacion/     # paso 6: confirmación
│   ├── admin/                # panel administrador (CRM), detrás de login
│   │   ├── empleadas/
│   │   ├── servicios/
│   │   ├── asignaciones/
│   │   ├── horarios/
│   │   ├── citas/
│   │   └── reportes/
│   └── api/                  # API routes / server actions
│       ├── appointments/
│       ├── availability/
│       └── google-calendar/
├── lib/
│   ├── supabase/              # cliente de Supabase (browser + server)
│   └── google-calendar/       # wrapper de la API de Google Calendar
├── supabase/
│   └── migrations/            # SQL de la base de datos (ver Fase 2)
└── PLAN.md                    # este archivo
```

---

## 2. Fase 1 — Base de datos (Supabase)

Tarea para Claude Code: crear la migración inicial en `supabase/migrations/0001_init.sql` con este esquema (ya validado en la propuesta de arquitectura):

```sql
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  timezone text not null default 'America/Mazatlan',
  google_calendar_id text,
  google_refresh_token text,
  created_at timestamptz not null default now()
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
  created_at timestamptz not null default now()
);
```

Tareas adicionales de esta fase:

- [ ] Activar Row Level Security en todas las tablas y escribir políticas: un usuario autenticado del panel admin solo puede leer/escribir filas de su propio `business_id`.
- [ ] Insertar un `business` semilla ("Bakery Nails") y precargar `service_categories` + `services` con el catálogo del Anexo A de la propuesta (Manos, Pies, Uñas por tamaño, Extras).
- [ ] Generar los tipos de TypeScript desde el esquema de Supabase (`supabase gen types typescript`).

---

## 3. Fase 2 — Lógica de disponibilidad (backend)

- [x] Endpoint `GET /api/availability?service_id=&date=` que devuelva, para el servicio elegido, la lista de empleadas capacitadas (`staff_services`) y sus huecos libres ese día, cruzando `staff_schedules`, `staff_schedule_exceptions` y `appointments` ya guardadas (no se usa Google Calendar aquí — ver sección 8.3 de la propuesta de arquitectura).
- [x] Endpoint `POST /api/appointments` que valide que el huequito sigue libre (evitar condición de carrera de doble reserva — resuelto con un exclusion constraint en Postgres, migración 0002) e inserte la cita. La creación del evento en Google Calendar queda para la Fase 3: por ahora la cita se marca `google_sync_pending = true`.
- [x] Endpoint `POST /api/appointments/:id/cancel` que cancela la cita (libera el horario automáticamente vía el constraint). Borrar/actualizar el evento de Google Calendar queda para la Fase 3.

---

## 4. Fase 3 — Integración con Google Calendar

- [ ] Flujo OAuth: pantalla en el panel admin "Conectar Google Calendar" que redirige a Google, y al volver guarda `google_refresh_token` y `google_calendar_id` en la tabla `businesses`.
- [ ] Función `createCalendarEvent(appointment)` que arme el título `"{servicio} — atiende: {empleada} — Cliente: {cliente}"`, use un `colorId` fijo por empleada (mapear cada `staff.id` a un color de Google Calendar), y cree el evento en el calendario del negocio.
- [ ] Función `updateCalendarEvent` / `deleteCalendarEvent` para cuando una cita se reagenda o cancela.
- [ ] Manejo de errores: si falla la llamada a Google (token expirado, cuota, etc.), la cita se guarda igual en la base de datos y se marca `google_sync_pending` para reintentar — nunca debe perderse una reserva por un fallo de Google Calendar.

---

## 5. Fase 4 — Sitio de reservas (cliente)

- [ ] Paso 1: formulario de nombre/teléfono/correo → crea o reutiliza `customer`.
- [ ] Paso 2-3: selección de categoría → servicio, mostrando precio y (si aplica) tamaño S/M/L/XL.
- [ ] Paso 4: lista de empleadas capacitadas para ese servicio (o "cualquiera disponible").
- [ ] Paso 5: calendario/selector de horario usando `/api/availability`.
- [ ] Paso 6: confirmación, llamada a `/api/appointments`, pantalla de éxito.
- [ ] Responsivo para celular (la mayoría de las reservas probablemente entren desde el teléfono).

---

## 6. Fase 5 — Panel de administrador (CRM)

- [ ] Login (Supabase Auth) para el dueño/recepción.
- [ ] `/admin/empleadas`: alta, edición, baja/desactivación de empleadas.
- [ ] `/admin/servicios`: alta/edición/baja de categorías y servicios (nombre, precio, duración, tamaño si aplica).
- [ ] `/admin/asignaciones`: matriz empleada × servicio (checkboxes) que escribe en `staff_services`.
- [ ] `/admin/horarios`: horario semanal por empleada + excepciones puntuales.
- [ ] `/admin/citas`: agenda del día/semana, filtrable por empleada, con acción de marcar completada/cancelada/no-show.
- [ ] `/admin/reportes`: ingresos por servicio, por empleada, por periodo; conteo de citas por servicio.

---

## 7. Fase 6 — Deploy

- [ ] Conectar el repo a Cloudflare Pages (build de Next.js con `@cloudflare/next-on-pages` o adaptador equivalente vigente).
- [ ] Variables de entorno en Cloudflare Pages: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo en funciones server-side), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
- [ ] Dominio propio conectado (opcional para el MVP).
- [ ] Prueba end-to-end: reservar una cita de prueba y confirmar que aparece en Google Calendar con el color correcto.

---

## 8. Fase 7 — Pulido (post-MVP)

- [ ] Confirmaciones por correo/WhatsApp al reservar.
- [ ] Recordatorios automáticos (ej. 24h antes).
- [ ] Reportes más detallados y comparativos por periodo.

---

## 9. Preparado para multi-negocio (cuando decidas ofrecerlo a otros salones)

- [ ] Pantalla de registro de nuevo negocio (crea fila en `businesses`, categorías/servicios vacíos para capturar).
- [ ] Ruteo por slug/subdominio (`tuapp.com/{business_slug}`).
- [ ] Cada negocio conecta su propio Google Calendar en el onboarding.
- [ ] (Cuando quieras cobrar) integrar Stripe por negocio.

---

## Cómo trabajar esto con Claude Code

1. Crea la carpeta del proyecto y corre `claude` dentro de ella.
2. Pégale la Fase 1 completa como instrucción inicial (incluye el SQL de arriba) y pide que inicialice el repo, el proyecto de Next.js y la migración de Supabase.
3. Revisa el resultado, corre la migración contra tu proyecto de Supabase, haz commit.
4. Repite con la Fase 2, 3, 4... en orden — cada fase depende de que la anterior ya esté funcionando.
5. Pide a Claude Code que después de cada fase te deje una lista corta de qué probar manualmente antes de seguir.
