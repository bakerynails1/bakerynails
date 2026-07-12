import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppointmentError, cancelAppointment } from "@/lib/appointments";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  try {
    const appointment = await cancelAppointment(params.data.id);
    return NextResponse.json({ appointment });
  } catch (error) {
    if (error instanceof AppointmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
