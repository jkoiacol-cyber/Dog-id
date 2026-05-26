// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
//import { supabaseClient as supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // Leer el hash de la URL manualmente
      const hash = window.location.hash;
      
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (!error) {
            router.replace("/dashboard");
            return;
          }
        }
      }

      // Fallback: verificar sesión existente
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-stone-500">Iniciando sesión...</p>
    </div>
  );
}