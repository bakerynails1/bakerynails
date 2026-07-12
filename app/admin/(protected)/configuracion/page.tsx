import { requireBusinessSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { disconnectGoogleCalendar } from "./actions";
import { PageHeader, SectionCard, Button, ButtonLink } from "@/components/admin/ui";

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
      <PageHeader title="Configuración" />

      <SectionCard title="Google Calendar">
        {connected && <p className="mt-2 text-sm text-green-700">Conectado correctamente.</p>}
        {error && <p className="mt-2 text-sm text-red-600">{ERROR_MESSAGES[error] ?? "No se pudo conectar. Intenta de nuevo."}</p>}

        {isConnected ? (
          <div className="mt-3">
            <p className="text-sm text-ink-soft">
              Las citas confirmadas se sincronizan automáticamente con un calendario dedicado de Google Calendar.
            </p>
            <form action={disconnectGoogleCalendar} className="mt-3">
              <Button type="submit" variant="danger">
                Desconectar
              </Button>
            </form>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-ink-soft">
              Conecta tu cuenta de Google para que las citas confirmadas aparezcan automáticamente en un calendario.
            </p>
            <ButtonLink href="/api/google-calendar/connect" variant="primary" className="mt-3">
              Conectar Google Calendar
            </ButtonLink>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
