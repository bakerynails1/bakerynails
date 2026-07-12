"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function setAssignment(staffId: string, serviceId: string, assigned: boolean) {
  await requireBusinessSession();
  const supabase = await createClient();

  if (assigned) {
    await supabase.from("staff_services").insert({ staff_id: staffId, service_id: serviceId });
  } else {
    await supabase.from("staff_services").delete().eq("staff_id", staffId).eq("service_id", serviceId);
  }

  revalidatePath("/admin/asignaciones");
}
