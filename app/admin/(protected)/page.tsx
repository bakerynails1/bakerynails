import { DateTime } from "luxon";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, ButtonLink, Badge, EmptyState } from "@/components/admin/ui";

export default async function AdminHomePage() {
  const session = await requireBusinessSession();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("timezone")
    .eq("id", session.businessId)
    .maybeSingle();
  const timezone = business?.timezone ?? "America/Mazatlan";
  const today = DateTime.now().setZone(timezone);

  const [{ data: todaysAppointments }, { count: activeStaff }, { count: activeServices }, { count: pendingSync }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, starts_at, status, service:services(name), staff:staff(name), customer:customers(name, birthday)")
      .eq("business_id", session.businessId)
      .eq("status", "confirmed")
      .gte("starts_at", today.startOf("day").toUTC().toISO()!)
      .lte("starts_at", today.endOf("day").toUTC().toISO()!)
      .order("starts_at"),
    supabase
      .from("staff")
      .select("*", { count: "exact", head: true })
      .eq("business_id", session.businessId)
      .eq("active", true),
    supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("business_id", session.businessId)
      .eq("active", true),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("business_id", session.businessId)
      .eq("google_sync_pending", true),
  ]);

  const appointments = todaysAppointments ?? [];

  return (
    <div>
      <PageHeader title={`Hola${session.userEmail ? `, ${session.userEmail}` : ""}`} description={`Resumen rápido de ${session.businessName}.`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Citas de hoy" value={appointments.length} />
        <SummaryCard label="Empleadas activas" value={activeStaff ?? 0} />
        <SummaryCard label="Servicios activos" value={activeServices ?? 0} />
      </div>

      {!!pendingSync && (
        <div className="mt-4">
          <ButtonLink href="/admin/citas" variant="secondary" size="sm">
            ⚠ {pendingSync} cita{pendingSync === 1 ? "" : "s"} pendiente{pendingSync === 1 ? "" : "s"} de sincronizar con Google Calendar
          </ButtonLink>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink href="/admin/citas" variant="primary" size="sm">
          Ver agenda de hoy
        </ButtonLink>
        <ButtonLink href="/admin/empleadas" size="sm">
          + Agregar empleada
        </ButtonLink>
        <ButtonLink href="/admin/servicios" size="sm">
          + Agregar servicio
        </ButtonLink>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink">Citas de hoy</h2>
        {appointments.length === 0 ? (
          <EmptyState>No hay citas confirmadas para hoy.</EmptyState>
        ) : (
          <div className="space-y-2">
            {appointments.map((appt) => {
              const start = DateTime.fromISO(appt.starts_at).setZone(timezone);
              const service = appt.service as unknown as { name: string } | null;
              const staff = appt.staff as unknown as { name: string } | null;
              const customer = appt.customer as unknown as { name: string; birthday: string | null } | null;
              const isBirthday =
                !!customer?.birthday &&
                DateTime.fromISO(customer.birthday).month === start.month &&
                DateTime.fromISO(customer.birthday).day === start.day;
              return (
                <Card key={appt.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">
                      {start.toFormat("HH:mm")} · {service?.name}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {staff?.name} · {customer?.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="info">Confirmada</Badge>
                    {isBirthday && <Badge variant="warning">🎂 Cumpleaños</Badge>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-ink">{value}</p>
    </Card>
  );
}
