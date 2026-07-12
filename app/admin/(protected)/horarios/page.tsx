import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { RangeForm } from "./range-form";
import { ExceptionForm } from "./exception-form";
import { deleteScheduleRange, deleteException } from "./actions";
import { PageHeader, SectionCard, Button, ButtonLink, EmptyState } from "@/components/admin/ui";

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
        <PageHeader title="Horarios" />
        <EmptyState>Primero da de alta empleadas activas.</EmptyState>
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
      <PageHeader title="Horarios" description="Define el horario semanal de cada empleada y sus excepciones puntuales." />

      <div className="flex flex-wrap gap-2">
        {staffList.map((s) => (
          <ButtonLink key={s.id} href={`/admin/horarios?staff=${s.id}`} variant={s.id === selectedStaffId ? "primary" : "secondary"}>
            {s.name}
          </ButtonLink>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink">Horario semanal</h2>
        <div className="space-y-3">
          {WEEKDAY_LABELS.map((label, weekday) => {
            const dayRanges = (schedules ?? []).filter((s) => s.weekday === weekday);
            return (
              <SectionCard key={weekday} title={label}>
                <div className="space-y-1.5">
                  {dayRanges.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-sm text-ink">
                      <span>
                        {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}
                      </span>
                      <form action={deleteScheduleRange}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" size="sm" variant="danger">
                          Quitar
                        </Button>
                      </form>
                    </div>
                  ))}
                  {dayRanges.length === 0 && <p className="text-sm text-ink-soft">Sin horario (día libre)</p>}
                </div>
                <div className="mt-2">
                  <RangeForm staffId={selectedStaffId} weekday={weekday} />
                </div>
              </SectionCard>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink">Excepciones puntuales</h2>
        <SectionCard>
          <ExceptionForm staffId={selectedStaffId} />
        </SectionCard>
        <div className="mt-3 space-y-2">
          {(exceptions ?? []).map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-xl border border-line bg-white p-3 text-sm">
              <span className="text-ink">
                {e.date} — {e.is_day_off ? "Día libre" : `${e.start_time?.slice(0, 5)} – ${e.end_time?.slice(0, 5)}`}
              </span>
              <form action={deleteException}>
                <input type="hidden" name="id" value={e.id} />
                <Button type="submit" size="sm" variant="danger">
                  Quitar
                </Button>
              </form>
            </div>
          ))}
          {(exceptions ?? []).length === 0 && <p className="text-sm text-ink-soft">Sin excepciones registradas.</p>}
        </div>
      </section>
    </div>
  );
}
