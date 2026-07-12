import Link from "next/link";
import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { getBusiness, getService, getStaffMember } from "@/lib/public/catalog";
import { getAvailability } from "@/lib/availability";

function contactQs(name: string, phone: string, email?: string) {
  return `name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}${email ? `&email=${encodeURIComponent(email)}` : ""}`;
}

export default async function HorarioPage({
  searchParams,
}: {
  searchParams: Promise<{
    service?: string;
    staff?: string;
    date?: string;
    name?: string;
    phone?: string;
    email?: string;
  }>;
}) {
  const { service: serviceId, staff: staffParam, date: dateParam, name, phone, email } = await searchParams;
  if (!name || !phone) redirect("/");
  if (!serviceId || !staffParam) redirect("/servicios?" + contactQs(name, phone ?? "", email));

  const service = await getService(serviceId);
  if (!service) redirect("/servicios?" + contactQs(name, phone, email));

  if (staffParam !== "any") {
    const staffMember = await getStaffMember(staffParam);
    if (!staffMember) redirect(`/empleada?service=${serviceId}&${contactQs(name, phone, email)}`);
  }

  const business = await getBusiness();
  const timezone = business?.timezone ?? "America/Mazatlan";
  const today = DateTime.now().setZone(timezone);
  const selectedDate =
    dateParam && DateTime.fromISO(dateParam, { zone: timezone }).isValid
      ? DateTime.fromISO(dateParam, { zone: timezone })
      : today;

  const availability = await getAvailability(serviceId, selectedDate.toFormat("yyyy-MM-dd"));

  const slotMap = new Map<string, { staffId: string; staffName: string }>();
  if (staffParam === "any") {
    for (const entry of availability) {
      for (const slot of entry.slots) {
        if (!slotMap.has(slot)) slotMap.set(slot, { staffId: entry.staffId, staffName: entry.staffName });
      }
    }
  } else {
    const entry = availability.find((a) => a.staffId === staffParam);
    for (const slot of entry?.slots ?? []) {
      slotMap.set(slot, { staffId: staffParam, staffName: entry!.staffName });
    }
  }
  const sortedSlots = [...slotMap.entries()].sort(([a], [b]) => (a < b ? -1 : 1));

  const contact = contactQs(name, phone, email);
  const prevDate = selectedDate.minus({ days: 1 }).toFormat("yyyy-MM-dd");
  const nextDate = selectedDate.plus({ days: 1 }).toFormat("yyyy-MM-dd");
  const canGoPrev = selectedDate.startOf("day") > today.startOf("day");

  function confirmHref(iso: string, staffId: string) {
    return `/confirmacion?service=${serviceId}&staff=${staffId}&starts_at=${encodeURIComponent(iso)}&${contact}`;
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold text-neutral-900">Elige horario</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {service.name} · {service.duration_minutes} min
      </p>

      <div className="mt-4 flex items-center justify-between">
        {canGoPrev ? (
          <Link
            href={`/horario?service=${serviceId}&staff=${staffParam}&${contact}&date=${prevDate}`}
            className="text-sm text-neutral-600 underline"
          >
            ← Anterior
          </Link>
        ) : (
          <span />
        )}
        <span className="text-sm font-medium text-neutral-900">
          {selectedDate.setLocale("es").toFormat("cccc d 'de' LLLL")}
        </span>
        <Link
          href={`/horario?service=${serviceId}&staff=${staffParam}&${contact}&date=${nextDate}`}
          className="text-sm text-neutral-600 underline"
        >
          Siguiente →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        {sortedSlots.map(([iso, who]) => (
          <Link
            key={iso}
            href={confirmHref(iso, who.staffId)}
            className="rounded-md border border-neutral-200 bg-white py-2 text-center text-sm hover:border-neutral-400"
          >
            {DateTime.fromISO(iso).setZone(timezone).toFormat("HH:mm")}
          </Link>
        ))}
      </div>
      {sortedSlots.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">Sin horarios disponibles este día. Prueba otro día.</p>
      )}
    </main>
  );
}
