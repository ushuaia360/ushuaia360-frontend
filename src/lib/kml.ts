/**
 * Extrae los puntos de una ruta desde un archivo KML.
 * Devuelve pares [lat, lng] (mismo formato que usa Leaflet en el resto del admin).
 * KML expresa las coordenadas como "lon,lat[,alt]", por eso se invierten acá.
 */
export function parseKmlRoute(kmlText: string): [number, number][] {
  const doc = new DOMParser().parseFromString(kmlText, "application/xml");

  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("El archivo KML no es válido");
  }

  const points: [number, number][] = [];

  for (const lineString of Array.from(doc.getElementsByTagName("LineString"))) {
    const coords = lineString.getElementsByTagName("coordinates")[0]?.textContent;
    if (coords) points.push(...parseCoordinatesText(coords));
  }

  // Algunos tracks GPS exportados como KML usan la extensión gx:Track en vez de LineString
  if (points.length === 0) {
    for (const coord of Array.from(doc.getElementsByTagName("gx:coord"))) {
      const parts = coord.textContent?.trim().split(/\s+/).map(Number) ?? [];
      if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
        points.push([parts[1], parts[0]]);
      }
    }
  }

  // Como último recurso, tomar Placemarks de tipo Point (waypoints sueltos)
  if (points.length === 0) {
    for (const point of Array.from(doc.getElementsByTagName("Point"))) {
      const coords = point.getElementsByTagName("coordinates")[0]?.textContent;
      if (coords) points.push(...parseCoordinatesText(coords));
    }
  }

  return points;
}

function parseCoordinatesText(text: string): [number, number][] {
  return text
    .trim()
    .split(/\s+/)
    .map((tuple) => tuple.split(",").map(Number))
    .filter(
      (parts) => parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1]),
    )
    .map(([lon, lat]) => [lat, lon] as [number, number]);
}
