"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const hash = window.location.hash;

    if (!hash) {
      // Sin hash — verificar si ya hay sesión
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Llamar al endpoint para sincronizar la sesión con cookies SSR
          fetch("/api/auth/set-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
          }).then(() => router.replace("/dashboard"));
        } else {
          setError(true);
        }
      });
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setError(true);
      return;
    }

    // Sincronizar tokens con cookies SSR via API route
    fetch("/api/auth/set-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token, refresh_token }),
    })
      .then((res) => {
        if (res.ok) {
          router.replace("/dashboard");
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-red-500">Error al iniciar sesión. <a href="/" className="underline">Volver</a></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-stone-500">Iniciando sesión...</p>
    </div>
  );
}