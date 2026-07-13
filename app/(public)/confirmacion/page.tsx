import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { getBusiness, getService, getStaffMember } from "@/lib/public/catalog";
import { ConfirmForm } from "./confirm-form";
import { StepHeader } from "@/components/step-header";
import { formatLongDateTime } from "@/lib/format";
import { contactQueryString } from "@/lib/public/contact";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-ink-soft">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{
    service?: string;
    staff?: string;
    starts_at?: string;
    name?: string;
    phone?: string;
    email?: string;
    birthday?: string;
  }>;
}) {
  const { service: serviceId, staff: staffId, starts_at: startsAt, name, phone, email, birthday } = await searchParams;

  if (!serviceId || !staffId || !startsAt || !name || !phone) redirect("/");

  const [service, staffMember, business] = await Promise.all([getService(serviceId), getStaffMember(staffId), getBusiness()]);
  if (!service || !staffMember) redirect("/");

  const timezone = business?.timezone ?? "America/Mazatlan";
  const start = DateTime.fromISO(startsAt).setZone(timezone);

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 py-8">
      <StepHeader
        step={4}
        title="Confirma tu cita"
        backHref={`/horario?service=${serviceId}&staff=${staffId}&${contactQueryString({ name, phone, email, birthday })}&date=${start.toFormat("yyyy-MM-dd")}`}
      />

      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm shadow-brand-100">
        <div className="divide-y divide-line">
          <Row label="Servicio" value={`${service.name}${service.size ? ` · ${service.size}` : ""}`} />
          <Row label="Artista" value={staffMember.name} />
          <Row label="Cuándo" value={formatLongDateTime(start)} />
          <Row label="Duración" value={`${service.duration_minutes} min`} />
        </div>
        <div className="mt-2 flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3">
          <span className="text-sm font-medium text-ink">Total estimado</span>
          <span className="font-serif text-xl font-semibold text-brand-600">{formatPrice(service.price_cents)}</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-white p-4 text-sm text-ink-soft">
        <p>
          A nombre de <span className="font-medium text-ink">{name}</span>
        </p>
        <p>
          Teléfono <span className="font-medium text-ink">{phone}</span>
        </p>
      </div>

      <ConfirmForm serviceId={serviceId} staffId={staffId} startsAt={startsAt} name={name} phone={phone} email={email} birthday={birthday} />
    </main>
  );
}
