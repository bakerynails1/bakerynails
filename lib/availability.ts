import "server-only";
import { DateTime } from "luxon";
import { createAdminClient } from "./supabase/admin";

const SLOT_GRANULARITY_MINUTES = 15;

export interface StaffAvailability {
  staffId: string;
  staffName: string;
  slots: string[]; // horas de inicio disponibles, ISO 8601 en UTC
}

export class AvailabilityError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

// El campo `weekday` del esquema usa 0=domingo..6=sábado.
// Luxon usa 1=lunes..7=domingo (ISO).
function toSchemaWeekday(luxonWeekday: number): number {
  return luxonWeekday === 7 ? 0 : luxonWeekday;
}

interface WorkingRange {
  start: DateTime;
  end: DateTime;
}

interface AppointmentRange {
  start: DateTime;
  end: DateTime;
}

function rangesOverlap(a: WorkingRange | AppointmentRange, bStart: DateTime, bEnd: DateTime): boolean {
  return a.start < bEnd && a.end > bStart;
}

function buildSlotsForRange(
  range: WorkingRange,
  durationMinutes: number,
  existingAppointments: AppointmentRange[],
  now: DateTime
): string[] {
  const slots: string[] = [];
  let candidateStart = range.start;

  while (true) {
    const candidateEnd = candidateStart.plus({ minutes: durationMinutes });
    if (candidateEnd > range.end) break;

    const isPast = candidateStart < now;
    const overlapsAppointment = existingAppointments.some((appt) =>
      rangesOverlap(appt, candidateStart, candidateEnd)
    );

    if (!isPast && !overlapsAppointment) {
      slots.push(candidateStart.toUTC().toISO()!);
    }

    candidateStart = candidateStart.plus({ minutes: SLOT_GRANULARITY_MINUTES });
  }

  return slots;
}

export async function getAvailability(serviceId: string, date: string): Promise<StaffAvailability[]> {
  const supabase = createAdminClient();

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, business_id, duration_minutes, active")
    .eq("id", serviceId)
    .maybeSingle();

  if (serviceError) throw new AvailabilityError(serviceError.message, 500);
  if (!service || !service.active) throw new AvailabilityError("Servicio no encontrado", 404);

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("timezone")
    .eq("id", service.business_id)
    .maybeSingle();

  if (businessError) throw new AvailabilityError(businessError.message, 500);
  if (!business) throw new AvailabilityError("Negocio no encontrado", 404);

  const timezone = business.timezone;
  const targetDate = DateTime.fromISO(date, { zone: timezone });
  if (!targetDate.isValid) throw new AvailabilityError("Fecha inválida", 400);

  const dayStart = targetDate.startOf("day");
  const dayEnd = targetDate.endOf("day");
  const schemaWeekday = toSchemaWeekday(targetDate.weekday);
  const now = DateTime.now().setZone(timezone);

  const { data: capableLinks, error: capableError } = await supabase
    .from("staff_services")
    .select("staff_id")
    .eq("service_id", serviceId);

  if (capableError) throw new AvailabilityError(capableError.message, 500);
  const staffIds = (capableLinks ?? []).map((row) => row.staff_id);
  if (staffIds.length === 0) return [];

  const { data: staffRows, error: staffError } = await supabase
    .from("staff")
    .select("id, name")
    .in("id", staffIds)
    .eq("business_id", service.business_id)
    .eq("active", true);

  if (staffError) throw new AvailabilityError(staffError.message, 500);
  if (!staffRows || staffRows.length === 0) return [];

  const activeStaffIds = staffRows.map((s) => s.id);

  const [{ data: schedules, error: schedulesError }, { data: exceptions, error: exceptionsError }, { data: appointments, error: appointmentsError }] =
    await Promise.all([
      supabase
        .from("staff_schedules")
        .select("staff_id, start_time, end_time")
        .in("staff_id", activeStaffIds)
        .eq("weekday", schemaWeekday),
      supabase
        .from("staff_schedule_exceptions")
        .select("staff_id, is_day_off, start_time, end_time")
        .in("staff_id", activeStaffIds)
        .eq("date", date),
      supabase
        .from("appointments")
        .select("staff_id, starts_at, ends_at")
        .in("staff_id", activeStaffIds)
        .eq("status", "confirmed")
        .gte("starts_at", dayStart.toUTC().toISO()!)
        .lte("starts_at", dayEnd.toUTC().toISO()!),
    ]);

  if (schedulesError) throw new AvailabilityError(schedulesError.message, 500);
  if (exceptionsError) throw new AvailabilityError(exceptionsError.message, 500);
  if (appointmentsError) throw new AvailabilityError(appointmentsError.message, 500);

  function timeToDateTime(time: string): DateTime {
    const [hour, minute, second] = time.split(":").map(Number);
    return dayStart.set({ hour, minute, second: second ?? 0, millisecond: 0 });
  }

  const result: StaffAvailability[] = [];

  for (const staffMember of staffRows) {
    const exception = (exceptions ?? []).find((e) => e.staff_id === staffMember.id);

    let workingRanges: WorkingRange[];
    if (exception) {
      if (exception.is_day_off || !exception.start_time || !exception.end_time) {
        workingRanges = [];
      } else {
        workingRanges = [{ start: timeToDateTime(exception.start_time), end: timeToDateTime(exception.end_time) }];
      }
    } else {
      workingRanges = (schedules ?? [])
        .filter((s) => s.staff_id === staffMember.id)
        .map((s) => ({ start: timeToDateTime(s.start_time), end: timeToDateTime(s.end_time) }));
    }

    if (workingRanges.length === 0) continue;

    const staffAppointments: AppointmentRange[] = (appointments ?? [])
      .filter((a) => a.staff_id === staffMember.id)
      .map((a) => ({ start: DateTime.fromISO(a.starts_at), end: DateTime.fromISO(a.ends_at) }));

    const slots = workingRanges.flatMap((range) =>
      buildSlotsForRange(range, service.duration_minutes, staffAppointments, now)
    );

    if (slots.length > 0) {
      result.push({ staffId: staffMember.id, staffName: staffMember.name, slots });
    }
  }

  return result;
}
