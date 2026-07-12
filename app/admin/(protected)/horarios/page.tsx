import Link from "next/link";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { RangeForm } from "./range-form";
import { ExceptionForm } from "./exception-form";
import { deleteScheduleRange, deleteException } from "./actions";

const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ staff?: string }>;
}) {
  const session = await requireBusinessSession();
  const supabase = await createClient();

  const { data: staffList } = await supabase
    .from("staff")
    .select("id, name")
    .eq("business_id", session.businessId)
    .eq("active", true)
    .order("name");

  if (!staffList || staffList.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Horarios</h1>
        <p className="mt-4 text-sm text-neutral-500">Primero da de alta empleadas activas.</p>
      </div>
    );
  }

  const { staff: staffParam } = await searchParams;
  const selectedStaffId = staffParam ?? staffList[0].id;

  const [{ data: schedules }, { data: exceptions }] = await Promise.all([
    supabase
      .from("staff_schedules")
      .select("id, weekday, start_time, end_time")
      .eq("staff_id", selectedStaffId)
      .order("weekday"),
    supabase
      .from("staff_schedule_exceptions")
      .select("id, date, is_day_off, start_time, end_time")
      .eq("staff_id", selectedStaffId)
      .order("date"),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Horarios</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {staffList.map((s) => (
          <Link
            key={s.id}
            href={`/admin/horarios?staff=${s.id}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              s.id === selectedStaffId ? "bg-brand-500 text-white" : "bg-white text-neutral-700 border border-neutral-200"
            }`}
          >
            {s.name}
          </Link>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Horario semanal</h2>
        <div className="space-y-3">
          {WEEKDAY_LABELS.map((label, weekday) => {
            const dayRanges = (schedules ?? []).filter((s) => s.weekday === weekday);
            return (
              <div key={weekday} className="rounded-lg border border-neutral-200 bg-white p-3">
                <p className="text-sm font-medium text-neutral-900">{label}</p>
                <div className="mt-1 space-y-1">
                  {dayRanges.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-sm text-neutral-600">
                      <span>
                        {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}
                      </span>
                      <form action={deleteScheduleRange}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="text-xs text-red-600 underline">
                          Quitar
                        </button>
                      </form>
                    </div>
                  ))}
                  {dayRanges.length === 0 && <p className="text-sm text-neutral-400">Sin horario (día libre)</p>}
                </div>
                <div className="mt-2">
                  <RangeForm staffId={selectedStaffId} weekday={weekday} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Excepciones puntuales</h2>
        <div className="rounded-lg border border-neutral-200 bg-white p-3">
          <ExceptionForm staffId={selectedStaffId} />
        </div>
        <div className="mt-3 space-y-2">
          {(exceptions ?? []).map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 text-sm">
              <span>
                {e.date} —{" "}
                {e.is_day_off ? "Día libre" : `${e.start_time?.slice(0, 5)} – ${e.end_time?.slice(0, 5)}`}
              </span>
              <form action={deleteException}>
                <input type="hidden" name="id" value={e.id} />
                <button type="submit" className="text-xs text-red-600 underline">
                  Quitar
                </button>
              </form>
            </div>
          ))}
          {(exceptions ?? []).length === 0 && <p className="text-sm text-neutral-500">Sin excepciones registradas.</p>}
        </div>
      </section>
    </div>
  );
}
