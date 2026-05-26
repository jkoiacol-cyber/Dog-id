"use client";

import { useState } from "react";
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
    <div className="relative min-h-screen flex flex-col items-center justify-start px-6 pt-19 pb-6 bg-white">
      {/* ... TODO TU JSX EXACTO ... */}
    </div>
  );
}
