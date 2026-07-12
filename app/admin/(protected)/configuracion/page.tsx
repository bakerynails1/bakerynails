import Link from "next/link";
import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { disconnectGoogleCalendar } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Google no devolvió un código de autorización. Intenta de nuevo.",
  no_refresh_token: "Google no entregó permiso permanente. Revoca el acceso en tu cuenta de Google e intenta de nuevo.",
  connect_failed: "No se pudo completar la conexión con Google. Intenta de nuevo.",
  access_denied: "Cancelaste el permiso en Google. Puedes intentarlo de nuevo cuando quieras.",
};

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const session = await requireBusinessSession();
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("google_calendar_id")
    .eq("id", session.businessId)
    .maybeSingle();
  const { connected, error } = await searchParams;

  const isConnected = !!business?.google_calendar_id;

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Configuración</h1>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-700">Google Calendar</h2>

        {connected && <p className="mt-2 text-sm text-green-700">Conectado correctamente.</p>}
        {error && <p className="mt-2 text-sm text-red-600">{ERROR_MESSAGES[error] ?? "No se pudo conectar. Intenta de nuevo."}</p>}

        {isConnected ? (
          <div className="mt-3">
            <p className="text-sm text-neutral-600">
              Las citas confirmadas se sincronizan automáticamente con un calendario dedicado de Google Calendar.
            </p>
            <form action={disconnectGoogleCalendar} className="mt-3">
              <button type="submit" className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700">
                Desconectar
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-neutral-600">
              Conecta tu cuenta de Google para que las citas confirmadas aparezcan automáticamente en un calendario.
            </p>
            <Link
              href="/api/google-calendar/connect"
              className="mt-3 inline-block rounded-md bg-brand-500 px-3 py-2 text-sm text-white"
            >
              Conectar Google Calendar
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
