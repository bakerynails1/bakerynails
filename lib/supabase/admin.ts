import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getEnv } from "@/lib/env";

// Cliente con la service role key: ignora RLS. Úsalo solo dentro de
// rutas /api/* del sitio público de reservas (Fase 2), nunca en el
// navegador ni expuesto a través de props/cliente.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
