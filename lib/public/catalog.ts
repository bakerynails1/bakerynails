import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Lecturas públicas del catálogo (sitio de reservas). Usan la service role
// porque no hay sesión de usuario en este flujo; RLS solo autoriza al panel
// admin. Nunca se exponen mutaciones con este cliente fuera de /api/*.

export async function getBusiness() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("businesses").select("id, name, timezone").eq("slug", "bakery-nails").maybeSingle();
  return data;
}

export async function getCategoriesWithServices(businessId: string) {
  const supabase = createAdminClient();
  const [{ data: categories }, { data: services }] = await Promise.all([
    supabase.from("service_categories").select("id, name, sort_order").eq("business_id", businessId).order("sort_order"),
    supabase
      .from("services")
      .select("id, category_id, name, price_cents, duration_minutes, size, image_url")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("name"),
  ]);

  return (categories ?? []).map((category) => ({
    ...category,
    services: (services ?? []).filter((s) => s.category_id === category.id),
  }));
}

export async function getService(serviceId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("services")
    .select("id, business_id, category_id, name, price_cents, duration_minutes, size, active")
    .eq("id", serviceId)
    .maybeSingle();
  if (!data || !data.active) return null;
  return data;
}

export async function getCapableStaff(serviceId: string) {
  const supabase = createAdminClient();
  const { data: links } = await supabase.from("staff_services").select("staff_id").eq("service_id", serviceId);
  const staffIds = (links ?? []).map((l) => l.staff_id);
  if (staffIds.length === 0) return [];

  const { data: staff } = await supabase
    .from("staff")
    .select("id, name")
    .in("id", staffIds)
    .eq("active", true)
    .order("name");

  return staff ?? [];
}

export async function getStaffMember(staffId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("staff").select("id, name, active").eq("id", staffId).maybeSingle();
  if (!data || !data.active) return null;
  return data;
}

export async function getAppointmentSummary(appointmentId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, service:services(name, price_cents, size), staff:staff(name), customer:customers(name)"
    )
    .eq("id", appointmentId)
    .maybeSingle();
  return data;
}
