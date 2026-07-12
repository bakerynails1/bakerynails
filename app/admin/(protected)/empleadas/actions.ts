"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

const staffSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  phone: z.string().optional(),
});

export interface StaffFormState {
  error?: string;
}

export async function createStaff(_prevState: StaffFormState, formData: FormData): Promise<StaffFormState> {
  const session = await requireBusinessSession();
  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("staff").insert({
    business_id: session.businessId,
    name: parsed.data.name,
    phone: parsed.data.phone ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/empleadas");
  return {};
}

export async function updateStaff(_prevState: StaffFormState, formData: FormData): Promise<StaffFormState> {
  await requireBusinessSession();
  const id = formData.get("id");
  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
  });
  if (typeof id !== "string") return { error: "id inválido" };
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("staff")
    .update({ name: parsed.data.name, phone: parsed.data.phone ?? null })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/empleadas");
  return {};
}

export async function toggleStaffActive(formData: FormData) {
  await requireBusinessSession();
  const id = formData.get("id");
  const active = formData.get("active") === "true";
  if (typeof id !== "string") return;

  const supabase = await createClient();
  await supabase.from("staff").update({ active: !active }).eq("id", id);
  revalidatePath("/admin/empleadas");
}
