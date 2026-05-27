"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const IconDog = () => (
  <svg viewBox="0 0 64 64" className="w-10 h-10" aria-hidden="true">
    <circle cx="32" cy="32" r="28" fill="#f5f5f5" />
    <circle cx="24" cy="28" r="3" fill="#333" />
    <circle cx="40" cy="28" r="3" fill="#333" />
    <path d="M24 40 Q32 46 40 40" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M16 18 Q20 10 26 16" fill="#f5f5f5" stroke="#333" strokeWidth="2" />
    <path d="M48 18 Q44 10 38 16" fill="#f5f5f5" stroke="#333" strokeWidth="2" />
  </svg>
);

const IconPaw = () => (
  <svg viewBox="0 0 64 64" className="w-10 h-10" aria-hidden="true">
    <circle cx="32" cy="38" r="10" fill="#f5e1c5" />
    <circle cx="22" cy="26" r="4" fill="#f5e1c5" />
    <circle cx="30" cy="22" r="4" fill="#f5e1c5" />
    <circle cx="38" cy="22" r="4" fill="#f5e1c5" />
    <circle cx="46" cy="26" r="4" fill="#f5e1c5" />
  </svg>
);

const IconCat = () => (
  <svg viewBox="0 0 64 64" className="w-10 h-10" aria-hidden="true">
    <circle cx="32" cy="32" r="24" fill="#f5f5f5" />
    <path d="M20 18 L24 10 L28 18" fill="#f5f5f5" stroke="#333" strokeWidth="2" />
    <path d="M36 18 L40 10 L44 18" fill="#f5f5f5" stroke="#333" strokeWidth="2" />
    <circle cx="26" cy="30" r="2.5" fill="#333" />
    <circle cx="38" cy="30" r="2.5" fill="#333" />
    <path d="M28 38 Q32 42 36 38" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const IconsRow = () => (
  <div className="flex justify-center gap-6 mb-8">
    {[<IconDog key="dog" />, <IconPaw key="paw" />, <IconCat key="cat" />].map((icon, i) => (
      <div key={i} className="w-16 h-16 rounded-full bg-[#f0f0f0] flex items-center justify-center">
        {icon}
      </div>
    ))}
  </div>
);

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
      setMode("scan");
    } else if (!slug && !secretId && !error) {
      setMode("login");
    }
  }, [slug, secretId, error]);

  const sendMagicLink = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) { alert("Error enviando el enlace"); return; }
    setSent(true);
  };

  // ── Pantalla QR escaneado ───────────────────────────────────
  if (mode === "scan" && slug && secretId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-[420px] px-6 py-8">
          <IconsRow />
          <div className="text-center mb-8">
            <p className="text-[1.1rem] font-medium text-stone-800 mb-1">Bienvenido</p>
            <h1 className="text-[1.8rem] font-bold text-stone-900">Dog‑id/Cat‑id</h1>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setMode("login")}
              className="w-full bg-[#111] text-white font-medium py-[14px] rounded-full text-base transition-all active:scale-[0.98] hover:bg-black hover:-translate-y-px"
            >
              Soy propietario
            </button>
            <button
              onClick={() => router.push(`/pets/${slug}`)}
              className="w-full bg-[#f3f3f3] text-[#333] font-medium py-[14px] rounded-full text-base transition-all active:scale-[0.98] hover:bg-[#e7e7e7] hover:-translate-y-px"
            >
              He encontrado una mascota
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Login ───────────────────────────────────────────────────
  if (mode === "login") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-[420px] px-6 py-8">
          <IconsRow />
          <div className="text-center mb-8">
            <p className="text-[1.1rem] font-medium text-stone-800 mb-1">Bienvenido</p>
            <h1 className="text-[1.8rem] font-bold text-stone-900 mb-2">Dog‑id/Cat‑id</h1>
            <p className="text-sm text-stone-400">
              Ingresa tu correo para gestionar las placas de tus mascotas.
            </p>
          </div>

          {!sent ? (
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMagicLink()}
                className="w-full px-4 py-[14px] border border-stone-200 rounded-full text-stone-900 bg-white text-base focus:outline-none focus:ring-2 focus:ring-stone-900 placeholder:text-stone-300"
              />
              <button
                onClick={sendMagicLink}
                className="w-full bg-[#111] text-white font-medium py-[14px] rounded-full text-base transition-all active:scale-[0.98] hover:bg-black hover:-translate-y-px"
              >
                Enviar enlace de acceso
              </button>
            </div>
          ) : (
            <div className="bg-[#f3f3f3] rounded-2xl p-5 text-center">
              <p className="text-stone-900 font-bold">¡Enlace enviado!</p>
              <p className="text-stone-500 text-sm mt-1">
                Revisa tu bandeja de entrada para iniciar sesión.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Errores de QR ───────────────────────────────────────────
  if (error) {
    const errors: Record<string, { icon: string; title: string; desc: string }> = {
      inactive_tag: { icon: "🚫", title: "Placa desactivada", desc: "Contacta con el soporte si crees que es un error." },
      pending_tag:  { icon: "⏳", title: "Placa en período de baja", desc: "Estará disponible próximamente." },
      invalid_tag:  { icon: "❌", title: "QR no válido", desc: "Este QR no corresponde a ninguna placa registrada." },
    };
    const e = errors[error] ?? errors["invalid_tag"];
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-[420px] text-center space-y-4">
          <IconsRow />
          <p className="text-4xl">{e.icon}</p>
          <h1 className="text-xl font-bold text-stone-900">{e.title}</h1>
          <p className="text-stone-500 text-sm">{e.desc}</p>
          <div className="bg-[#f3f3f3] rounded-2xl p-4">
            <a href="mailto:jko@dogidcatid.es" className="text-stone-600 font-semibold text-sm underline">
              jko@dogidcatid.es
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}