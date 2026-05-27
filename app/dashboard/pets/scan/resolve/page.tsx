"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * /dashboard/pets/scan/resolve?token=Xk9mP2
 *
 * Usado exclusivamente desde el scanner interno de la app (ScanPetQR).
 * Resuelve el token → va directo a /dashboard/pets/new saltándose HomePage.
 *
 * Flujo cámara nativa del móvil → /t/[token] → HomePage (dos opciones)
 * Flujo scanner de la app       → aquí       → /dashboard/pets/new directo
 */
export const dynamic = "force-dynamic";

export default function ScanResolvePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      router.replace("/dashboard");
      return;
    }

    const resolve = async () => {
      const { data: tag, error } = await supabaseClient
        .from("tags")
        .select("slug, secret_id")
        .eq("token", token)
        .single();

      if (error || !tag) {
        alert("Esta placa no existe o no es válida.");
        router.replace("/dashboard");
        return;
      }

      // Ir directo al formulario de nueva mascota
      router.replace(
        `/dashboard/pets/new?qr=${tag.secret_id}&slug=${tag.slug}`
      );
    };

    resolve();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-stone-500 font-medium">Cargando placa...</p>
      </div>
    </div>
  );
}
