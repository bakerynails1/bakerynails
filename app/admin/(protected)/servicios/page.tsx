import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "./category-form";
import { ServiceForm } from "./service-form";
import { toggleServiceActive } from "./actions";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function ServiciosPage() {
  const session = await requireBusinessSession();
  const supabase = await createClient();

  const [{ data: categories }, { data: services }] = await Promise.all([
    supabase
      .from("service_categories")
      .select("id, name, sort_order")
      .eq("business_id", session.businessId)
      .order("sort_order"),
    supabase
      .from("services")
      .select("id, category_id, name, price_cents, duration_minutes, size, active")
      .eq("business_id", session.businessId)
      .order("name"),
  ]);

  const categoryList = categories ?? [];

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Servicios</h1>

      <section className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <CategoryForm />
      </section>

      <section className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-neutral-700">Agregar servicio</h2>
        {categoryList.length === 0 ? (
          <p className="text-sm text-neutral-500">Primero crea una categoría.</p>
        ) : (
          <ServiceForm categories={categoryList} />
        )}
      </section>

      <div className="mt-6 space-y-6">
        {categoryList.map((category) => {
          const categoryServices = (services ?? []).filter((s) => s.category_id === category.id);
          return (
            <section key={category.id}>
              <h2 className="mb-2 text-sm font-semibold text-neutral-700">{category.name}</h2>
              <div className="space-y-2">
                {categoryServices.map((s) => (
                  <div key={s.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-neutral-900">
                          {s.name} {s.size && <span className="text-neutral-500">({s.size})</span>}{" "}
                          {!s.active && <span className="ml-2 rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600">Inactivo</span>}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {formatPrice(s.price_cents)} · {s.duration_minutes} min
                        </p>
                      </div>
                      <form action={toggleServiceActive}>
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
                        <ServiceForm categories={categoryList} service={s} />
                      </div>
                    </details>
                  </div>
                ))}
                {categoryServices.length === 0 && <p className="text-sm text-neutral-500">Sin servicios en esta categoría.</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
