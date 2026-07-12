import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getEnv(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;

  try {
    const ctxEnv = getCloudflareContext().env as Record<string, unknown>;
    const value = ctxEnv[name];
    if (typeof value === "string" && value) return value;
    console.error(`[getEnv] "${name}" no vino de process.env ni del contexto de Cloudflare. Tipo en ctx: ${typeof value}. Llaves visibles en ctx.env: ${Object.keys(ctxEnv).join(", ")}`);
  } catch (e) {
    console.error(`[getEnv] "${name}": getCloudflareContext() lanzó error: ${e instanceof Error ? e.message : String(e)}`);
  }

  throw new Error(`Falta la variable de entorno ${name}`);
}
