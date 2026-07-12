"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function disconnectGoogleCalendar() {
  const session = await requireBusinessSession();
  const supabase = await createClient();
  await supabase
    .from("businesses")
    .update({ google_refresh_token: null, google_calendar_id: null })
    .eq("id", session.businessId);
  revalidatePath("/admin/configuracion");
}
