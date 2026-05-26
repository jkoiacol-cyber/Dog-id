// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Supabase detecta automáticamente el hash y establece la sesión
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/dashboard");
      } else if (event === "SIGNED_OUT" || !session) {
        // Esperar un momento antes de redirigir por si tarda
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              router.replace("/dashboard");
            } else {
              router.replace("/?error=auth_failed");
            }
          });
        }, 2000);
      }
    });

    // También intentar leer el hash directamente como fallback
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (!error) {
            router.replace("/dashboard");
          }
        });
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-stone-500">Iniciando sesión...</p>
    </div>
  );
}