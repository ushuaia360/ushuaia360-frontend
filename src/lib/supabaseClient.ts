import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function assertSupabaseApiUrl(url: string): void {
  if (!url.trim()) return;
  try {
    const u = new URL(url);
    if (u.username || u.password) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL no debe incluir usuario/contraseña. Es la URL HTTPS del proyecto " +
          "(p. ej. https://xxxx.supabase.co en Settings → API), no la cadena de conexión a Postgres."
      );
    }
    if (u.port === "5432" || u.pathname.includes("/postgres")) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL parece una URL de base de datos (:5432 o /postgres). Usa la Project URL " +
          "https://<ref>.supabase.co desde el dashboard."
      );
    }
    if (u.hostname.includes("pooler.supabase.com")) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL apunta al pooler de Postgres. Usa https://<ref>.supabase.co (Project URL), no el pooler."
      );
    }
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL no es una URL válida.");
    }
    throw e;
  }
}

assertSupabaseApiUrl(supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const TRAILS_BUCKET = "trails";
export const TOURIST_PLACES_BUCKET = "tourist_places";
/** Fotos de reseñas (app móvil sube vía API → Supabase Storage). */
export const REVIEWS_BUCKET = "reviews";

export function getPublicUrlForBucket(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function getPublicUrl(path: string): string {
  return getPublicUrlForBucket(TRAILS_BUCKET, path);
}

function checkConfig(): void {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your-project")) {
    throw new Error(
      "Configura Supabase: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local. " +
        "Verifica que el bucket exista y tenga políticas que permitan INSERT."
    );
  }
}

/**
 * Uploads a file to the given Supabase Storage bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToBucket(
  bucket: string,
  path: string,
  file: File | Blob,
  contentType: string
): Promise<string> {
  checkConfig();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true });

  if (error) {
    const hint =
      error.message === "Failed to fetch"
        ? ` (Revisa: URL/API key en .env, bucket '${bucket}' creado, políticas de Storage, CORS)`
        : "";
    throw new Error(`Error al subir archivo: ${error.message}${hint}`);
  }

  return getPublicUrlForBucket(bucket, path);
}

/**
 * Uploads a file to the trails bucket (senderos).
 */
export async function uploadFile(
  path: string,
  file: File | Blob,
  contentType: string
): Promise<string> {
  return uploadToBucket(TRAILS_BUCKET, path, file, contentType);
}

/**
 * Uploads a file to the tourist_places bucket (puntos turísticos).
 */
export async function uploadTouristPlaceFile(
  path: string,
  file: File | Blob,
  contentType: string
): Promise<string> {
  return uploadToBucket(TOURIST_PLACES_BUCKET, path, file, contentType);
}
