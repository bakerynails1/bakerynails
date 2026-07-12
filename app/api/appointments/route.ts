import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppointmentError, createAppointment } from "@/lib/appointments";

const bodySchema = z.object({
  service_id: z.string().uuid(),
  staff_id: z.string().uuid(),
  starts_at: z.string().datetime({ offset: true }),
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(1).optional(),
    email: z.string().email().optional(),
  }),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const appointment = await createAppointment({
      serviceId: parsed.data.service_id,
      staffId: parsed.data.staff_id,
      startsAt: parsed.data.starts_at,
      customer: parsed.data.customer,
    });
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    if (error instanceof AppointmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
