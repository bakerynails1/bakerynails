import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { AssignmentCheckbox } from "./assignment-checkbox";

export default async function AsignacionesPage() {
  const session = await requireBusinessSession();
  const supabase = await createClient();

  const [{ data: staff }, { data: services }, { data: links }] = await Promise.all([
    supabase
      .from("staff")
      .select("id, name")
      .eq("business_id", session.businessId)
      .eq("active", true)
      .order("name"),
    supabase
      .from("services")
      .select("id, name, size")
      .eq("business_id", session.businessId)
      .eq("active", true)
      .order("name"),
    supabase.from("staff_services").select("staff_id, service_id"),
  ]);

  const staffList = staff ?? [];
  const serviceList = services ?? [];
  const assigned = new Set((links ?? []).map((l) => `${l.staff_id}:${l.service_id}`));

  if (staffList.length === 0 || serviceList.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Asignaciones</h1>
        <p className="mt-4 text-sm text-neutral-500">
          Necesitas al menos una empleada activa y un servicio activo antes de poder asignarlos.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Asignaciones</h1>
      <p className="mt-1 text-sm text-neutral-500">Marca qué servicios puede realizar cada empleada.</p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white p-2 text-left font-medium text-neutral-700">Empleada</th>
              {serviceList.map((service) => (
                <th key={service.id} className="p-2 text-center font-medium text-neutral-700">
                  {service.name}
                  {service.size ? ` (${service.size})` : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffList.map((member) => (
              <tr key={member.id} className="border-t border-neutral-100">
                <td className="sticky left-0 bg-white p-2 font-medium text-neutral-900">{member.name}</td>
                {serviceList.map((service) => (
                  <td key={service.id} className="p-2 text-center">
                    <AssignmentCheckbox
                      staffId={member.id}
                      serviceId={service.id}
                      defaultChecked={assigned.has(`${member.id}:${service.id}`)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
