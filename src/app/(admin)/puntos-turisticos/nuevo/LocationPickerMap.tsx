"use client";

import { useEffect, useRef } from "react";

interface LocationPickerMapProps {
  point: [number, number] | null;
  onPointChange: (point: [number, number]) => void;
}

const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const RED_MARKER_URL =
  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png";
const MARKER_SHADOW_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png";
const USHUAIA_CENTER: [number, number] = [-54.8019, -68.303];

async function loadLeaflet(): Promise<any> {
  if ((window as any).L) return (window as any).L;

  if (!document.getElementById("leaflet-css")) {
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS_URL;
    document.head.appendChild(link);
  }

  await new Promise<void>((resolve, reject) => {
    if ((window as any).L) {
      resolve();
      return;
    }
    const existing = document.getElementById("leaflet-js") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Leaflet load error")));
      return;
    }
    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = LEAFLET_JS_URL;
    script.onload = () => setTimeout(() => resolve(), 50);
    script.onerror = () => reject(new Error("Failed to load Leaflet"));
    document.head.appendChild(script);
  });

  return (window as any).L;
}

export default function LocationPickerMap({
  point,
  onPointChange,
}: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onPointChangeRef = useRef(onPointChange);

  useEffect(() => {
    onPointChangeRef.current = onPointChange;
  }, [onPointChange]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!containerRef.current) return;

      try {
        const L = await loadLeaflet();
        if (cancelled || !containerRef.current) return;

        if ((containerRef.current as any)._leaflet_id) {
          try {
            delete (containerRef.current as any)._leaflet_id;
          } catch {
            /* noop */
          }
          containerRef.current.innerHTML = "";
        }

        const initialCenter: [number, number] = point ?? USHUAIA_CENTER;
        const initialZoom = point ? 13 : 11;

        const map = L.map(containerRef.current, {
          center: initialCenter,
          zoom: initialZoom,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;

        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          onPointChangeRef.current([lat, lng]);
        });

        setTimeout(() => {
          try {
            map.invalidateSize();
          } catch {
            /* noop */
          }
        }, 200);
      } catch (err) {
        console.error("Error initializing location picker map:", err);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          /* noop */
        }
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const L = (window as any).L;
    if (!L) return;

    if (!point) {
      if (markerRef.current) {
        try {
          map.removeLayer(markerRef.current);
        } catch {
          /* noop */
        }
        markerRef.current = null;
      }
      return;
    }

    if (markerRef.current) {
      try {
        markerRef.current.setLatLng(point);
      } catch {
        markerRef.current = null;
      }
    }

    if (!markerRef.current) {
      const icon = L.icon({
        iconUrl: RED_MARKER_URL,
        shadowUrl: MARKER_SHADOW_URL,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const marker = L.marker(point, { draggable: true, icon }).addTo(map);
      marker.bindPopup("Ubicación del punto turístico");
      marker.on("dragend", (e: any) => {
        const latlng = e.target.getLatLng();
        onPointChangeRef.current([latlng.lat, latlng.lng]);
      });
      markerRef.current = marker;
    }
  }, [point]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-lg">
        Haz clic en el mapa para seleccionar la ubicación
      </div>
    </div>
  );
}
