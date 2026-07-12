import { NextRequest, NextResponse } from "next/server";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar/oauth";
import { createDedicatedCalendar } from "@/lib/google-calendar/client";

export async function GET(request: NextRequest) {
  const session = await requireBusinessSession();
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(new URL(`/admin/configuracion?error=${encodeURIComponent(oauthError)}`, request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/admin/configuracion?error=missing_code", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL("/admin/configuracion?error=no_refresh_token", request.url));
    }

    const supabase = await createClient();
    const { data: business } = await supabase
      .from("businesses")
      .select("name, timezone")
      .eq("id", session.businessId)
      .maybeSingle();

    const calendarId = await createDedicatedCalendar(
      tokens.access_token,
      `${business?.name ?? "Bakery Nails"} — Citas`,
      business?.timezone ?? "America/Mazatlan"
    );

    const { error: updateError } = await supabase
      .from("businesses")
      .update({ google_refresh_token: tokens.refresh_token, google_calendar_id: calendarId })
      .eq("id", session.businessId);
    if (updateError) throw new Error(updateError.message);

    return NextResponse.redirect(new URL("/admin/configuracion?connected=1", request.url));
  } catch (error) {
    console.error("google-calendar callback failed", error);
    return NextResponse.redirect(new URL("/admin/configuracion?error=connect_failed", request.url));
  }
}
