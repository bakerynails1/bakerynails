import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCalendarEvent, deleteCalendarEvent } from "./client";

interface SyncAppointmentRow {
  id: string;
  business_id: string;
  status: string;
  google_event_id: string | null;
  starts_at: string;
  ends_at: string;
  service: { name: string } | null;
  staff: { id: string; name: string } | null;
  customer: { name: string } | null;
}

// Sincroniza una cita con Google Calendar según su estado actual.
// Nunca lanza: si el negocio no ha conectado Google, o si la llamada a
// Google falla (token expirado, cuota, etc.), simplemente no hace nada y
// deja google_sync_pending en true para reintentar después — la cita en
// la base de datos nunca se pierde por un fallo de Google.
export async function syncAppointmentToGoogle(appointmentId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      "id, business_id, status, google_event_id, starts_at, ends_at, service:services(name), staff:staff(id, name), customer:customers(name)"
    )
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appointment) return;
  const appt = appointment as unknown as SyncAppointmentRow;

  const { data: business } = await supabase
    .from("businesses")
    .select("google_refresh_token, google_calendar_id, timezone")
    .eq("id", appt.business_id)
    .maybeSingle();
  if (!business?.google_refresh_token || !business.google_calendar_id) return; // negocio no conectado, nada que hacer

  try {
    if (appt.status === "cancelled") {
      if (appt.google_event_id) {
        await deleteCalendarEvent(business, appt.google_event_id);
      }
      await supabase
        .from("appointments")
        .update({ google_sync_pending: false, google_event_id: null })
        .eq("id", appointmentId);
      return;
    }

    if (appt.status === "confirmed" && !appt.google_event_id) {
      const title = `${appt.service?.name ?? "Servicio"} — atiende: ${appt.staff?.name ?? ""} — Cliente: ${appt.customer?.name ?? ""}`;
      const eventId = await createCalendarEvent(business, {
        title,
        startsAt: appt.starts_at,
        endsAt: appt.ends_at,
        staffId: appt.staff?.id ?? "",
      });
      await supabase.from("appointments").update({ google_event_id: eventId, google_sync_pending: false }).eq("id", appointmentId);
    }
  } catch (error) {
    console.error(`google-calendar sync failed for appointment ${appointmentId}`, error);
  }
}
