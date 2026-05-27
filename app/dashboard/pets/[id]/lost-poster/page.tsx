"use client";

import { use, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
//import { supabaseClient as supabase } from "@/lib/supabaseClient";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";

export default function LostPosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pet, setPet] = useState<any>(null);
  const [qr, setQr] = useState("");

  const [isLost, setIsLost] = useState(false);
  const [lastLocation, setLastLocation] = useState("");
  const [lostMessage, setLostMessage] = useState("");
  const [reward, setReward] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);

  const posterRef = useRef<HTMLDivElement>(null);

  const DEFAULT_MESSAGE =
    "Por favor, si lo has visto o lo has encontrado, llámanos. Es un miembro más de nuestra familia y lo echamos mucho de menos 🐾❤️";

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("pets")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setPet(data);
        setIsLost(data.is_lost || false);
        setLastLocation(data.last_location || "");
        setLostMessage(data.lost_message || DEFAULT_MESSAGE);

        const publicUrl = `${window.location.origin}/pets/${data.slug}`;
        const qrData = await QRCode.toDataURL(publicUrl, { width: 200, margin: 1 });
        setQr(qrData);
      }

      setLoading(false);
    };

    load();
  }, [id]);

  // -----------------------------------------------------------------------
  //  GPS → dirección aproximada
  // -----------------------------------------------------------------------
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu dispositivo no permite obtener la ubicación.");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const addr = data.address;
          const street = addr.road || addr.pedestrian || addr.footway || "";
          const number = addr.house_number ? `, ${addr.house_number}` : "";
          const city = addr.city || addr.town || addr.village || addr.municipality || "";
          const readable = `${street}${number}${city ? `, ${city}` : ""}`;
          setLastLocation(readable || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } catch {
          setLastLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }

        setGettingLocation(false);
      },
      () => {
        alert("No se pudo obtener la ubicación.");
        setGettingLocation(false);
      },
      { timeout: 8000, maximumAge: 30000, enableHighAccuracy: false }
    );
  };

  // -----------------------------------------------------------------------
  //  GUARDAR
  // -----------------------------------------------------------------------
  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from("pets")
      .update({
        is_lost: isLost,
        last_location: lastLocation || null,
        lost_message: lostMessage || null,
        lost_since: isLost ? (pet.lost_since || new Date().toISOString()) : null,
      })
      .eq("id", id);
    setSaving(false);
    alert(isLost ? "✅ Modo perdido activado" : "✅ Cambios guardados");
  };

  // -----------------------------------------------------------------------
  //  DESCARGAR COMO IMAGEN
  // -----------------------------------------------------------------------
  const generateCanvas = async (): Promise<HTMLCanvasElement> => {
    const W = Math.min(600, window.innerWidth * 2);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // Cargar imagen de la mascota
    const petImg = await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = pet.photo_url || "https://placehold.co/600x400?text=Sin+foto";
    });

    // Cargar QR
    const qrImg = await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = qr;
    });

    // Calcular altura dinámica
    let H = 120; // cabecera
    H += 320;    // foto
    H += 100;    // nombre + especie
    if (lastLocation) H += 80;
    if (lostMessage) H += 80;
    if (reward) H += 60;
    H += 120;    // teléfono + QR + padding

    canvas.width = W;
    canvas.height = H;

    let y = 0;

    // Fondo blanco
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Borde rojo
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, W - 8, H - 8);

    // Cabecera roja
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(0, 0, W, 90);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🚨 ¡SE HA PERDIDO!", W / 2, 58);
    y = 90;

    // Foto centrada
    const imgSize = 280;
    const imgX = (W - imgSize) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(imgX, y + 16, imgSize, imgSize, 12);
    ctx.clip();
    ctx.drawImage(petImg, imgX, y + 16, imgSize, imgSize);
    ctx.restore();
    y += imgSize + 24;

    // Nombre
    ctx.fillStyle = "#1c1917";
    ctx.font = "bold 44px Arial";
    ctx.textAlign = "center";
    ctx.fillText(pet.name, W / 2, y + 44);
    y += 56;

    // Especie y sexo
    ctx.fillStyle = "#78716c";
    ctx.font = "18px Arial";
    const speciesText = `${pet.species === "dog" ? "🐶 Perro" : "🐱 Gato"}${pet.sex && pet.sex !== "unknown" ? ` · ${pet.sex === "male" ? "Macho" : "Hembra"}` : ""}`;
    ctx.fillText(speciesText, W / 2, y + 24);
    y += 40;

    // Última localización
    if (lastLocation) {
      ctx.fillStyle = "#fef2f2";
      ctx.beginPath();
      ctx.roundRect(40, y + 8, W - 80, 60, 10);
      ctx.fill();
      ctx.strokeStyle = "#fecaca";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText("VISTO POR ÚLTIMA VEZ EN", W / 2, y + 28);

      ctx.fillStyle = "#1c1917";
      ctx.font = "bold 15px Arial";
      ctx.fillText(lastLocation, W / 2, y + 52);
      y += 76;
    }

    // Mensaje
    if (lostMessage) {
      ctx.fillStyle = "#57534e";
      ctx.font = "italic 13px Arial";
      ctx.textAlign = "center";
      const maxWidth = W - 80;
      const words = `"${lostMessage}"`.split(" ");
      let line = "";
      let lineY = y + 20;
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > maxWidth && line !== "") {
          ctx.fillText(line.trim(), W / 2, lineY);
          line = word + " ";
          lineY += 20;
        } else {
          line = test;
        }
      }
      ctx.fillText(line.trim(), W / 2, lineY);
      y = lineY + 20;
    }

    // Recompensa
    if (reward) {
      ctx.fillStyle = "#fefce8";
      ctx.beginPath();
      ctx.roundRect(40, y + 8, W - 80, 44, 10);
      ctx.fill();
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#92400e";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`💰 Recompensa: ${reward}`, W / 2, y + 36);
      y += 60;
    }

    // Teléfono y QR
    y += 16;
    ctx.fillStyle = "#a8a29e";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "left";
    ctx.fillText("LLÁMANOS", 40, y + 16);

    ctx.fillStyle = "#1c1917";
    ctx.font = "bold 36px Arial";
    ctx.fillText(pet.phone || "—", 40, y + 56);

    if (pet.phone2) {
      ctx.fillStyle = "#57534e";
      ctx.font = "20px Arial";
      ctx.fillText(pet.phone2, 40, y + 80);
    }

    // QR
    ctx.drawImage(qrImg, W - 140, y, 110, 110);
    ctx.fillStyle = "#a8a29e";
    ctx.font = "9px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Escanea para ver la ficha", W - 85, y + 122);

    return canvas;
  };

  const handleDownload = async () => {
    try {
      const canvas = await generateCanvas();
      const link = document.createElement("a");
      link.download = `cartel-${pet.name.toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error(err);
      alert("Error generando la imagen.");
    }
  };

  const handlePrint = async () => {
    try {
      const canvas = await generateCanvas();
      const dataUrl = canvas.toDataURL("image/png");
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`
        <html>
          <head>
            <title>Cartel - ${pet.name}</title>
            <style>
              * { margin: 0; padding: 0; }
              html, body { width: 100%; height: 100%; }
              body { display: flex; justify-content: center; align-items: flex-start; }
              img {
                display: block;
                max-width: 100%;
                max-height: 100vh;
                width: auto;
                height: auto;
                page-break-inside: avoid;
              }
              @page { margin: 0; size: auto; }
              @media print {
                html, body { height: 100%; }
                img { max-height: 100%; width: auto; }
              }
            </style>
          </head>
          <body><img src="${dataUrl}" /></body>
        </html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 600);
    } catch (err) {
      console.error(err);
      alert("Error generando el cartel para imprimir.");
    }
  };

  if (loading) return <p className="p-6 text-center">Cargando...</p>;

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6 px-4">
    <button 
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/"); // Ruta de escape si el historial falla
        }
      }} 
      className="relative z-[100] cursor-pointer flex items-center gap-1 text-sm text-stone-500 hover:underline py-2 pr-4 -ml-1 touch-manipulation"
    >
      <span className="text-base">←</span> Volver
    </button>

      <h1 className="text-2xl font-black text-stone-800 text-center">
        🚨 Modo perdido — {pet.name}
      </h1>

      {/* Panel de configuración */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-sm">


        {/* Última localización */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Última localización conocida
          </label>

          <div className="flex items-center w-full border rounded-xl p-2 bg-white overflow-hidden">
            <input
              className="input-reset flex-1 min-w-0 px-2 py-1"
              placeholder="Ej: Calle Mayor 5, Madrid"
              value={lastLocation}
              onChange={(e) => setLastLocation(e.target.value)}
            />

            <button
              onClick={handleGetLocation}
              disabled={gettingLocation}
              className="ml-2 px-3 py-2 flex-shrink-0 bg-blue-600 text-white rounded-lg text-sm font-semibold flex-shrink-0 disabled:opacity-50"
            >
              {gettingLocation ? "..." : "📍 GPS"}
            </button>
          </div>
        </div>


        {/* Mensaje emocional */}
        <div>
          <label className="block text-sm font-semibold mb-1">Mensaje del cartel</label>
          <textarea
            className="w-full border rounded-xl p-3 text-sm"
            rows={3}
            value={lostMessage}
            onChange={(e) => setLostMessage(e.target.value)}
          />
          <button
            onClick={() => setLostMessage(DEFAULT_MESSAGE)}
            className="text-xs text-stone-400 hover:text-stone-600 mt-1"
          >
            Restablecer mensaje por defecto
          </button>
        </div>

        {/* Recompensa */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Recompensa <span className="text-stone-400 font-normal">(opcional)</span>
          </label>
          <input
            className="w-full border rounded-xl p-3 text-sm"
            placeholder="Ej: 100€"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
          />
        </div>

        {/* Activar / Desactivar modo perdido */}
        <div className="pt-4 border-t">
          <button
            onClick={async () => {
              const newValue = !isLost;
              setIsLost(newValue);
              setSaving(true);
              await supabase
                .from("pets")
                .update({
                  is_lost: newValue,
                  last_location: lastLocation || null,
                  lost_message: lostMessage || null,
                  lost_since: newValue ? (pet.lost_since || new Date().toISOString()) : null,
                })
                .eq("id", id);
              setSaving(false);
            }}
            disabled={saving}
            className={`w-full py-3 rounded-xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-50 ${
              isLost
                ? "bg-stone-400 hover:bg-stone-500"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {saving
              ? "Guardando..."
              : isLost
              ? "✅ Desactivar modo perdido"
              : "🚨 Activar modo perdido"}
          </button>

          {isLost && (
            <p className="text-xs text-stone-500 mt-2 text-center">
              La página pública muestra una alerta mientras esté activo.
            </p>
          )}
        </div>

      </div>
        

      {/* Cartel imprimible */}
      <div
        ref={posterRef}
        className="bg-white rounded-2xl shadow-xl border-4 border-red-500 overflow-visible"
        style={{ fontFamily: "Arial, sans-serif" }}
        >
        {/* Cabecera roja */}
        <div className="bg-red-600 text-white text-center py-5 px-4">
          <p className="text-4xl font-black tracking-wide">🚨 ¡SE HA PERDIDO!</p>
        </div>

        {/* Foto */}
        <div className="px-6 pt-5">
          <div className="w-full h-72 rounded-xl overflow-hidden bg-stone-100">
            <img
              src={pet.photo_url || "https://placehold.co/600x400?text=Sin+foto"}
              className="w-full h-full object-contain"
              alt={pet.name}
              crossOrigin="anonymous"
            />
          </div>
        </div>

        {/* Nombre y especie */}
        <div className="text-center mt-4 px-6">
          <h2 className="text-5xl font-black text-stone-900">{pet.name}</h2>
          <p className="text-stone-500 text-lg mt-1">
            {pet.species === "dog" ? "🐶 Perro" : "🐱 Gato"}
            {pet.sex && pet.sex !== "unknown" && ` · ${pet.sex === "male" ? "Macho" : "Hembra"}`}
          </p>
        </div>

        {/* Última ubicación */}
        {lastLocation && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <p className="text-xs font-black text-red-500 uppercase tracking-widest">Visto por última vez en</p>
            <p className="text-stone-800 font-semibold mt-1">{lastLocation}</p>
          </div>
        )}

        {/* Mensaje emocional */}
        {lostMessage && (
          <p className="mx-6 mt-4 text-center text-stone-600 text-sm italic leading-relaxed">
            "{lostMessage}"
          </p>
        )}

        {/* Recompensa */}
        {reward && (
          <div className="mx-6 mt-4 bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-center">
            <p className="text-yellow-700 font-black text-xl">💰 Recompensa: {reward}</p>
          </div>
        )}

        {/* Teléfono y QR */}
        <div className="mx-6 mt-5 mb-10 flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-black text-stone-400 uppercase tracking-widest mb-1">Llámanos</p>
            <p className="text-3xl font-black text-stone-900">{pet.phone || "—"}</p>
            {pet.phone2 && (
              <p className="text-lg font-semibold text-stone-600 mt-1">{pet.phone2}</p>
            )}
          </div>
        </div>

        {/* QR fuera del cartel para previsualización */}
        {qr && (
          <div className="mt-12 mb-8 flex flex-col items-center text-center">

            {/* Título superior */}
            <p className="text-[11px] font-black text-stone-400 uppercase tracking-widest mb-3">
              Código QR del perfil
            </p>

            {/* Contenedor del QR */}
            <div className="p-4 bg-white rounded-2xl shadow-md border border-stone-200">
              <img src={qr} className="w-36 h-36" alt="QR" />
            </div>

            {/* Subtítulo */}
            <p className="text-xs text-stone-500 mt-3 leading-tight">
              Escanéalo para ver la ficha completa<br />
              y contactar rápidamente
            </p>
          </div>
        )}
        
      {/* Botones de acción */}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handlePrint}
          className="py-3 bg-stone-800 text-white rounded-xl font-bold active:scale-95"
        >
          🖨️ Imprimir
        </button>
        <button
          onClick={handleDownload}
          className="py-3 bg-blue-600 text-white rounded-xl font-bold active:scale-95"
        >
          💾 Descargar imagen
        </button>
      </div>
    </div>
  );
}
