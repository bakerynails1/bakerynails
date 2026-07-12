import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AvailabilityError, getAvailability } from "@/lib/availability";

const querySchema = z.object({
  service_id: z.string().uuid("service_id debe ser un uuid válido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date debe tener formato YYYY-MM-DD"),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    service_id: request.nextUrl.searchParams.get("service_id"),
    date: request.nextUrl.searchParams.get("date"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const availability = await getAvailability(parsed.data.service_id, parsed.data.date);
    return NextResponse.json({ availability });
  } catch (error) {
    if (error instanceof AvailabilityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
