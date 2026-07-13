import Link from "next/link";
import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { getBusiness, getService, getStaffMember } from "@/lib/public/catalog";
import { getAvailability } from "@/lib/availability";
import { StepHeader } from "@/components/step-header";
import { formatLongDate } from "@/lib/format";
import { contactQueryString } from "@/lib/public/contact";
import { BookingCalendar } from "./booking-calendar";

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
    birthday?: string;
  }>;
}) {
  const { service: serviceId, staff: staffParam, date: dateParam, name, phone, email, birthday } = await searchParams;
  if (!name || !phone) redirect("/");
  const contactBase = contactQueryString({ name, phone: phone ?? "", email, birthday });
  if (!serviceId || !staffParam) redirect("/servicios?" + contactBase);

  const service = await getService(serviceId);
  if (!service) redirect("/servicios?" + contactBase);

  if (staffParam !== "any") {
    const staffMember = await getStaffMember(staffParam);
    if (!staffMember) redirect(`/empleada?service=${serviceId}&${contactBase}`);
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

  const contact = contactQueryString({ name, phone, email, birthday });

  function dateHref(isoDate: string) {
    return `/horario?service=${serviceId}&staff=${staffParam}&${contact}&date=${isoDate}`;
  }

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

      <BookingCalendar selectedDate={selectedDate} today={today} dateHref={dateHref} />

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-ink">{formatLongDate(selectedDate)}</p>
        {sortedSlots.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink-soft">
            Sin horarios disponibles este día.
            <br />
            Elige otro en el calendario. 🌸
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
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
        )}
      </div>
    </main>
  );
}
