import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface BusinessSession {
  userId: string;
  userEmail: string;
  businessId: string;
  businessName: string;
  role: "owner" | "admin";
}

// Devuelve la sesión del panel admin, o redirige a /admin/login.
//
// Bootstrap de negocio único (MVP): la tabla business_users empieza vacía
// porque no hay flujo de invitación todavía. El primer usuario de Supabase
// Auth que inicia sesión se vuelve dueño automáticamente. Una vez que existe
// al menos un vínculo en business_users, cualquier otro usuario nuevo queda
// bloqueado hasta que un dueño lo dé de alta manualmente (fuera de este MVP).
export async function requireBusinessSession(): Promise<BusinessSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const admin = createAdminClient();

  const { data: membership } = await admin
    .from("business_users")
    .select("business_id, role, businesses(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) {
    return {
      userId: user.id,
      userEmail: user.email ?? "",
      businessId: membership.business_id,
      businessName: (membership.businesses as unknown as { name: string })?.name ?? "",
      role: membership.role as "owner" | "admin",
    };
  }

  const { data: business } = await admin.from("businesses").select("id, name").limit(1).maybeSingle();
  if (!business) redirect("/admin/login?error=no-business");

  const { count } = await admin
    .from("business_users")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id);

  if (count && count > 0) {
    redirect("/admin/login?error=unauthorized");
  }

  const { error: claimError } = await admin.from("business_users").insert({
    business_id: business.id,
    user_id: user.id,
    role: "owner",
  });
  if (claimError) redirect("/admin/login?error=claim-failed");

  return {
    userId: user.id,
    userEmail: user.email ?? "",
    businessId: business.id,
    businessName: business.name,
    role: "owner",
  };
}
