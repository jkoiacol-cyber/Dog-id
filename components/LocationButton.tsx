"use client";

import { useState } from "react";

export default function LocationButton({
  phone,
  petName,
  petSlug,
  label,
}: {
  phone: string;
  petName: string;
  petSlug: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu dispositivo no permite obtener la ubicación.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        // Guardar ubicación en Supabase
        fetch("/api/update-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pet_slug: petSlug, lat, lng }),
        }).catch(console.error);

        // Abrir WhatsApp inmediatamente sin esperar la API
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        const message = `Hola, he encontrado a ${petName} 🐾. Esta es mi ubicación:\n${mapsUrl}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);

        setLoading(false);
      },
      () => {
        alert("No se pudo obtener la ubicación. Comprueba los permisos.");
        setLoading(false);
      },
      {
        timeout: 6000,        // máximo 6 segundos esperando GPS
        maximumAge: 30000,    // acepta ubicación cacheada de hasta 30 segundos
        enableHighAccuracy: false, // más rápido, menos preciso (suficiente para esto)
      }
    );
  };

  return (
    <button
      onClick={handleSendLocation}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-pink-500 py-4 text-white font-bold shadow-lg active:scale-95 disabled:opacity-50"
    >
      📍 {loading ? "Obteniendo ubicación..." : label}
    </button>
  );
}