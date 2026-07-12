import { DateTime } from "luxon";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, SectionCard, ButtonLink, Button, Card, Input } from "@/components/admin/ui";

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

  const byServiceSorted = [...byService.entries()].sort((a, b) => b[1].revenueCents - a[1].revenueCents);
  const byStaffSorted = [...byStaff.entries()].sort((a, b) => b[1].revenueCents - a[1].revenueCents);

  const presets = [
    { label: "Hoy", from: now.startOf("day"), to: now.endOf("day") },
    { label: "Esta semana", from: now.startOf("week"), to: now.endOf("week") },
    { label: "Este mes", from: now.startOf("month"), to: now.endOf("month") },
    { label: "Mes pasado", from: now.minus({ months: 1 }).startOf("month"), to: now.minus({ months: 1 }).endOf("month") },
  ];
  const fmt = (d: DateTime) => d.toFormat("yyyy-MM-dd");
  const isActivePreset = (p: (typeof presets)[number]) => fmt(p.from) === fmt(from) && fmt(p.to) === fmt(to);

  return (
    <div>
      <PageHeader title="Reportes" description="Ingresos y desempeño por periodo." />

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <ButtonLink
            key={p.label}
            href={`/admin/reportes?from=${fmt(p.from)}&to=${fmt(p.to)}`}
            variant={isActivePreset(p) ? "primary" : "secondary"}
            size="sm"
          >
            {p.label}
          </ButtonLink>
        ))}
      </div>

      <form method="get" className="mt-3 flex flex-wrap items-end gap-3">
        <Input type="date" name="from" defaultValue={from.toFormat("yyyy-MM-dd")} className="w-40" />
        <span className="pb-1.5 text-xs text-ink-soft">a</span>
        <Input type="date" name="to" defaultValue={to.toFormat("yyyy-MM-dd")} className="w-40" />
        <Button type="submit" variant="primary" size="sm">
          Filtrar
        </Button>
      </form>

      <Card className="mt-6">
        <p className="text-sm text-ink-soft">Ingresos totales ({rows.length} citas completadas)</p>
        <p className="mt-1 font-serif text-3xl font-semibold text-brand-600">{formatPrice(totalRevenueCents)}</p>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <SectionCard title="Por servicio">
          <ReportTable rows={byServiceSorted} firstColumn="Servicio" />
        </SectionCard>

        <SectionCard title="Por empleada">
          <ReportTable rows={byStaffSorted} firstColumn="Empleada" />
        </SectionCard>
      </div>
    </div>
  );
}

function ReportTable({ rows, firstColumn }: { rows: [string, { count: number; revenueCents: number }][]; firstColumn: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-brand-50/30 text-left text-xs text-ink-soft">
            <th className="p-2 font-medium">{firstColumn}</th>
            <th className="p-2 text-right font-medium">Citas</th>
            <th className="p-2 text-right font-medium">Ingresos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, data]) => (
            <tr key={name} className="border-b border-line last:border-0">
              <td className="p-2 text-ink">{name}</td>
              <td className="p-2 text-right text-ink-soft">{data.count}</td>
              <td className="p-2 text-right font-medium text-ink">{formatPrice(data.revenueCents)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-ink-soft">
                Sin datos en este periodo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
