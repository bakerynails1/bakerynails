import Link from "next/link";
import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { getAppointmentSummary, getBusiness } from "@/lib/public/catalog";

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-8 text-center">
      <div className="text-4xl">✅</div>
      <h1 className="mt-4 text-xl font-semibold text-neutral-900">¡Cita confirmada!</h1>
      <p className="mt-1 text-sm text-neutral-500">Te esperamos, {customer?.name}.</p>

      <div className="mt-6 w-full space-y-2 rounded-lg border border-neutral-200 bg-white p-4 text-left text-sm">
        <p>
          <span className="text-neutral-500">Servicio:</span>{" "}
          <span className="font-medium text-neutral-900">
            {service?.name}
            {service?.size ? ` (${service.size})` : ""}
          </span>
        </p>
        <p>
          <span className="text-neutral-500">Empleada:</span> <span className="font-medium text-neutral-900">{staff?.name}</span>
        </p>
        <p>
          <span className="text-neutral-500">Cuándo:</span>{" "}
          <span className="font-medium text-neutral-900">{start.setLocale("es").toFormat("cccc d 'de' LLLL, HH:mm")}</span>
        </p>
        {service && (
          <p>
            <span className="text-neutral-500">Precio:</span>{" "}
            <span className="font-medium text-neutral-900">{formatPrice(service.price_cents)}</span>
          </p>
        )}
      </div>

      <Link href="/" className="mt-6 text-sm text-neutral-600 underline">
        Agendar otra cita
      </Link>
    </main>
  );
}
