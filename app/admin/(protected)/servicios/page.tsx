import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "./category-form";
import { ServiceForm } from "./service-form";
import { ServiceList } from "./service-list";
import { PageHeader, SectionCard } from "@/components/admin/ui";

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
      .select("id, category_id, name, price_cents, duration_minutes, size, active, image_url")
      .eq("business_id", session.businessId)
      .order("name"),
  ]);

  const categoryList = categories ?? [];
  const serviceList = services ?? [];

  return (
    <div>
      <PageHeader title="Servicios" description={`${serviceList.length} servicios en ${categoryList.length} categorías.`} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Nueva categoría">
          <CategoryForm />
        </SectionCard>

        <SectionCard title="Agregar servicio">
          {categoryList.length === 0 ? (
            <p className="text-sm text-ink-soft">Primero crea una categoría.</p>
          ) : (
            <ServiceForm categories={categoryList} />
          )}
        </SectionCard>
      </div>

      <div className="mt-6">
        <ServiceList categories={categoryList} services={serviceList} />
      </div>
    </div>
  );
}
