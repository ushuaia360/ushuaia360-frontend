"use client";

interface MapSatelliteToggleProps {
  useSatellite: boolean;
  onToggle: () => void;
  className?: string;
}

export default function MapSatelliteToggle({
  useSatellite,
  onToggle,
  className = "absolute bottom-2 right-2 z-[1000]",
}: MapSatelliteToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-lg border border-[#EBEBEB] bg-white/95 px-3 py-2 text-xs font-medium text-gray-700 shadow-lg transition-colors hover:bg-gray-50 ${className}`}
      title={useSatellite ? "Ver mapa callejero" : "Ver vista satélite"}
    >
      {useSatellite ? "Calles" : "Satélite"}
    </button>
  );
}
