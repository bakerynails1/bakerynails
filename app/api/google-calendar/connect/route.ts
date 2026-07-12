import { NextResponse } from "next/server";
import { requireBusinessSession } from "@/lib/admin/auth";
import { getGoogleAuthUrl } from "@/lib/google-calendar/oauth";

export async function GET() {
  const session = await requireBusinessSession();
  const url = getGoogleAuthUrl(session.businessId);
  return NextResponse.redirect(url);
}
