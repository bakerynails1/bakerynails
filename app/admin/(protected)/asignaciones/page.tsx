import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { AssignmentCheckbox } from "./assignment-checkbox";
import { SelectAllButton } from "./select-all-button";
import { PageHeader, EmptyState } from "@/components/admin/ui";

export default async function AsignacionesPage() {
  const session = await requireBusinessSession();
  const supabase = await createClient();

  const [{ data: staff }, { data: categories }, { data: services }, { data: links }] = await Promise.all([
    supabase
      .from("staff")
      .select("id, name")
      .eq("business_id", session.businessId)
      .eq("active", true)
      .order("name"),
    supabase
      .from("service_categories")
      .select("id, name, sort_order")
      .eq("business_id", session.businessId)
      .order("sort_order"),
    supabase
      .from("services")
      .select("id, category_id, name, size")
      .eq("business_id", session.businessId)
      .eq("active", true)
      .order("name"),
    supabase.from("staff_services").select("staff_id, service_id"),
  ]);

  const staffList = staff ?? [];
  const categoryList = categories ?? [];
  const serviceList = services ?? [];
  const assigned = new Set((links ?? []).map((l) => `${l.staff_id}:${l.service_id}`));
  const allServiceIds = serviceList.map((s) => s.id);

  if (staffList.length === 0 || serviceList.length === 0) {
    return (
      <div>
        <PageHeader title="Asignaciones" />
        <EmptyState>Necesitas al menos una empleada activa y un servicio activo antes de poder asignarlos.</EmptyState>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Asignaciones" description="Marca qué servicios puede realizar cada empleada." />

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-brand-50/30">
              <th className="sticky left-0 z-10 bg-brand-50/30 p-2 text-left font-medium text-ink">Empleada</th>
              {categoryList.map((category) => {
                const categoryServiceIds = serviceList.filter((s) => s.category_id === category.id).map((s) => s.id);
                return (
                  <th key={category.id} colSpan={categoryServiceIds.length} className="border-l border-line p-2 text-center font-medium text-ink">
                    {category.name}
                  </th>
                );
              })}
            </tr>
            <tr className="border-b border-line">
              <th className="sticky left-0 z-10 bg-white p-2 text-left font-medium text-ink-soft">Todo</th>
              {categoryList.flatMap((category) =>
                serviceList
                  .filter((s) => s.category_id === category.id)
                  .map((service) => (
                    <th key={service.id} className="min-w-[7rem] max-w-[9rem] border-l border-line p-2 text-center text-xs font-normal text-ink-soft">
                      {service.name}
                      {service.size ? ` (${service.size})` : ""}
                    </th>
                  ))
              )}
            </tr>
          </thead>
          <tbody>
            {staffList.map((member) => (
              <tr key={member.id} className="border-t border-line">
                <td className="sticky left-0 z-10 bg-white p-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{member.name}</span>
                    <SelectAllButton staffId={member.id} serviceIds={allServiceIds} assigned={true} />
                    <SelectAllButton staffId={member.id} serviceIds={allServiceIds} assigned={false} />
                  </div>
                </td>
                {categoryList.flatMap((category) =>
                  serviceList
                    .filter((s) => s.category_id === category.id)
                    .map((service) => (
                      <td key={service.id} className="border-l border-line p-2 text-center">
                        <AssignmentCheckbox
                          staffId={member.id}
                          serviceId={service.id}
                          defaultChecked={assigned.has(`${member.id}:${service.id}`)}
                        />
                      </td>
                    ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
