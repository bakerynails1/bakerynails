import "server-only";
import { DateTime } from "luxon";
import { createAdminClient } from "./supabase/admin";
import { syncAppointmentToGoogle } from "./google-calendar/sync";

const EXCLUSION_VIOLATION = "23P01";

export class AppointmentError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export interface CreateAppointmentInput {
  serviceId: string;
  staffId: string;
  startsAt: string; // ISO 8601
  customer: {
    name: string;
    phone?: string;
    email?: string;
  };
}

async function findOrCreateCustomer(
  supabase: ReturnType<typeof createAdminClient>,
  businessId: string,
  customer: CreateAppointmentInput["customer"]
) {
  if (customer.phone) {
    const { data: existing, error } = await supabase
      .from("customers")
      .select("id")
      .eq("business_id", businessId)
      .eq("phone", customer.phone)
      .maybeSingle();
    if (error) throw new AppointmentError(error.message, 500);
    if (existing) return existing.id;
  } else if (customer.email) {
    const { data: existing, error } = await supabase
      .from("customers")
      .select("id")
      .eq("business_id", businessId)
      .eq("email", customer.email)
      .maybeSingle();
    if (error) throw new AppointmentError(error.message, 500);
    if (existing) return existing.id;
  }

  const { data: created, error: insertError } = await supabase
    .from("customers")
    .insert({
      business_id: businessId,
      name: customer.name,
      phone: customer.phone ?? null,
      email: customer.email ?? null,
    })
    .select("id")
    .single();

  if (insertError) throw new AppointmentError(insertError.message, 500);
  return created.id;
}

export async function createAppointment(input: CreateAppointmentInput) {
  const supabase = createAdminClient();

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, business_id, duration_minutes, active")
    .eq("id", input.serviceId)
    .maybeSingle();
  if (serviceError) throw new AppointmentError(serviceError.message, 500);
  if (!service || !service.active) throw new AppointmentError("Servicio no encontrado", 404);

  const { data: staffMember, error: staffError } = await supabase
    .from("staff")
    .select("id, active")
    .eq("id", input.staffId)
    .eq("business_id", service.business_id)
    .maybeSingle();
  if (staffError) throw new AppointmentError(staffError.message, 500);
  if (!staffMember || !staffMember.active) throw new AppointmentError("Empleada no encontrada", 404);

  const { data: capableLink, error: capableError } = await supabase
    .from("staff_services")
    .select("staff_id")
    .eq("staff_id", input.staffId)
    .eq("service_id", input.serviceId)
    .maybeSingle();
  if (capableError) throw new AppointmentError(capableError.message, 500);
  if (!capableLink) throw new AppointmentError("Esa empleada no ofrece este servicio", 422);

  const startsAt = DateTime.fromISO(input.startsAt);
  if (!startsAt.isValid) throw new AppointmentError("starts_at inválido", 400);
  const endsAt = startsAt.plus({ minutes: service.duration_minutes });

  const customerId = await findOrCreateCustomer(supabase, service.business_id, input.customer);

  const { data: appointment, error: insertError } = await supabase
    .from("appointments")
    .insert({
      business_id: service.business_id,
      customer_id: customerId,
      service_id: service.id,
      staff_id: staffMember.id,
      starts_at: startsAt.toUTC().toISO()!,
      ends_at: endsAt.toUTC().toISO()!,
      status: "confirmed",
      google_sync_pending: true,
    })
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === EXCLUSION_VIOLATION) {
      throw new AppointmentError("Ese horario ya no está disponible, elige otro.", 409);
    }
    throw new AppointmentError(insertError.message, 500);
  }

  await syncAppointmentToGoogle(appointment.id);

  return appointment;
}

export async function cancelAppointment(appointmentId: string) {
  const supabase = createAdminClient();

  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("id, status, google_event_id")
    .eq("id", appointmentId)
    .maybeSingle();
  if (fetchError) throw new AppointmentError(fetchError.message, 500);
  if (!appointment) throw new AppointmentError("Cita no encontrada", 404);
  if (appointment.status === "cancelled") return appointment;

  const { data: updated, error: updateError } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      google_sync_pending: appointment.google_event_id ? true : false,
    })
    .eq("id", appointmentId)
    .select("*")
    .single();

  if (updateError) throw new AppointmentError(updateError.message, 500);

  await syncAppointmentToGoogle(appointmentId);

  return updated;
}
