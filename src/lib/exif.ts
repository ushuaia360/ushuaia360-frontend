import exifr from "exifr";

export async function extractGpsFromFile(file: File): Promise<[number, number] | null> {
  if (!file.type.startsWith("image/")) return null;
  try {
    const gps = await exifr.gps(file);
    if (gps && typeof gps.latitude === "number" && typeof gps.longitude === "number") {
      return [gps.latitude, gps.longitude];
    }
  } catch {
    // no EXIF or no GPS tag
  }
  return null;
}
