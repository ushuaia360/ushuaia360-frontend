"use client";

import { useEffect, useRef, useState } from "react";

interface RouteMapComponentProps {
  segments: [number, number][];
  onSegmentsChange: (segments: [number, number][]) => void;
  initialPoint?: [number, number] | null;
}

export default function RouteMapComponent({
  segments,
  onSegmentsChange,
  initialPoint,
}: RouteMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const isInitializedRef = useRef<boolean>(false);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [polyline, setPolyline] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!mapRef.current || isInitializedRef.current) return; // Evitar inicializar múltiples veces

    const loadMap = async () => {
      try {
        // Intentar cargar desde npm primero
        let L: any;
        try {
          L = await import("leaflet");
        } catch (npmErr) {
          // Si falla, intentar cargar desde CDN
          if ((window as any).L) {
            L = (window as any).L;
          } else {
            // Cargar Leaflet desde CDN
            await new Promise<void>((resolve, reject) => {
              if ((window as any).L) {
                resolve();
                return;
              }
              
              // Cargar CSS
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
              document.head.appendChild(link);

              // Cargar JS
              const script = document.createElement("script");
              script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
              script.onload = () => resolve();
              script.onerror = () => reject(new Error("Failed to load Leaflet from CDN"));
              document.head.appendChild(script);
            });
            L = (window as any).L;
          }
        }

        // Inyectar estilos si no están
        if (!document.getElementById("leaflet-route-style")) {
          const style = document.createElement("style");
          style.id = "leaflet-route-style";
          style.textContent = `
            .leaflet-container { height: 100%; width: 100%; z-index: 0; }
          `;
          document.head.appendChild(style);
        }

        // Verificar y limpiar si el contenedor ya tiene un mapa
        if (mapRef.current) {
          // Verificar si Leaflet ya inicializó este contenedor
          if ((mapRef.current as any)._leaflet_id) {
            try {
              // Intentar obtener el mapa existente usando la API de Leaflet
              const existingMap = (L as any).map.get(mapRef.current);
              if (existingMap) {
                existingMap.remove();
              }
            } catch (e) {
              // Si falla, limpiar manualmente
              try {
                const existingMap = (mapRef.current as any)._leaflet;
                if (existingMap && typeof existingMap.remove === 'function') {
                  existingMap.remove();
                }
              } catch (e2) {
                // Ignorar errores
              }
            }
            // Limpiar el ID de Leaflet
            delete (mapRef.current as any)._leaflet_id;
          }
          
          // Limpiar el contenido del contenedor
          mapRef.current.innerHTML = "";
        }

        const center = initialPoint || segments[0] || [-54.8019, -68.303];
        const zoom = initialPoint || segments.length > 0 ? 13 : 10;

        const newMap = L.map(mapRef.current!, {
          center: Array.isArray(center) ? [center[0], center[1]] : center,
          zoom,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(newMap);

        // Click handler para agregar puntos
        newMap.on("click", (e: any) => {
          if (isDrawing) {
            const { lat, lng } = e.latlng;
            const newSegments = [...segments, [lat, lng]];
            onSegmentsChange(newSegments);
          }
        });

        mapInstanceRef.current = newMap;
        setMap(newMap);
        isInitializedRef.current = true;
      } catch (err) {
        console.error("Error loading map:", err);
        // Mostrar mensaje de error
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div class="flex h-full items-center justify-center bg-gray-100">
              <div class="text-center">
                <p class="text-sm text-gray-600 mb-2">Error al cargar el mapa</p>
                <p class="text-xs text-gray-500">Instala Leaflet: npm install leaflet</p>
              </div>
            </div>
          `;
        }
      }
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          isInitializedRef.current = false;
        } catch (e) {
          // Ignorar errores al remover
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateRoute = async () => {
      try {
        // Usar Leaflet desde window si está disponible, sino intentar importar
        let L: any;
        if ((window as any).L) {
          L = (window as any).L;
        } else {
          try {
            L = await import("leaflet");
          } catch (err) {
            console.error("Error loading Leaflet:", err);
            return;
          }
        }

        const currentMap = mapInstanceRef.current;

        // Remover marcadores y polyline anteriores
        markers.forEach((m) => {
          try {
            currentMap.removeLayer(m);
          } catch (e) {
            // Ignorar errores si el layer ya fue removido
          }
        });
        if (polyline) {
          try {
            currentMap.removeLayer(polyline);
          } catch (e) {
            // Ignorar errores si el layer ya fue removido
          }
        }

        if (segments.length === 0) {
          setMarkers([]);
          setPolyline(null);
          return;
        }

        // Crear nuevos marcadores
        const newMarkers = segments.map((segment, index) => {
          const marker = L.marker([segment[0], segment[1]], {
            draggable: true,
          }).addTo(currentMap);

          marker.bindPopup(`Punto ${index + 1}`);

          marker.on("dragend", (e: any) => {
            const latlng = e.target.getLatLng();
            const newSegments = [...segments];
            newSegments[index] = [latlng.lat, latlng.lng];
            onSegmentsChange(newSegments);
          });

          marker.on("click", () => {
            // Eliminar punto al hacer clic
            const newSegments = segments.filter((_, i) => i !== index);
            onSegmentsChange(newSegments);
          });

          return marker;
        });

        setMarkers(newMarkers);

        // Crear polyline
        if (segments.length > 1) {
          const latlngs = segments.map((s) => [s[0], s[1]]);
          const newPolyline = L.polyline(latlngs as any, {
            color: "#3FA9F5",
            weight: 4,
            opacity: 0.7,
          }).addTo(currentMap);
          setPolyline(newPolyline);
        }

        // Ajustar vista
        if (segments.length > 0 && newMarkers.length > 0) {
          const group = new (L as any).FeatureGroup(newMarkers);
          currentMap.fitBounds(group.getBounds().pad(0.1));
        }
      } catch (err) {
        console.error("Error updating route:", err);
      }
    };

    updateRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments, map]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
      <div className="absolute top-2 left-2 z-[1000] rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
        <button
          onClick={() => setIsDrawing(!isDrawing)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            isDrawing
              ? "bg-[#3FA9F5] text-white hover:bg-[#3FA9F5]/90"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {isDrawing ? "Finalizar Dibujo" : "Dibujar Ruta"}
        </button>
      </div>
      <div className="absolute top-2 left-2 z-[999] mt-10 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
        {isDrawing
          ? "Haz clic en el mapa para agregar puntos a la ruta"
          : "Activa 'Dibujar Ruta' para comenzar"}
      </div>
      {segments.length > 0 && (
        <div className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
          {segments.length} punto(s) en la ruta. Haz clic en un marcador para eliminarlo.
        </div>
      )}
    </div>
  );
}
