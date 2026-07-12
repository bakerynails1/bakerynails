import { DateTime } from "luxon";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireBusinessSession();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("timezone")
    .eq("id", session.businessId)
    .maybeSingle();
  const timezone = business?.timezone ?? "America/Mazatlan";
  const now = DateTime.now().setZone(timezone);

  const { from: fromParam, to: toParam } = await searchParams;
  const from = fromParam && DateTime.fromISO(fromParam, { zone: timezone }).isValid
    ? DateTime.fromISO(fromParam, { zone: timezone })
    : now.startOf("month");
  const to = toParam && DateTime.fromISO(toParam, { zone: timezone }).isValid
    ? DateTime.fromISO(toParam, { zone: timezone })
    : now.endOf("month");

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, status, service:services(name, price_cents), staff:staff(name)")
    .eq("business_id", session.businessId)
    .eq("status", "completed")
    .gte("starts_at", from.startOf("day").toUTC().toISO()!)
    .lte("starts_at", to.endOf("day").toUTC().toISO()!);

  type Row = { service: { name: string; price_cents: number } | null; staff: { name: string } | null };
  const rows = (appointments ?? []) as unknown as Row[];

  const byService = new Map<string, { count: number; revenueCents: number }>();
  const byStaff = new Map<string, { count: number; revenueCents: number }>();
  let totalRevenueCents = 0;

  for (const row of rows) {
    const serviceName = row.service?.name ?? "—";
    const staffName = row.staff?.name ?? "—";
    const priceCents = row.service?.price_cents ?? 0;

    const service = byService.get(serviceName) ?? { count: 0, revenueCents: 0 };
    service.count += 1;
    service.revenueCents += priceCents;
    byService.set(serviceName, service);

    const staff = byStaff.get(staffName) ?? { count: 0, revenueCents: 0 };
    staff.count += 1;
    staff.revenueCents += priceCents;
    byStaff.set(staffName, staff);

    totalRevenueCents += priceCents;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Reportes</h1>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs text-neutral-500">Desde</label>
          <input
            type="date"
            name="from"
            defaultValue={from.toFormat("yyyy-MM-dd")}
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Hasta</label>
          <input
            type="date"
            name="to"
            defaultValue={to.toFormat("yyyy-MM-dd")}
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
        <button type="submit" className="rounded-md bg-brand-500 px-3 py-1.5 text-sm text-white">
          Filtrar
        </button>
      </form>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-sm text-neutral-500">Ingresos totales ({rows.length} citas completadas)</p>
        <p className="mt-1 text-2xl font-semibold text-neutral-900">{formatPrice(totalRevenueCents)}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">Por servicio</h2>
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="p-2 text-left font-medium text-neutral-700">Servicio</th>
                  <th className="p-2 text-right font-medium text-neutral-700">Citas</th>
                  <th className="p-2 text-right font-medium text-neutral-700">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {[...byService.entries()].map(([name, data]) => (
                  <tr key={name} className="border-b border-neutral-50">
                    <td className="p-2">{name}</td>
                    <td className="p-2 text-right">{data.count}</td>
                    <td className="p-2 text-right">{formatPrice(data.revenueCents)}</td>
                  </tr>
                ))}
                {byService.size === 0 && (
                  <tr>
                    <td colSpan={3} className="p-2 text-center text-neutral-500">
                      Sin datos en este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">Por empleada</h2>
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="p-2 text-left font-medium text-neutral-700">Empleada</th>
                  <th className="p-2 text-right font-medium text-neutral-700">Citas</th>
                  <th className="p-2 text-right font-medium text-neutral-700">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {[...byStaff.entries()].map(([name, data]) => (
                  <tr key={name} className="border-b border-neutral-50">
                    <td className="p-2">{name}</td>
                    <td className="p-2 text-right">{data.count}</td>
                    <td className="p-2 text-right">{formatPrice(data.revenueCents)}</td>
                  </tr>
                ))}
                {byStaff.size === 0 && (
                  <tr>
                    <td colSpan={3} className="p-2 text-center text-neutral-500">
                      Sin datos en este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
