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

// Asigna o quita de golpe una lista de servicios para una empleada — evita
// tener que dar clic servicio por servicio cuando hay decenas de ellos.
export async function setManyAssignments(staffId: string, serviceIds: string[], assigned: boolean) {
  await requireBusinessSession();
  if (serviceIds.length === 0) return;
  const supabase = await createClient();

  if (assigned) {
    // upsert con ignoreDuplicates: algunos de estos ya pueden estar asignados,
    // y un insert normal tronaría por la llave primaria (staff_id, service_id).
    await supabase
      .from("staff_services")
      .upsert(
        serviceIds.map((serviceId) => ({ staff_id: staffId, service_id: serviceId })),
        { onConflict: "staff_id,service_id", ignoreDuplicates: true }
      );
  } else {
    await supabase.from("staff_services").delete().eq("staff_id", staffId).in("service_id", serviceIds);
  }

  revalidatePath("/admin/asignaciones");
}
