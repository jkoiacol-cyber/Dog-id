"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = searchParams.get("slug");
  const secretId = searchParams.get("secret_id");
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"none" | "login" | "scan">("none");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (slug && secretId && !error) {
      setMode("scan"); // Vino de escanear un QR
    } else if (!slug && !secretId && !error) {
      setMode("login"); // Acceso directo sin QR
    }
  }, [slug, secretId, error]);

  const sendMagicLink = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    if (!res.ok) { alert("Error enviando el enlace"); return; }
    setSent(true);
  };

  // ── Pantalla de escaneo QR ──────────────────────────────────
  if (mode === "scan" && slug && secretId) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        {/* Iconos */}
        <div className="flex items-end gap-4 mb-6">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-stone-200">
            <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
          </svg>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-stone-200 mb-1">
            <path d="M12 2a3 3 0 0 0-3 3c0 1.5.8 3 2 4 .4.3.7.5 1 .5s.6-.2 1-.5c1.2-1 2-2.5 2-4a3 3 0 0 0-3-3z"/>
            <circle cx="7" cy="9" r="1.5"/><circle cx="17" cy="9" r="1.5"/>
            <circle cx="5" cy="14" r="1.5"/><circle cx="19" cy="14" r="1.5"/>
          </svg>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-stone-200">
            <path d="M12 5c-3.9 0-7 2.5-7 5.5 0 1.7.9 3.2 2.3 4.2L6 18h12l-1.3-3.3C18.1 13.7 19 12.2 19 10.5 19 7.5 15.9 5 12 5z"/>
          </svg>
        </div>

        <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Bienvenido</p>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-8">
          Dog‑id / Cat‑id
        </h1>

        <div className="w-full flex flex-col gap-3">
          {/* Propietario → login con secret_id para registrar/gestionar */}
          <button
            onClick={() => setMode("login")}
            className="w-full bg-stone-900 text-white text-center font-semibold py-4 rounded-2xl active:scale-95 active:bg-stone-700 transition-transform"
          >
            Soy propietario
          </button>

          {/* Encontré la mascota → directo al perfil público */}
          <button
            onClick={() => router.push(`/pets/${slug}`)}
            className="w-full bg-white border border-stone-200 text-stone-700 text-center font-semibold py-4 rounded-2xl active:scale-95 active:bg-stone-50 transition-transform"
          >
            He encontrado una mascota
          </button>
        </div>
      </div>
    );
  }

  // ── Pantalla de login ───────────────────────────────────────
  if (mode === "login") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="flex items-end gap-4 mb-6">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-stone-200">
            <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
          </svg>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-stone-200 mb-1">
            <path d="M12 2a3 3 0 0 0-3 3c0 1.5.8 3 2 4 .4.3.7.5 1 .5s.6-.2 1-.5c1.2-1 2-2.5 2-4a3 3 0 0 0-3-3z"/>
            <circle cx="7" cy="9" r="1.5"/><circle cx="17" cy="9" r="1.5"/>
            <circle cx="5" cy="14" r="1.5"/><circle cx="19" cy="14" r="1.5"/>
          </svg>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-stone-200">
            <path d="M12 5c-3.9 0-7 2.5-7 5.5 0 1.7.9 3.2 2.3 4.2L6 18h12l-1.3-3.3C18.1 13.7 19 12.2 19 10.5 19 7.5 15.9 5 12 5z"/>
          </svg>
        </div>

        <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Bienvenido</p>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">
          Dog‑id / Cat‑id
        </h1>
        <p className="text-sm text-stone-400 mb-8 text-center">
          Ingresa tu correo para gestionar las placas de tus mascotas.
        </p>

        {!sent ? (
          <div className="w-full flex flex-col gap-3">
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMagicLink()}
              className="w-full px-4 py-4 border border-stone-200 rounded-2xl text-stone-900 bg-white text-base focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
            <button
              onClick={sendMagicLink}
              className="w-full bg-stone-900 text-white font-semibold py-4 rounded-2xl active:scale-95 active:bg-stone-700 transition-transform"
            >
              Enviar enlace de acceso
            </button>
          </div>
        ) : (
          <div className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-5 text-center">
            <p className="text-stone-900 font-bold">¡Enlace enviado!</p>
            <p className="text-stone-500 text-sm mt-1">
              Revisa tu bandeja de entrada para iniciar sesión.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Error de QR ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-4">
          {error === "inactive_tag" && <>
            <p className="text-4xl">🚫</p>
            <h1 className="text-xl font-bold text-stone-900">Placa desactivada</h1>
            <p className="text-stone-500 text-sm">Contacta con el soporte si crees que es un error.</p>
          </>}
          {error === "pending_tag" && <>
            <p className="text-4xl">⏳</p>
            <h1 className="text-xl font-bold text-stone-900">Placa en período de baja</h1>
            <p className="text-stone-500 text-sm">Estará disponible próximamente.</p>
          </>}
          {error === "invalid_tag" && <>
            <p className="text-4xl">❌</p>
            <h1 className="text-xl font-bold text-stone-900">QR no válido</h1>
            <p className="text-stone-500 text-sm">Este QR no corresponde a ninguna placa registrada.</p>
          </>}
        </div>
      </div>
    );
  }

  return null;
}