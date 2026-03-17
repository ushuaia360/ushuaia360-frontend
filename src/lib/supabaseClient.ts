import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const TRAILS_BUCKET = "trails";

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(TRAILS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function checkConfig(): void {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your-project")) {
    throw new Error(
      "Configura Supabase: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local. " +
        "Verifica que el bucket 'trails' exista y tenga políticas que permitan INSERT."
    );
  }
}

/**
 * Uploads a file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  path: string,
  file: File | Blob,
  contentType: string
): Promise<string> {
  checkConfig();

  const { error } = await supabase.storage
    .from(TRAILS_BUCKET)
    .upload(path, file, { contentType, upsert: true });

  if (error) {
    const hint =
      error.message === "Failed to fetch"
        ? " (Revisa: URL/API key en .env, bucket 'trails' creado, políticas de Storage, CORS)"
        : "";
    throw new Error(`Error al subir archivo: ${error.message}${hint}`);
  }

  return getPublicUrl(path);
}
