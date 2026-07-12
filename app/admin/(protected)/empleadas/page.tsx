import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { StaffForm } from "./staff-form";
import { StaffList } from "./staff-list";
import { PageHeader, SectionCard } from "@/components/admin/ui";

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
      <PageHeader title="Empleadas" description="Da de alta a tu equipo y administra quién sigue activo." />

      <SectionCard title="Agregar empleada">
        <StaffForm />
      </SectionCard>

      <div className="mt-6">
        <StaffList staff={staff ?? []} />
      </div>
    </div>
  );
}
