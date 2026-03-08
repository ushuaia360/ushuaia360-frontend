"use client";

import { useEffect, useRef, useState } from "react";

interface UnifiedMapComponentProps {
  mapPoint: [number, number] | null;
  onMapPointChange: (point: [number, number] | null) => void;
  routeSegments: [number, number][];
  onRouteSegmentsChange: (segments: [number, number][]) => void;
  pointsOfInterest: Array<{
    id: string;
    name: string;
    location: [number, number] | null;
  }>;
  onPointLocationChange: (pointId: string, location: [number, number] | null) => void;
  selectedPointId: string | null;
  isDrawingRoute: boolean;
  onDrawingRouteChange: (isDrawing: boolean) => void;
  isErasing: boolean;
  onErasingChange: (isErasing: boolean) => void;
}

export default function UnifiedMapComponent({
  mapPoint,
  onMapPointChange,
  routeSegments,
  onRouteSegmentsChange,
  pointsOfInterest,
  onPointLocationChange,
  selectedPointId,
  isDrawingRoute,
  onDrawingRouteChange,
  isErasing,
  onErasingChange,
}: UnifiedMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const isInitializedRef = useRef<boolean>(false);
  const initAttemptRef = useRef<boolean>(false);
  
  // Referencias para las capas
  const mainMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const routeMarkersRef = useRef<any[]>([]);
  const poiMarkersRef = useRef<any[]>([]);
  
  // Estados para mostrar/ocultar capas
  const [showMainPoint, setShowMainPoint] = useState(true);
  const [showRoute, setShowRoute] = useState(true);
  const [showPointsOfInterest, setShowPointsOfInterest] = useState(true);

  useEffect(() => {
    if (!mapRef.current) return;

    // Si ya hay un intento de inicialización en curso, esperar
    if (initAttemptRef.current) return;

    const loadMap = async () => {
      initAttemptRef.current = true;
      try {
        // Cargar Leaflet desde CDN (Next.js no soporta import dinámico de CSS)
        let L: any;
        
        if ((window as any).L) {
          L = (window as any).L;
        } else {
          // Cargar CSS primero
          if (!document.getElementById("leaflet-css")) {
            const link = document.createElement("link");
            link.id = "leaflet-css";
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
            link.crossOrigin = "";
            document.head.appendChild(link);
          }

          // Esperar a que el CSS se cargue
          await new Promise(resolve => setTimeout(resolve, 100));

          // Cargar JS
          await new Promise<void>((resolve, reject) => {
            if ((window as any).L) {
              resolve();
              return;
            }

            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
            script.crossOrigin = "";
            script.onload = () => {
              // Esperar un momento para asegurar que Leaflet esté completamente cargado
              setTimeout(() => resolve(), 50);
            };
            script.onerror = () => reject(new Error("Failed to load Leaflet from CDN"));
            document.head.appendChild(script);
          });
          L = (window as any).L;
          
          if (!L) {
            throw new Error("Leaflet no se cargó correctamente");
          }
        }

        if (!document.getElementById("leaflet-style")) {
          const style = document.createElement("style");
          style.id = "leaflet-style";
          style.textContent = `
            .leaflet-container { height: 100%; width: 100%; z-index: 0; }
            .leaflet-marker-icon { z-index: 1000 !important; position: relative !important; }
            .leaflet-marker-pane { z-index: 600 !important; }
            .leaflet-shadow-pane { z-index: 500 !important; }
            .main-trail-marker { z-index: 1001 !important; position: relative !important; }
            .main-trail-marker img { display: block !important; visibility: visible !important; opacity: 1 !important; }
          `;
          document.head.appendChild(style);
        }

        // Verificar y limpiar si el contenedor ya tiene un mapa
        if (mapRef.current) {
          if ((mapRef.current as any)._leaflet_id) {
            try {
              const existingMap = (L as any).map.get(mapRef.current);
              if (existingMap) {
                existingMap.remove();
              }
            } catch (e) {
              try {
                const existingMap = (mapRef.current as any)._leaflet;
                if (existingMap && typeof existingMap.remove === 'function') {
                  existingMap.remove();
                }
              } catch (e2) {
                // Ignorar errores
              }
            }
            delete (mapRef.current as any)._leaflet_id;
          }
          mapRef.current.innerHTML = "";
        }

        // Coordenadas de Ushuaia: [lat, lng] para Leaflet
        const defaultCenter: [number, number] = [-54.8019, -68.303];
        let center: [number, number] = defaultCenter;
        let zoom = 10;

        if (mapPoint) {
          // mapPoint viene como [lat, lng] desde el componente padre
          center = [mapPoint[0], mapPoint[1]];
          zoom = 13;
        } else if (routeSegments.length > 0) {
          // routeSegments viene como [lat, lng]
          center = [routeSegments[0][0], routeSegments[0][1]];
          zoom = 13;
        }

        const newMap = L.map(mapRef.current!, {
          center,
          zoom,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(newMap);

        mapInstanceRef.current = newMap;
        isInitializedRef.current = true;
        initAttemptRef.current = false;

        // Forzar invalidación del tamaño del mapa después de un pequeño delay
        setTimeout(() => {
          if (mapInstanceRef.current) {
            try {
              mapInstanceRef.current.invalidateSize();
              // Si hay un mapPoint, crear el marcador inmediatamente después de inicializar
              if (mapPoint && Array.isArray(mapPoint) && mapPoint.length >= 2 && showMainPoint) {
                const L = (window as any).L;
                if (L && !mainMarkerRef.current) {
                  console.log("Creating initial main marker at:", mapPoint);
                  try {
                    const redIcon = L.icon({
                      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41],
                      className: 'main-trail-marker'
                    });
                    
                    const marker = L.marker([mapPoint[0], mapPoint[1]], {
                      draggable: true,
                      icon: redIcon,
                      zIndexOffset: 1000
                    }).addTo(mapInstanceRef.current);

                    // Asegurar que el marcador esté visible
                    const markerElement = marker.getElement();
                    if (markerElement) {
                      markerElement.style.zIndex = '1000';
                      markerElement.style.position = 'relative';
                    }

                    marker.bindPopup("Punto principal del sendero");
                    marker.on("dragend", (e: any) => {
                      const latlng = e.target.getLatLng();
                      onMapPointChange([latlng.lat, latlng.lng]);
                    });

                    mainMarkerRef.current = marker;
                    console.log("Initial marker created successfully", "Element:", markerElement);
                  } catch (err) {
                    console.error("Error creating initial marker:", err);
                  }
                }
              }
            } catch (e) {
              console.error("Error invalidating map size:", e);
            }
          }
        }, 300);
      } catch (err) {
        console.error("Error loading map:", err);
        initAttemptRef.current = false;
        isInitializedRef.current = false;
      }
    };

    // Limpiar mapa anterior si existe
    if (isInitializedRef.current && mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        isInitializedRef.current = false;
        if (mapRef.current) {
          mapRef.current.innerHTML = "";
          delete (mapRef.current as any)._leaflet_id;
        }
      } catch (e) {
        console.error("Error cleaning up map:", e);
      }
    }

    // Cargar el mapa
    if (!isInitializedRef.current) {
      loadMap();
    }

    return () => {
      // Limpiar al desmontar
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          isInitializedRef.current = false;
          initAttemptRef.current = false;
        } catch (e) {
          // Ignorar errores
        }
      }
    };
  }, []); // Solo ejecutar una vez al montar

  // Efecto separado para invalidar tamaño cuando cambia el contenedor
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timeoutId = setTimeout(() => {
        try {
          mapInstanceRef.current.invalidateSize();
          // Si hay un mapPoint, centrar el mapa en él
          if (mapPoint && Array.isArray(mapPoint) && mapPoint.length >= 2) {
            mapInstanceRef.current.setView([mapPoint[0], mapPoint[1]], 13);
          }
        } catch (e) {
          // Ignorar errores
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [mapPoint, routeSegments]);

  // Actualizar click handler cuando cambian los modos
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remover handler anterior si existe
    mapInstanceRef.current.off("click");

    // Agregar nuevo handler con valores actualizados
    const handleMapClick = (e: any) => {
      const { lat, lng } = e.latlng;
      
      // Si está en modo borrar, no hacer nada en el click del mapa (solo en los marcadores)
      if (isErasing) {
        return;
      }
      
      // Leaflet devuelve [lat, lng], mantener ese orden
      // Prioridad: dibujar ruta > punto de interés seleccionado > punto principal
      if (isDrawingRoute) {
        // Agregar punto a la ruta [lat, lng]
        const newSegments = [...routeSegments, [lat, lng]];
        onRouteSegmentsChange(newSegments);
      } else if (selectedPointId) {
        // Actualizar ubicación del punto de interés seleccionado [lat, lng]
        onPointLocationChange(selectedPointId, [lat, lng]);
      } else {
        // Actualizar punto principal del sendero [lat, lng]
        onMapPointChange([lat, lng]);
      }
    };

    mapInstanceRef.current.on("click", handleMapClick);
  }, [isDrawingRoute, selectedPointId, isErasing, routeSegments, onRouteSegmentsChange, onPointLocationChange, onMapPointChange]);

  // Actualizar punto principal
  useEffect(() => {
    console.log("Main point effect - mapPoint:", mapPoint, "showMainPoint:", showMainPoint, "mapInstance:", !!mapInstanceRef.current);
    
    if (!showMainPoint) {
      if (mainMarkerRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(mainMarkerRef.current);
        } catch (e) {
          // Ignorar
        }
        mainMarkerRef.current = null;
      }
      return;
    }

    const updateMainPoint = () => {
      try {
        const L = (window as any).L;
        if (!L) {
          console.warn("Leaflet not loaded yet");
          return;
        }
        
        if (!mapInstanceRef.current) {
          console.warn("Map instance not ready");
          return;
        }
        
        // Verificar si el marcador ya existe y está en el mapa
        if (mainMarkerRef.current) {
          // Verificar si el marcador todavía está en el mapa
          try {
            const hasLayer = mapInstanceRef.current.hasLayer(mainMarkerRef.current);
            if (!hasLayer) {
              console.log("Marker was removed from map, recreating...");
              mainMarkerRef.current = null;
            } else if (mapPoint && Array.isArray(mapPoint) && mapPoint.length >= 2) {
              // Actualizar posición del marcador existente
              try {
                console.log("Updating marker position to:", mapPoint);
                mainMarkerRef.current.setLatLng([mapPoint[0], mapPoint[1]]);
                return; // No crear un nuevo marcador
              } catch (e) {
                console.error("Error updating marker position:", e);
                // Si hay error, intentar recrear
                try {
                  mapInstanceRef.current.removeLayer(mainMarkerRef.current);
                } catch (e2) {
                  // Ignorar
                }
                mainMarkerRef.current = null;
              }
            }
          } catch (e) {
            console.error("Error checking marker:", e);
            mainMarkerRef.current = null;
          }
        }
        
        // Crear nuevo marcador solo si no existe o fue removido
        if (!mainMarkerRef.current && mapPoint && Array.isArray(mapPoint) && mapPoint.length >= 2) {
          // Crear nuevo marcador
          console.log("Creating main marker at:", mapPoint, "on map:", mapInstanceRef.current);
          try {
            const redIcon = L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
              className: 'main-trail-marker'
            });
            
            // Pre-cargar la imagen para asegurar que esté disponible
            const img = new Image();
            img.onload = () => {
              console.log("Red marker icon loaded successfully");
            };
            img.onerror = () => {
              console.error("Failed to load red marker icon");
            };
            img.src = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';
            
            const marker = L.marker([mapPoint[0], mapPoint[1]], {
              draggable: true,
              icon: redIcon,
              zIndexOffset: 1000
            }).addTo(mapInstanceRef.current);

            // Asegurar que el marcador esté visible
            const markerElement = marker.getElement();
            if (markerElement) {
              markerElement.style.zIndex = '1000';
              markerElement.style.position = 'relative';
            }

            marker.bindPopup("Punto principal del sendero");
            marker.on("dragend", (e: any) => {
              const latlng = e.target.getLatLng();
              onMapPointChange([latlng.lat, latlng.lng]);
            });

            mainMarkerRef.current = marker;
            console.log("Marker created successfully:", marker, "Element:", markerElement);
          } catch (err) {
            console.error("Error creating marker:", err);
          }
        }
      } catch (err) {
        console.error("Error in updateMainPoint:", err);
      }
    };

    // Si el mapa no está listo, esperar un poco y reintentar
    if (!mapInstanceRef.current) {
      console.log("Map not ready, waiting...");
      const timeoutId = setTimeout(() => {
        if (mapInstanceRef.current && mapPoint && Array.isArray(mapPoint) && mapPoint.length >= 2) {
          updateMainPoint();
        }
      }, 500);
      return () => {
        clearTimeout(timeoutId);
      };
    }

    // Solo ejecutar si hay un mapPoint válido
    if (mapPoint && Array.isArray(mapPoint) && mapPoint.length >= 2) {
      // Ejecutar inmediatamente
      updateMainPoint();
      
      // También ejecutar después de un delay para asegurar que el mapa esté completamente renderizado
      const timeoutId = setTimeout(() => {
        if (mapInstanceRef.current && mapPoint && Array.isArray(mapPoint) && mapPoint.length >= 2) {
          updateMainPoint();
        }
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      // Si no hay mapPoint, remover el marcador si existe
      if (mainMarkerRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(mainMarkerRef.current);
        } catch (e) {
          // Ignorar
        }
        mainMarkerRef.current = null;
      }
    }
  }, [mapPoint, showMainPoint, onMapPointChange]);

  // Actualizar ruta
  useEffect(() => {
    if (!mapInstanceRef.current || !showRoute) {
      routeMarkersRef.current.forEach((m) => {
        try {
          mapInstanceRef.current?.removeLayer(m);
        } catch (e) {
          // Ignorar
        }
      });
      if (routePolylineRef.current) {
        try {
          mapInstanceRef.current?.removeLayer(routePolylineRef.current);
        } catch (e) {
          // Ignorar
        }
      }
      routeMarkersRef.current = [];
      routePolylineRef.current = null;
      return;
    }

    const updateRoute = async () => {
      try {
        const L = (window as any).L || await import("leaflet");

        // Remover marcadores y polyline anteriores
        routeMarkersRef.current.forEach((m) => {
          try {
            mapInstanceRef.current.removeLayer(m);
          } catch (e) {
            // Ignorar
          }
        });
        if (routePolylineRef.current) {
          try {
            mapInstanceRef.current.removeLayer(routePolylineRef.current);
          } catch (e) {
            // Ignorar
          }
        }

        if (routeSegments.length === 0) {
          routeMarkersRef.current = [];
          routePolylineRef.current = null;
          return;
        }

        // Crear nuevos marcadores
        const newMarkers = routeSegments.map((segment, index) => {
          const marker = L.marker([segment[0], segment[1]], {
            draggable: !isErasing, // Solo arrastrable si no está en modo borrar
            icon: L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })
          }).addTo(mapInstanceRef.current);

          marker.bindPopup(`Punto ${index + 1} de la ruta`);
          
          marker.on("dragend", (e: any) => {
            if (!isErasing) {
              const latlng = e.target.getLatLng();
              const newSegments = [...routeSegments];
              newSegments[index] = [latlng.lat, latlng.lng];
              onRouteSegmentsChange(newSegments);
            }
          });

          marker.on("click", () => {
            // Solo borrar si está en modo goma de borrar
            if (isErasing) {
              const newSegments = routeSegments.filter((_, i) => i !== index);
              onRouteSegmentsChange(newSegments);
            }
          });

          return marker;
        });

        routeMarkersRef.current = newMarkers;

        // Crear polyline
        if (routeSegments.length > 1) {
          const latlngs = routeSegments.map((s) => [s[0], s[1]]);
          const polyline = L.polyline(latlngs as any, {
            color: "#3FA9F5",
            weight: 4,
            opacity: 0.7,
          }).addTo(mapInstanceRef.current);
          routePolylineRef.current = polyline;
        }

        // Ajustar vista
        if (routeSegments.length > 0 && newMarkers.length > 0) {
          const group = new (L as any).FeatureGroup(newMarkers);
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        }
      } catch (err) {
        console.error("Error updating route:", err);
      }
    };

    updateRoute();
  }, [routeSegments, showRoute, isErasing, onRouteSegmentsChange]);

  // Actualizar puntos de interés
  useEffect(() => {
    if (!mapInstanceRef.current || !showPointsOfInterest) {
      poiMarkersRef.current.forEach((m) => {
        try {
          mapInstanceRef.current?.removeLayer(m);
        } catch (e) {
          // Ignorar
        }
      });
      poiMarkersRef.current = [];
      return;
    }

    const updatePOIs = () => {
      try {
        const L = (window as any).L;
        if (!L) {
          // Si Leaflet no está cargado, intentar de nuevo en el siguiente ciclo
          setTimeout(updatePOIs, 100);
          return;
        }

        // Remover marcadores anteriores
        poiMarkersRef.current.forEach((m) => {
          try {
            mapInstanceRef.current.removeLayer(m);
          } catch (e) {
            // Ignorar
          }
        });

        poiMarkersRef.current = [];

        // Crear marcadores para puntos de interés con ubicación
        pointsOfInterest
          .filter((poi) => poi.location && Array.isArray(poi.location) && poi.location.length >= 2)
          .forEach((poi) => {
            try {
              const [lat, lng] = poi.location!;
              const marker = L.marker([lat, lng], {
                draggable: true,
                icon: L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })
              }).addTo(mapInstanceRef.current);

              marker.bindPopup(poi.name || "Punto de interés");
              marker.on("dragend", (e: any) => {
                const latlng = e.target.getLatLng();
                onPointLocationChange(poi.id, [latlng.lat, latlng.lng]);
              });

              poiMarkersRef.current.push(marker);
            } catch (err) {
              console.error("Error creating POI marker:", err, poi);
            }
          });
      } catch (err) {
        console.error("Error updating POIs:", err);
      }
    };

    // Ejecutar inmediatamente y también después de un pequeño delay para asegurar que el mapa esté listo
    updatePOIs();
    const timeoutId = setTimeout(updatePOIs, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [pointsOfInterest, showPointsOfInterest, onPointLocationChange]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Controles de capas */}
      <div className="absolute top-2 right-2 z-[1000] space-y-2">
        <div className="rounded-lg bg-white/95 p-2 shadow-lg">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showMainPoint}
                onChange={(e) => setShowMainPoint(e.target.checked)}
                className="h-3 w-3 rounded border-[#EBEBEB] text-[#3FA9F5]"
              />
              <span className="font-medium text-gray-700">Punto Principal</span>
            </label>
            
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showRoute}
                onChange={(e) => setShowRoute(e.target.checked)}
                className="h-3 w-3 rounded border-[#EBEBEB] text-[#3FA9F5]"
              />
              <span className="font-medium text-gray-700">Ruta</span>
            </label>
            
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showPointsOfInterest}
                onChange={(e) => setShowPointsOfInterest(e.target.checked)}
                className="h-3 w-3 rounded border-[#EBEBEB] text-[#3FA9F5]"
              />
              <span className="font-medium text-gray-700">Puntos de Interés</span>
            </label>
          </div>
        </div>

        {/* Botón de dibujar ruta */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDrawingRouteChange(!isDrawingRoute);
            // Desactivar modo borrar si se activa dibujo
            if (!isDrawingRoute) {
              onErasingChange(false);
            }
          }}
          className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            isDrawingRoute
              ? "bg-[#3FA9F5] text-white hover:bg-[#3FA9F5]/90"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-[#EBEBEB]"
          }`}
        >
          {isDrawingRoute ? "Finalizar Dibujo" : "Dibujar Ruta"}
        </button>

        {/* Botón de goma de borrar */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onErasingChange(!isErasing);
            // Desactivar modo dibujo si se activa borrar
            if (!isErasing) {
              onDrawingRouteChange(false);
            }
          }}
          className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            isErasing
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-[#EBEBEB]"
          }`}
          title="Activar modo borrar para eliminar puntos de la ruta"
        >
          {isErasing ? "✕ Desactivar Borrar" : "🗑️ Borrar Puntos"}
        </button>
      </div>

      {/* Instrucciones */}
      <div className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-lg">
        {isErasing
          ? "Modo borrar activo: Haz clic en un punto de la ruta para eliminarlo"
          : isDrawingRoute
          ? "Haz clic en el mapa para agregar puntos a la ruta"
          : selectedPointId
          ? "Haz clic en el mapa para ubicar el punto de interés"
          : "Haz clic en el mapa para seleccionar el punto principal"}
      </div>
    </div>
  );
}
