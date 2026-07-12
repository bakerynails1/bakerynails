import Link from "next/link";
import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { getAppointmentSummary, getBusiness } from "@/lib/public/catalog";
import { BrandLogo } from "@/components/brand-logo";
import { btnPrimary } from "@/components/ui";
import { formatLongDateTime } from "@/lib/format";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function ExitoPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (!id) redirect("/");

  const [appointment, business] = await Promise.all([getAppointmentSummary(id), getBusiness()]);
  if (!appointment) redirect("/");

  const timezone = business?.timezone ?? "America/Mazatlan";
  const start = DateTime.fromISO(appointment.starts_at).setZone(timezone);
  const service = appointment.service as unknown as { name: string; price_cents: number; size: string | null } | null;
  const staff = appointment.staff as unknown as { name: string } | null;
  const customer = appointment.customer as unknown as { name: string } | null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-10 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-brand-600">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <h1 className="mt-5 font-serif text-2xl font-semibold text-ink">¡Cita agendada! 🤍</h1>
      <p className="mt-1 text-ink-soft">Te esperamos, {customer?.name}.</p>

      <div className="mt-6 w-full space-y-2 rounded-3xl border border-line bg-white p-6 text-left shadow-sm shadow-brand-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-soft">Servicio</span>
          <span className="text-sm font-medium text-ink">
            {service?.name}
            {service?.size ? ` · ${service.size}` : ""}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-soft">Artista</span>
          <span className="text-sm font-medium text-ink">{staff?.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-soft">Cuándo</span>
          <span className="text-right text-sm font-medium text-ink">{formatLongDateTime(start)}</span>
        </div>
        {service && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-soft">Precio</span>
            <span className="text-sm font-medium text-brand-600">{formatPrice(service.price_cents)}</span>
          </div>
        )}
      </div>

      <Link href="/" className={`${btnPrimary} mt-8`}>
        Agendar otra cita
      </Link>

      <div className="mt-10 opacity-70">
        <BrandLogo size="sm" />
      </div>
    </main>
  );
}
