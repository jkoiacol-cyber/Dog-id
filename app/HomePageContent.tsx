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
  const [mode, setMode] = useState<"none" | "login">("none");
  const [sent, setSent] = useState(false);

  // 🔄 EFECTO DE CONTROL: Si no hay parámetros en la URL, activa el modo login por defecto
  useEffect(() => {
    if (!slug && !secretId && !error) {
      setMode("login");
    }
  }, [slug, secretId, error]);

  const sendMagicLink = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      alert("Error enviando el enlace");
      return;
    }

    setSent(true);
  };

  const tagErrorMessage = () => {
    if (error === "inactive_tag") {
      return (
        <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-xl p-4 text-center mb-6">
          <p className="text-2xl mb-2">🚫</p>
          <p className="text-red-700 font-bold text-sm">Placa desactivada</p>
          <p className="text-red-500 text-xs mt-1">
            Esta placa ha sido desactivada. Contacta con el soporte si crees que es un error.
          </p>
        </div>
      );
    }

    if (error === "pending_tag") {
      return (
        <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-xl p-4 text-center mb-6">
          <p className="text-2xl mb-2">⏳</p>
          <p className="text-amber-700 font-bold text-sm">Placa en período de baja</p>
          <p className="text-amber-500 text-xs mt-1">
            Esta placa está siendo procesada y estará disponible próximamente.
            Si es tuya, puedes volver a usarla en unos meses.
          </p>
        </div>
      );
    }

    if (error === "invalid_tag") {
      return (
        <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-xl p-4 text-center mb-6">
          <p className="text-2xl mb-2">❌</p>
          <p className="text-red-700 font-bold text-sm">QR no válido</p>
          <p className="text-red-500 text-xs mt-1">
            Este QR no corresponde a ninguna placa registrada.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start px-6 pt-12 pb-6 bg-white text-black">
      {/* Mensajes de error del QR si existieran */}
      {tagErrorMessage()}

      {/* Si el modo cambia a login o no hay parámetros, mostramos el acceso */}
      {mode === "login" && (
        <div className="w-full max-w-md flex flex-col items-center justify-center mt-10">
          <h1 className="text-2xl font-bold mb-2 text-center">¡Bienvenido a Dog ID / Cat ID!</h1>
          <p className="text-gray-500 text-sm mb-6 text-center">
            Ingresa tu correo para gestionar las placas de tus mascotas.
          </p>

          {!sent ? (
            <div className="w-full flex flex-col gap-3">
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-gray-50"
              />
              <button
                onClick={sendMagicLink}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Enviar enlace mágico ✨
              </button>
            </div>
          ) : (
            <div className="w-full bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-700 font-bold text-sm">¡Enlace enviado!</p>
              <p className="text-green-600 text-xs mt-1">
                Revisa tu bandeja de entrada para iniciar sesión de forma segura.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Si viene un slug válido (flujo normal de escaneo), podrías pintar algo extra aquí */}
      {slug && !error && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
          <p className="text-blue-700 font-medium">Procesando placa: <span className="font-bold">{slug}</span></p>
        </div>
      )}
    </div>
  );
}