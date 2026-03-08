"use client";

import { useEffect, useRef, useState } from "react";

interface MapComponentProps {
  point: [number, number] | null;
  onPointChange: (point: [number, number] | null) => void;
}

export default function MapComponent({
  point,
  onPointChange,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isInitializedRef = useRef<boolean>(false);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [useLeaflet, setUseLeaflet] = useState(true);

  useEffect(() => {
    if (!mapRef.current || isInitializedRef.current) return; // Evitar inicializar múltiples veces

    // Cargar Leaflet dinámicamente
    const loadMap = async () => {
      try {
        // Intentar cargar desde npm primero
        let L: any;
        try {
          L = await import("leaflet");
          // Intentar cargar CSS
          try {
            await import("leaflet/dist/leaflet.css");
          } catch (cssErr) {
            // Si no se puede cargar el CSS, cargar desde CDN
            if (!document.getElementById("leaflet-css")) {
              const link = document.createElement("link");
              link.id = "leaflet-css";
              link.rel = "stylesheet";
              link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
              document.head.appendChild(link);
            }
          }
        } catch (npmErr) {
          // Si falla npm, intentar cargar desde CDN
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
              if (!document.getElementById("leaflet-css")) {
                const link = document.createElement("link");
                link.id = "leaflet-css";
                link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
              }

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

        // Inyectar estilos básicos si no están
        if (!document.getElementById("leaflet-style")) {
          const style = document.createElement("style");
          style.id = "leaflet-style";
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

        // Inicializar mapa centrado en Ushuaia
        const center = point || [-54.8019, -68.303];
        const newMap = L.map(mapRef.current!, {
          center: [center[0], center[1]],
          zoom: point ? 15 : 10,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(newMap);

        // Agregar marcador si hay punto
        if (point) {
          const newMarker = L.marker([point[0], point[1]], {
            draggable: true,
          }).addTo(newMap);

          newMarker.on("dragend", (e: any) => {
            const latlng = e.target.getLatLng();
            onPointChange([latlng.lat, latlng.lng]);
          });

          markerRef.current = newMarker;
          setMarker(newMarker);
        }

        // Guardar referencia del mapa
        mapInstanceRef.current = newMap;
        setMap(newMap);
        isInitializedRef.current = true;

        // Agregar click handler para crear/mover marcador
        newMap.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const newMarker = L.marker([lat, lng], {
              draggable: true,
            }).addTo(newMap);

            newMarker.on("dragend", (e: any) => {
              const latlng = e.target.getLatLng();
              onPointChange([latlng.lat, latlng.lng]);
            });

            markerRef.current = newMarker;
            setMarker(newMarker);
          }
          onPointChange([lat, lng]);
        });

        setUseLeaflet(true);
      } catch (err) {
        console.error("Error loading Leaflet:", err);
        setUseLeaflet(false);
        // Mostrar mensaje de error con instrucciones
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div class="flex h-full items-center justify-center bg-gray-100">
              <div class="text-center p-4">
                <p class="text-sm font-medium text-gray-700 mb-2">Error al cargar el mapa</p>
                <p class="text-xs text-gray-500 mb-4">Para usar mapas interactivos, instala Leaflet:</p>
                <code class="block bg-gray-200 px-3 py-2 rounded text-xs">npm install leaflet @types/leaflet</code>
              </div>
            </div>
          `;
        }
      }
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current && useLeaflet) {
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
    if (!useLeaflet || !map) return;

    if (point && marker) {
      marker.setLatLng([point[0], point[1]]);
      map.setView([point[0], point[1]], 15);
    } else if (point && !marker) {
      const loadMarker = async () => {
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
          
          const newMarker = L.marker([point[0], point[1]], {
            draggable: true,
          }).addTo(map);

          newMarker.on("dragend", (e: any) => {
            const latlng = e.target.getLatLng();
            onPointChange([latlng.lat, latlng.lng]);
          });

          markerRef.current = newMarker;
          setMarker(newMarker);
          map.setView([point[0], point[1]], 15);
        } catch (err) {
          console.error("Error loading marker:", err);
        }
      };
      loadMarker();
    } else if (!point && marker) {
      map.removeLayer(marker);
      markerRef.current = null;
      setMarker(null);
    }
  }, [point, map, marker, onPointChange, useLeaflet]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
      <div className="absolute top-2 left-2 z-10 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
        {useLeaflet
          ? "Haz clic en el mapa para seleccionar el punto del sendero"
          : "Usa el mapa para ubicar el punto (modo básico)"}
      </div>
      {point && (
        <div className="absolute top-2 right-2 z-10 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
          {point[1].toFixed(6)}, {point[0].toFixed(6)}
        </div>
      )}
    </div>
  );
}
