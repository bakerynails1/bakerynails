"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

const statusSchema = z.enum(["completed", "cancelled", "no_show", "confirmed"]);

export async function markAppointmentStatus(formData: FormData) {
  await requireBusinessSession();
  const id = formData.get("id");
  const parsedStatus = statusSchema.safeParse(formData.get("status"));
  if (typeof id !== "string" || !parsedStatus.success) return;

  const supabase = await createClient();
  await supabase.from("appointments").update({ status: parsedStatus.data }).eq("id", id);
  revalidatePath("/admin/citas");
}
