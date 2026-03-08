"use client";

import { useEffect, useRef, useState } from "react";

interface PanoramaViewerProps {
  imageUrl: string;
  onClose: () => void;
}

export default function PanoramaViewer({
  imageUrl,
  onClose,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let pannellum: any = null;

    const loadPannellum = async () => {
      try {
        // Cargar Pannellum desde CDN si no está disponible
        if (!(window as any).pannellum) {
          // Cargar CSS
          if (!document.getElementById("pannellum-css")) {
            const link = document.createElement("link");
            link.id = "pannellum-css";
            link.rel = "stylesheet";
            link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
            document.head.appendChild(link);
          }

          // Cargar JS
          await new Promise<void>((resolve, reject) => {
            if ((window as any).pannellum) {
              resolve();
              return;
            }

            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Pannellum"));
            document.head.appendChild(script);
          });
        }

        pannellum = (window as any).pannellum;

        // Limpiar contenedor
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        // Inicializar Pannellum
        viewerRef.current = pannellum.viewer(containerRef.current, {
          type: "equirectangular",
          panorama: imageUrl,
          autoLoad: true,
          autoRotate: 0,
          autoRotateInactivityDelay: 2000,
          autoRotateStopDelay: 0,
          showControls: true,
          showFullscreenCtrl: true,
          showZoomCtrl: true,
          keyboardZoom: true,
          mouseZoom: true,
          doubleClickZoom: true,
          draggable: true,
          disableKeyboardCtrl: false,
          crossOrigin: "anonymous",
          hfov: 100,
          minHfov: 50,
          maxHfov: 120,
          pitch: 0,
          yaw: 0,
          compass: true,
          preview: "",
          previewTitle: "",
          previewAuthor: "",
          title: "",
          author: "",
          orientationOnByDefault: false,
          hotSpots: [],
          basePath: "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/",
        });

        setIsLoaded(true);
      } catch (err) {
        console.error("Error loading Pannellum:", err);
        setError("Error al cargar el visualizador 360°");
      }
    };

    loadPannellum();

    return () => {
      // Limpiar el viewer cuando el componente se desmonte
      if (viewerRef.current && typeof viewerRef.current.destroy === "function") {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          // Ignorar errores al destruir
        }
      }
      viewerRef.current = null;
    };
  }, [imageUrl]);

  return (
    <div className="relative h-full w-full bg-black">
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ minHeight: "400px" }}
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="text-center text-white">
            <p className="mb-2 text-sm font-medium">{error}</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-white/20 px-4 py-2 text-sm hover:bg-white/30"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white mx-auto"></div>
            <p className="text-sm">Cargando panorama 360°...</p>
          </div>
        </div>
      )}

      {/* Botón de cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-lg bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        aria-label="Cerrar"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Instrucciones */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/50 px-4 py-2 text-xs text-white">
        Arrastra para rotar • Rueda del mouse para zoom • Doble clic para zoom
      </div>
    </div>
  );
}
