"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { uploadServiceImage, UploadError } from "@/lib/admin/upload";

export interface ServiceFormState {
  error?: string;
}

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
});

export async function createCategory(_prevState: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  const session = await requireBusinessSession();
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("service_categories")
    .select("*", { count: "exact", head: true })
    .eq("business_id", session.businessId);

  const { error } = await supabase.from("service_categories").insert({
    business_id: session.businessId,
    name: parsed.data.name,
    sort_order: count ?? 0,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/servicios");
  return {};
}

const priceToCents = (value: FormDataEntryValue | null) => {
  const pesos = Number(value);
  if (!Number.isFinite(pesos) || pesos < 0) return null;
  return Math.round(pesos * 100);
};

const serviceSchema = z.object({
  category_id: z.string().uuid("Elige una categoría"),
  name: z.string().min(1, "El nombre es obligatorio"),
  duration_minutes: z.coerce.number().int().positive("La duración debe ser mayor a 0"),
  size: z.string().optional(),
});

export async function createService(_prevState: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  const session = await requireBusinessSession();
  const priceCents = priceToCents(formData.get("price"));
  if (priceCents === null) return { error: "Precio inválido" };

  const parsed = serviceSchema.safeParse({
    category_id: formData.get("category_id"),
    name: formData.get("name"),
    duration_minutes: formData.get("duration_minutes"),
    size: formData.get("size") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadServiceImage(session.businessId, formData.get("image"));
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    business_id: session.businessId,
    category_id: parsed.data.category_id,
    name: parsed.data.name,
    price_cents: priceCents,
    duration_minutes: parsed.data.duration_minutes,
    size: parsed.data.size ?? null,
    image_url: imageUrl,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/servicios");
  return {};
}

export async function updateService(_prevState: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  const session = await requireBusinessSession();
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "id inválido" };

  const priceCents = priceToCents(formData.get("price"));
  if (priceCents === null) return { error: "Precio inválido" };

  const parsed = serviceSchema.safeParse({
    category_id: formData.get("category_id"),
    name: formData.get("name"),
    duration_minutes: formData.get("duration_minutes"),
    size: formData.get("size") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadServiceImage(session.businessId, formData.get("image"));
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      category_id: parsed.data.category_id,
      name: parsed.data.name,
      price_cents: priceCents,
      duration_minutes: parsed.data.duration_minutes,
      size: parsed.data.size ?? null,
      // solo reemplaza la foto si subieron una nueva
      ...(imageUrl ? { image_url: imageUrl } : {}),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/servicios");
  return {};
}

export async function toggleServiceActive(formData: FormData) {
  await requireBusinessSession();
  const id = formData.get("id");
  const active = formData.get("active") === "true";
  if (typeof id !== "string") return;

  const supabase = await createClient();
  await supabase.from("services").update({ active: !active }).eq("id", id);
  revalidatePath("/admin/servicios");
}
