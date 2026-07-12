import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { StaffForm } from "./staff-form";
import { toggleStaffActive } from "./actions";

export default async function EmpleadasPage() {
  const session = await requireBusinessSession();
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("staff")
    .select("id, name, phone, active")
    .eq("business_id", session.businessId)
    .order("name");

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Empleadas</h1>

      <section className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-neutral-700">Agregar empleada</h2>
        <StaffForm />
      </section>

      <section className="mt-6 space-y-2">
        {(staff ?? []).map((s) => (
          <div key={s.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">
                  {s.name}{" "}
                  {!s.active && <span className="ml-2 rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600">Inactiva</span>}
                </p>
                <p className="text-sm text-neutral-500">{s.phone || "Sin teléfono"}</p>
              </div>
              <form action={toggleStaffActive}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="active" value={String(s.active)} />
                <button type="submit" className="text-sm text-neutral-500 underline hover:text-neutral-900">
                  {s.active ? "Desactivar" : "Reactivar"}
                </button>
              </form>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-neutral-500">Editar</summary>
              <div className="mt-2">
                <StaffForm staff={s} />
              </div>
            </details>
          </div>
        ))}
        {(staff ?? []).length === 0 && <p className="text-sm text-neutral-500">Todavía no hay empleadas registradas.</p>}
      </section>
    </div>
  );
}
