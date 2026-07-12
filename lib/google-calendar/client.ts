import "server-only";
import { refreshAccessToken } from "./oauth";
import { colorIdForStaff } from "./colors";

interface BusinessGoogleConfig {
  google_refresh_token: string | null;
  google_calendar_id: string | null;
  timezone: string;
}

async function getAccessToken(business: BusinessGoogleConfig): Promise<string> {
  if (!business.google_refresh_token) throw new Error("Negocio sin Google Calendar conectado");
  return refreshAccessToken(business.google_refresh_token);
}

export async function createDedicatedCalendar(accessToken: string, name: string, timezone: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ summary: name, timeZone: timezone }),
  });
  if (!res.ok) throw new Error(`No se pudo crear el calendario: ${await res.text()}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}

export interface CalendarEventInput {
  title: string;
  startsAt: string;
  endsAt: string;
  staffId: string;
}

export async function createCalendarEvent(business: BusinessGoogleConfig, event: CalendarEventInput): Promise<string> {
  const accessToken = await getAccessToken(business);
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(business.google_calendar_id!)}/events`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: event.title,
        colorId: colorIdForStaff(event.staffId),
        start: { dateTime: event.startsAt, timeZone: business.timezone },
        end: { dateTime: event.endsAt, timeZone: business.timezone },
      }),
    }
  );
  if (!res.ok) throw new Error(`No se pudo crear el evento: ${await res.text()}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function updateCalendarEvent(
  business: BusinessGoogleConfig,
  eventId: string,
  event: CalendarEventInput
): Promise<void> {
  const accessToken = await getAccessToken(business);
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(business.google_calendar_id!)}/events/${eventId}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: event.title,
        colorId: colorIdForStaff(event.staffId),
        start: { dateTime: event.startsAt, timeZone: business.timezone },
        end: { dateTime: event.endsAt, timeZone: business.timezone },
      }),
    }
  );
  if (!res.ok) throw new Error(`No se pudo actualizar el evento: ${await res.text()}`);
}

export async function deleteCalendarEvent(business: BusinessGoogleConfig, eventId: string): Promise<void> {
  const accessToken = await getAccessToken(business);
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(business.google_calendar_id!)}/events/${eventId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  // 404/410 significa que el evento ya no existe (ej. se borró a mano) — no es un error real.
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`No se pudo borrar el evento: ${await res.text()}`);
  }
}
