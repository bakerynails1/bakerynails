import Link from "next/link";
import { DateTime } from "luxon";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { markAppointmentStatus, retryGoogleSync } from "./actions";
import { formatLongDate } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No se presentó",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  cancelled: "bg-neutral-200 text-neutral-600",
  completed: "bg-green-100 text-green-700",
  no_show: "bg-amber-100 text-amber-700",
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

  const { date: dateParam, staff: staffParam } = await searchParams;
  const selectedDate = dateParam && DateTime.fromISO(dateParam, { zone: timezone }).isValid
    ? DateTime.fromISO(dateParam, { zone: timezone })
    : DateTime.now().setZone(timezone);

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
      "id, starts_at, ends_at, status, google_sync_pending, service:services(name, price_cents), staff:staff(name), customer:customers(name, phone)"
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
  const staffQuery = staffParam ? `&staff=${staffParam}` : "";

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Citas</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={`/admin/citas?date=${prevDate}${staffQuery}`} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm">
          ← Anterior
        </Link>
        <span className="text-sm font-medium text-neutral-900">{formatLongDate(selectedDate)}</span>
        <Link href={`/admin/citas?date=${nextDate}${staffQuery}`} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm">
          Siguiente →
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/admin/citas?date=${selectedDate.toFormat("yyyy-MM-dd")}`}
          className={`rounded-md px-3 py-1 text-sm ${!staffParam ? "bg-brand-500 text-white" : "bg-white border border-neutral-200 text-neutral-700"}`}
        >
          Todas
        </Link>
        {(staffList ?? []).map((s) => (
          <Link
            key={s.id}
            href={`/admin/citas?date=${selectedDate.toFormat("yyyy-MM-dd")}&staff=${s.id}`}
            className={`rounded-md px-3 py-1 text-sm ${staffParam === s.id ? "bg-brand-500 text-white" : "bg-white border border-neutral-200 text-neutral-700"}`}
          >
            {s.name}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {(appointments ?? []).map((appt) => {
          const start = DateTime.fromISO(appt.starts_at).setZone(timezone);
          const end = DateTime.fromISO(appt.ends_at).setZone(timezone);
          const service = appt.service as unknown as { name: string; price_cents: number } | null;
          const staff = appt.staff as unknown as { name: string } | null;
          const customer = appt.customer as unknown as { name: string; phone: string | null } | null;

          return (
            <div key={appt.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-neutral-900">
                    {start.toFormat("HH:mm")} – {end.toFormat("HH:mm")} · {service?.name}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {staff?.name} · {customer?.name} {customer?.phone ? `(${customer.phone})` : ""}
                  </p>
                  {service && <p className="text-sm text-neutral-500">{formatPrice(service.price_cents)}</p>}
                </div>
                <span className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[appt.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                  {STATUS_LABELS[appt.status] ?? appt.status}
                </span>
              </div>

              {appt.google_sync_pending && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                    Pendiente de sincronizar con Google Calendar
                  </span>
                  <form action={retryGoogleSync}>
                    <input type="hidden" name="id" value={appt.id} />
                    <button type="submit" className="text-xs text-neutral-500 underline">
                      Reintentar
                    </button>
                  </form>
                </div>
              )}

              {appt.status === "confirmed" && (
                <div className="mt-3 flex gap-2">
                  <form action={markAppointmentStatus}>
                    <input type="hidden" name="id" value={appt.id} />
                    <input type="hidden" name="status" value="completed" />
                    <button type="submit" className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700">
                      Marcar completada
                    </button>
                  </form>
                  <form action={markAppointmentStatus}>
                    <input type="hidden" name="id" value={appt.id} />
                    <input type="hidden" name="status" value="no_show" />
                    <button type="submit" className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                      No se presentó
                    </button>
                  </form>
                  <form action={markAppointmentStatus}>
                    <input type="hidden" name="id" value={appt.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <button type="submit" className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                      Cancelar
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
        {(appointments ?? []).length === 0 && <p className="text-sm text-neutral-500">Sin citas este día.</p>}
      </div>
    </div>
  );
}
