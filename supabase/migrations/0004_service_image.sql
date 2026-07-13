-- 0004_service_image.sql
-- Guarda la URL pública de la foto del servicio (almacenada en Supabase
-- Storage, bucket "service-images"). Opcional; los servicios sin foto
-- muestran un ícono de marca en su lugar.

alter table services add column image_url text;
