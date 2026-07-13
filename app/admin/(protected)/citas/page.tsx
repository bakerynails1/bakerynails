import { DateTime } from "luxon";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { markAppointmentStatus, retryGoogleSync } from "./actions";
import { formatLongDate } from "@/lib/format";
import { PageHeader, ButtonLink, Button, Badge, Card, EmptyState } from "@/components/admin/ui";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No se presentó",
};

const STATUS_BADGE: Record<string, "info" | "neutral" | "success" | "warning"> = {
  confirmed: "info",
  cancelled: "neutral",
  completed: "success",
  no_show: "warning",
};

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function CitasPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; staff?: string }>;
}) {
  const session = await requireBusinessSession();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("timezone")
    .eq("id", session.businessId)
    .maybeSingle();
  const timezone = business?.timezone ?? "America/Mazatlan";
  const today = DateTime.now().setZone(timezone);

  const { date: dateParam, staff: staffParam } = await searchParams;
  const selectedDate = dateParam && DateTime.fromISO(dateParam, { zone: timezone }).isValid
    ? DateTime.fromISO(dateParam, { zone: timezone })
    : today;
  const isToday = selectedDate.hasSame(today, "day");

  const dayStart = selectedDate.startOf("day");
  const dayEnd = selectedDate.endOf("day");

  const { data: staffList } = await supabase
    .from("staff")
    .select("id, name")
    .eq("business_id", session.businessId)
    .order("name");

  let query = supabase
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, google_sync_pending, service:services(name, price_cents), staff:staff(name), customer:customers(name, phone, birthday)"
    )
    .eq("business_id", session.businessId)
    .gte("starts_at", dayStart.toUTC().toISO()!)
    .lte("starts_at", dayEnd.toUTC().toISO()!)
    .order("starts_at");

  if (staffParam) {
    query = query.eq("staff_id", staffParam);
  }

  const { data: appointments } = await query;

  const prevDate = selectedDate.minus({ days: 1 }).toFormat("yyyy-MM-dd");
  const nextDate = selectedDate.plus({ days: 1 }).toFormat("yyyy-MM-dd");
  const todayDate = today.toFormat("yyyy-MM-dd");
  const staffQuery = staffParam ? `&staff=${staffParam}` : "";

  return (
    <div>
      <PageHeader title="Citas" />

      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink href={`/admin/citas?date=${prevDate}${staffQuery}`}>← Anterior</ButtonLink>
        <span className="text-sm font-medium text-ink">{formatLongDate(selectedDate)}</span>
        <ButtonLink href={`/admin/citas?date=${nextDate}${staffQuery}`}>Siguiente →</ButtonLink>
        {!isToday && (
          <ButtonLink href={`/admin/citas?date=${todayDate}${staffQuery}`} variant="primary" size="sm">
            Hoy
          </ButtonLink>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <ButtonLink href={`/admin/citas?date=${selectedDate.toFormat("yyyy-MM-dd")}`} variant={!staffParam ? "primary" : "secondary"} size="sm">
          Todas
        </ButtonLink>
        {(staffList ?? []).map((s) => (
          <ButtonLink
            key={s.id}
            href={`/admin/citas?date=${selectedDate.toFormat("yyyy-MM-dd")}&staff=${s.id}`}
            variant={staffParam === s.id ? "primary" : "secondary"}
            size="sm"
          >
            {s.name}
          </ButtonLink>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {(appointments ?? []).map((appt) => {
          const start = DateTime.fromISO(appt.starts_at).setZone(timezone);
          const end = DateTime.fromISO(appt.ends_at).setZone(timezone);
          const service = appt.service as unknown as { name: string; price_cents: number } | null;
          const staff = appt.staff as unknown as { name: string } | null;
          const customer = appt.customer as unknown as { name: string; phone: string | null; birthday: string | null } | null;
          const isBirthday =
            !!customer?.birthday &&
            DateTime.fromISO(customer.birthday).month === start.month &&
            DateTime.fromISO(customer.birthday).day === start.day;

          return (
            <Card key={appt.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-ink">
                    {start.toFormat("HH:mm")} – {end.toFormat("HH:mm")} · {service?.name}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {staff?.name} · {customer?.name} {customer?.phone ? `(${customer.phone})` : ""}
                  </p>
                  {service && <p className="text-sm text-ink-soft">{formatPrice(service.price_cents)}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={STATUS_BADGE[appt.status] ?? "neutral"}>{STATUS_LABELS[appt.status] ?? appt.status}</Badge>
                  {isBirthday && <Badge variant="warning">🎂 Cumpleaños</Badge>}
                </div>
              </div>

              {appt.google_sync_pending && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="warning">Pendiente de sincronizar con Google Calendar</Badge>
                  <form action={retryGoogleSync}>
                    <input type="hidden" name="id" value={appt.id} />
                    <Button type="submit" size="sm">
                      Reintentar
                    </Button>
                  </form>
                </div>
              )}

              {appt.status === "confirmed" && (
                <div className="mt-3 flex gap-2">
                  <form action={markAppointmentStatus}>
                    <input type="hidden" name="id" value={appt.id} />
                    <input type="hidden" name="status" value="completed" />
                    <Button type="submit" size="sm" variant="primary">
                      Marcar completada
                    </Button>
                  </form>
                  <form action={markAppointmentStatus}>
                    <input type="hidden" name="id" value={appt.id} />
                    <input type="hidden" name="status" value="no_show" />
                    <Button type="submit" size="sm">
                      No se presentó
                    </Button>
                  </form>
                  <form action={markAppointmentStatus}>
                    <input type="hidden" name="id" value={appt.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <Button type="submit" size="sm" variant="danger">
                      Cancelar
                    </Button>
                  </form>
                </div>
              )}
            </Card>
          );
        })}
        {(appointments ?? []).length === 0 && <EmptyState>Sin citas este día.</EmptyState>}
      </div>
    </div>
  );
}
