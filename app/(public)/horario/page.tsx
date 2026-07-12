import Link from "next/link";
import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { getBusiness, getService, getStaffMember } from "@/lib/public/catalog";
import { getAvailability } from "@/lib/availability";
import { StepHeader } from "@/components/step-header";
import { formatLongDate } from "@/lib/format";

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
    <main className="mx-auto min-h-screen w-full max-w-md px-5 py-8">
      <StepHeader
        step={3}
        title="Fecha y hora"
        subtitle={`${service.name} · ${service.duration_minutes} min`}
        backHref={`/empleada?service=${serviceId}&${contact}`}
      />

      <div className="flex items-center justify-between rounded-2xl border border-line bg-white p-2 shadow-sm shadow-brand-100/40">
        {canGoPrev ? (
          <Link
            href={`/horario?service=${serviceId}&staff=${staffParam}&${contact}&date=${prevDate}`}
            aria-label="Día anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand-600 transition hover:bg-brand-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : (
          <span className="h-9 w-9" />
        )}
        <span className="text-center text-sm font-semibold text-ink">
          {formatLongDate(selectedDate)}
        </span>
        <Link
          href={`/horario?service=${serviceId}&staff=${staffParam}&${contact}&date=${nextDate}`}
          aria-label="Día siguiente"
          className="flex h-9 w-9 items-center justify-center rounded-full text-brand-600 transition hover:bg-brand-100"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {sortedSlots.map(([iso, who]) => (
          <Link
            key={iso}
            href={confirmHref(iso, who.staffId)}
            className="rounded-xl border border-line bg-white py-2.5 text-center text-sm font-medium text-ink transition hover:border-brand-400 hover:bg-brand-50"
          >
            {DateTime.fromISO(iso).setZone(timezone).toFormat("HH:mm")}
          </Link>
        ))}
      </div>
      {sortedSlots.length === 0 && (
        <div className="mt-6 rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink-soft">
          Sin horarios disponibles este día.
          <br />
          Prueba con otro día. 🌸
        </div>
      )}
    </main>
  );
}
