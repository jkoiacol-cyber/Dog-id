"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const IconsRow = () => (
  <div className="flex justify-center">
    <img
      src="img/icons.png"
      alt="dog paw cat icons"
      style={{ width: "390px", opacity: 0.9, marginTop: "60px", marginBottom: "10px" }}
    />
  </div>
);

// Shared card wrapper matching the HTML's .container style
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full max-w-[420px] bg-white/85 backdrop-blur-sm px-8 py-8 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] text-center">
    {children}
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
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-5">
        <Card>
          <IconsRow />
          <h4 className="text-[1rem] font-medium text-stone-700 mb-1">Bienvenido</h4>
          <h1 className="text-[1.6rem] font-semibold text-stone-900 mb-7">Dog‑id/Cat‑id</h1>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setMode("login")}
              className="w-full bg-[#000] text-white font-semibold py-[16px] rounded-xl text-[1.1rem] transition-all active:scale-[0.98] hover:bg-[#222]"
            >
              Soy propietario
            </button>
            <button
              onClick={async () => {
                if (secretId) {
                  const { createClient } = await import("@supabase/supabase-js");
                  const sb = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                  );
                  const { data: pet } = await sb
                    .from("pets")
                    .select("slug")
                    .eq("tag_secret_id", secretId)
                    .is("deleted_at", null)
                    .single();

                  if (pet?.slug) {
                    router.push(`/pets/${pet.slug}`);
                  } else {
                    alert("Esta placa aún no tiene una mascota registrada.");
                  }
                } else {
                  router.push(`/pets/${slug}`);
                }
              }}
              className="w-full bg-[#e5e5e5] text-[#333] font-semibold py-[16px] rounded-xl text-[1.1rem] transition-all active:scale-[0.98] hover:bg-[#d5d5d5]"
            >
              He encontrado una mascota
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Login ───────────────────────────────────────────────────
  if (mode === "login") {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-5">
        <Card>
          <IconsRow />
          <h4 className="text-[1rem] font-medium text-stone-700 mb-1">Bienvenido</h4>
          <h1 className="text-[1.6rem] font-semibold text-stone-900 mb-2">Dog‑id/Cat‑id</h1>
          <p className="text-sm text-stone-400 mb-7">
            Ingresa tu correo para gestionar las placas de tus mascotas.
          </p>

          {!sent ? (
            <div className="flex flex-col gap-3 text-left">
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMagicLink()}
                className="w-full px-4 py-[14px] border border-stone-200 rounded-xl text-stone-900 bg-white text-base focus:outline-none focus:ring-2 focus:ring-stone-900 placeholder:text-stone-300"
              />
              <button
                onClick={sendMagicLink}
                className="w-full bg-[#000] text-white font-semibold py-[16px] rounded-xl text-[1.1rem] transition-all active:scale-[0.98] hover:bg-[#222]"
              >
                Enviar enlace de acceso
              </button>
            </div>
          ) : (
            <div className="bg-[#f3f3f3] rounded-xl p-5 text-center">
              <p className="text-stone-900 font-bold">¡Enlace enviado!</p>
              <p className="text-stone-500 text-sm mt-1">
                Revisa tu bandeja de entrada para iniciar sesión.
              </p>
            </div>
          )}
        </Card>
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
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-5">
        <Card>
          <IconsRow />
          <p className="text-4xl mb-2">{e.icon}</p>
          <h1 className="text-xl font-bold text-stone-900">{e.title}</h1>
          <p className="text-stone-500 text-sm mt-2 mb-4">{e.desc}</p>
          <div className="bg-[#f3f3f3] rounded-xl p-4">
            <a href="mailto:jko@dogidcatid.es" className="text-stone-600 font-semibold text-sm underline">
              jko@dogidcatid.es
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}