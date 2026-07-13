"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { AppointmentError, createAppointment } from "@/lib/appointments";

export interface ConfirmState {
  error?: string;
}

const bookingSchema = z.object({
  service_id: z.string().uuid(),
  staff_id: z.string().uuid(),
  starts_at: z.string().datetime({ offset: true }),
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function confirmBooking(_prevState: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const parsed = bookingSchema.safeParse({
    service_id: formData.get("service_id"),
    staff_id: formData.get("staff_id"),
    starts_at: formData.get("starts_at"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    birthday: formData.get("birthday") || undefined,
  });

  if (!parsed.success) {
    return { error: "Faltan datos para completar la reserva. Intenta de nuevo desde el inicio." };
  }

  let appointmentId: string;
  try {
    const appointment = await createAppointment({
      serviceId: parsed.data.service_id,
      staffId: parsed.data.staff_id,
      startsAt: parsed.data.starts_at,
      customer: { name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email, birthday: parsed.data.birthday },
    });
    appointmentId = appointment.id;
  } catch (error) {
    if (error instanceof AppointmentError) return { error: error.message };
    throw error;
  }

  redirect(`/confirmacion/exito?id=${appointmentId}`);
}
