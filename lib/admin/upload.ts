import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "service-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export class UploadError extends Error {}

// Sube la foto de un servicio a Supabase Storage y devuelve su URL pública.
// Devuelve null si no se envió archivo (campo vacío). Lanza UploadError si
// el archivo es inválido (tipo/tamaño) o si falla la subida.
export async function uploadServiceImage(businessId: string, file: FormDataEntryValue | null): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;

  if (file.size > MAX_BYTES) throw new UploadError("La imagen no puede pesar más de 5 MB.");
  if (!ALLOWED.has(file.type)) throw new UploadError("Formato no válido. Usa JPG, PNG o WebP.");

  const supabase = createAdminClient();
  const path = `${businessId}/${crypto.randomUUID()}.${EXT[file.type]}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new UploadError(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
