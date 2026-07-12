import { DateTime } from "luxon";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  const session = await requireBusinessSession();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("timezone")
    .eq("id", session.businessId)
    .maybeSingle();
  const timezone = business?.timezone ?? "America/Mazatlan";
  const today = DateTime.now().setZone(timezone);

  const [{ count: appointmentsToday }, { count: activeStaff }, { count: activeServices }] = await Promise.all([
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("business_id", session.businessId)
      .eq("status", "confirmed")
      .gte("starts_at", today.startOf("day").toUTC().toISO()!)
      .lte("starts_at", today.endOf("day").toUTC().toISO()!),
    supabase
      .from("staff")
      .select("*", { count: "exact", head: true })
      .eq("business_id", session.businessId)
      .eq("active", true),
    supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("business_id", session.businessId)
      .eq("active", true),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Hola{session.userEmail ? `, ${session.userEmail}` : ""}</h1>
      <p className="mt-1 text-sm text-neutral-500">Resumen rápido de {session.businessName}.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Citas de hoy" value={appointmentsToday ?? 0} />
        <SummaryCard label="Empleadas activas" value={activeStaff ?? 0} />
        <SummaryCard label="Servicios activos" value={activeServices ?? 0} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
