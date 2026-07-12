import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getEnv(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;

  try {
    const value = (getCloudflareContext().env as Record<string, unknown>)[name];
    if (typeof value === "string" && value) return value;
  } catch {
    // In local Next.js dev/build there is no Cloudflare request context.
  }

  throw new Error(`Falta la variable de entorno ${name}`);
}
