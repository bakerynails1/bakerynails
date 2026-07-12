import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { getBusiness, getService, getStaffMember } from "@/lib/public/catalog";
import { ConfirmForm } from "./confirm-form";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
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
  }>;
}) {
  const { service: serviceId, staff: staffId, starts_at: startsAt, name, phone, email } = await searchParams;

  if (!serviceId || !staffId || !startsAt || !name || !phone) redirect("/");

  const [service, staffMember, business] = await Promise.all([getService(serviceId), getStaffMember(staffId), getBusiness()]);
  if (!service || !staffMember) redirect("/");

  const timezone = business?.timezone ?? "America/Mazatlan";
  const start = DateTime.fromISO(startsAt).setZone(timezone);

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold text-neutral-900">Confirma tu cita</h1>

      <div className="mt-4 space-y-2 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
        <p>
          <span className="text-neutral-500">Servicio:</span>{" "}
          <span className="font-medium text-neutral-900">
            {service.name}
            {service.size ? ` (${service.size})` : ""}
          </span>
        </p>
        <p>
          <span className="text-neutral-500">Empleada:</span>{" "}
          <span className="font-medium text-neutral-900">{staffMember.name}</span>
        </p>
        <p>
          <span className="text-neutral-500">Cuándo:</span>{" "}
          <span className="font-medium text-neutral-900">{start.setLocale("es").toFormat("cccc d 'de' LLLL, HH:mm")}</span>
        </p>
        <p>
          <span className="text-neutral-500">Precio:</span>{" "}
          <span className="font-medium text-neutral-900">{formatPrice(service.price_cents)}</span>
        </p>
        <p>
          <span className="text-neutral-500">Duración:</span>{" "}
          <span className="font-medium text-neutral-900">{service.duration_minutes} min</span>
        </p>
        <hr className="my-2 border-neutral-100" />
        <p>
          <span className="text-neutral-500">Nombre:</span> <span className="font-medium text-neutral-900">{name}</span>
        </p>
        <p>
          <span className="text-neutral-500">Teléfono:</span> <span className="font-medium text-neutral-900">{phone}</span>
        </p>
      </div>

      <ConfirmForm serviceId={serviceId} staffId={staffId} startsAt={startsAt} name={name} phone={phone} email={email} />
    </main>
  );
}
