import Link from "next/link";
import { DateTime } from "luxon";
import { capitalizeFirst } from "@/lib/format";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

interface BookingCalendarProps {
  selectedDate: DateTime;
  today: DateTime;
  // href para navegar a un día concreto (YYYY-MM-DD)
  dateHref: (isoDate: string) => string;
}

export function BookingCalendar({ selectedDate, today, dateHref }: BookingCalendarProps) {
  const monthStart = selectedDate.startOf("month");
  const daysInMonth = monthStart.daysInMonth ?? 30;
  // luxon: 1=lunes..7=domingo → padding antes del día 1
  const leadingBlanks = monthStart.weekday - 1;
  const todayStart = today.startOf("day");

  // navegación de mes
  const prevMonthTarget = monthStart.minus({ months: 1 });
  const prevMonthEnd = prevMonthTarget.endOf("month");
  const canGoPrevMonth = prevMonthEnd >= todayStart;
  const prevMonthDate = DateTime.max(prevMonthTarget.startOf("month"), todayStart);
  const nextMonthDate = monthStart.plus({ months: 1 }).startOf("month");

  const cells: (DateTime | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => monthStart.plus({ days: i })),
  ];

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm shadow-brand-100/40">
      <div className="mb-3 flex items-center justify-between">
        {canGoPrevMonth ? (
          <Link
            href={dateHref(prevMonthDate.toFormat("yyyy-MM-dd"))}
            aria-label="Mes anterior"
            className="flex h-8 w-8 items-center justify-center rounded-full text-brand-600 transition hover:bg-brand-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : (
          <span className="h-8 w-8" />
        )}
        <span className="text-sm font-semibold text-ink">
          {capitalizeFirst(selectedDate.setLocale("es").toFormat("LLLL yyyy"))}
        </span>
        <Link
          href={dateHref(nextMonthDate.toFormat("yyyy-MM-dd"))}
          aria-label="Mes siguiente"
          className="flex h-8 w-8 items-center justify-center rounded-full text-brand-600 transition hover:bg-brand-100"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="py-1 text-xs font-medium text-ink-soft">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`b${i}`} />;
          const isPast = day.startOf("day") < todayStart;
          const isSelected = day.hasSame(selectedDate, "day");
          const isToday = day.hasSame(today, "day");

          if (isPast) {
            return (
              <span key={day.toISODate()} className="flex h-9 items-center justify-center text-sm text-ink-soft/30">
                {day.day}
              </span>
            );
          }

          return (
            <Link
              key={day.toISODate()}
              href={dateHref(day.toFormat("yyyy-MM-dd"))}
              className={`flex h-9 items-center justify-center rounded-full text-sm transition ${
                isSelected
                  ? "bg-brand-500 font-semibold text-white"
                  : isToday
                    ? "border border-brand-300 text-brand-600 hover:bg-brand-50"
                    : "text-ink hover:bg-brand-50"
              }`}
            >
              {day.day}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
