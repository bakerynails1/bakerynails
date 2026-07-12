-- 0002_appointments_no_overlap.sql
-- Evita a nivel de base de datos que una misma empleada tenga dos citas
-- confirmadas que se traslapen, incluso bajo condiciones de carrera
-- (dos reservas llegando casi al mismo tiempo). Esto es lo único que
-- garantiza consistencia real; una validación previa desde la API por sí
-- sola no alcanza contra requests concurrentes.

create extension if not exists "btree_gist";

alter table appointments
  add constraint appointments_no_overlap
  exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at) with &&
  )
  where (status = 'confirmed');
