"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export interface HorarioFormState {
  error?: string;
}

const rangeSchema = z.object({
  staff_id: z.string().uuid(),
  weekday: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
});

export async function addScheduleRange(_prevState: HorarioFormState, formData: FormData): Promise<HorarioFormState> {
  await requireBusinessSession();
  const parsed = rangeSchema.safeParse({
    staff_id: formData.get("staff_id"),
    weekday: formData.get("weekday"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.start_time >= parsed.data.end_time) {
    return { error: "La hora de inicio debe ser antes que la de fin" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("staff_schedules").insert({
    staff_id: parsed.data.staff_id,
    weekday: parsed.data.weekday,
    start_time: parsed.data.start_time,
    end_time: parsed.data.end_time,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/horarios");
  return {};
}

export async function deleteScheduleRange(formData: FormData) {
  await requireBusinessSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const supabase = await createClient();
  await supabase.from("staff_schedules").delete().eq("id", id);
  revalidatePath("/admin/horarios");
}

const exceptionSchema = z.object({
  staff_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  is_day_off: z.boolean(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

export async function addException(_prevState: HorarioFormState, formData: FormData): Promise<HorarioFormState> {
  await requireBusinessSession();
  const isDayOff = formData.get("is_day_off") === "on";
  const parsed = exceptionSchema.safeParse({
    staff_id: formData.get("staff_id"),
    date: formData.get("date"),
    is_day_off: isDayOff,
    start_time: formData.get("start_time") || undefined,
    end_time: formData.get("end_time") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!isDayOff && (!parsed.data.start_time || !parsed.data.end_time)) {
    return { error: "Indica hora de inicio y fin, o marca el día completo como libre" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("staff_schedule_exceptions").insert({
    staff_id: parsed.data.staff_id,
    date: parsed.data.date,
    is_day_off: isDayOff,
    start_time: isDayOff ? null : parsed.data.start_time,
    end_time: isDayOff ? null : parsed.data.end_time,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/horarios");
  return {};
}

export async function deleteException(formData: FormData) {
  await requireBusinessSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const supabase = await createClient();
  await supabase.from("staff_schedule_exceptions").delete().eq("id", id);
  revalidatePath("/admin/horarios");
}
