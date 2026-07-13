-- 0003_customer_birthday.sql
-- Guarda el cumpleaños del cliente (opcional) para poder sorprenderlo con un
-- detalle si su cita cae ese día.

alter table customers add column birthday date;
