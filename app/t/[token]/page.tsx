"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type TagState =
  | "loading"
  | "not_found"
  | "inactive_expired"   // caducada, dentro de los 3 meses de gracia
  | "inactive_permanent" // desactivada por admin sin caducidad
  | "pending"            // mascota borrada, esperando limpieza
  | "ok";

export default function TokenRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  const [state, setState] = useState<TagState>("loading");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [graceDeadline, setGraceDeadline] = useState<Date | null>(null);

  useEffect(() => {
    if (!token) { router.replace("/"); return; }

    const resolve = async () => {
      const { data: tag, error } = await supabaseClient
        .from("tags")
        .select("slug, secret_id, status, pet_id, has_expiry, expires_at")
        .eq("token", token)
        .single();

      if (error || !tag) { setState("not_found"); return; }

      // Placa en período de baja (mascota borrada, esperando 3 meses)
      if (tag.status === "pending") { setState("pending"); return; }

      // Placa desactivada
      if (tag.status === "inactive") {
        if (tag.has_expiry && tag.expires_at) {
          // Calcular fecha límite de gracia (expires_at + 3 meses)
          const expired = new Date(tag.expires_at);
          const grace = new Date(tag.expires_at);
          grace.setMonth(grace.getMonth() + 3);
          // Si aún estamos dentro del período de gracia
          if (new Date() < grace) {
            setExpiresAt(expired);
            setGraceDeadline(grace);
            setState("inactive_expired");
            return;
          }
        }
        setState("inactive_permanent");
        return;
      }

      // Placa activa → HomePage gestiona los dos casos
      router.replace(`/?slug=${tag.slug}&secret_id=${tag.secret_id}`);
    };

    resolve();
  }, [token]);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  // -------------------------------------------------------------
  //  LOADING
  // -------------------------------------------------------------
  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-500 font-medium">Cargando placa...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  //  PLACA NO ENCONTRADA
  // -------------------------------------------------------------
  if (state === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <p className="text-5xl">❌</p>
          <h1 className="text-xl font-bold text-stone-900">QR no válido</h1>
          <p className="text-stone-500 text-sm">
            Este QR no corresponde a ninguna placa registrada.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  //  PLACA CADUCADA — dentro del período de gracia (3 meses)
  // -------------------------------------------------------------
  if (state === "inactive_expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <p className="text-5xl">🔴</p>
          <h1 className="text-xl font-bold text-stone-900">Tu placa ha caducado</h1>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-sm text-red-700">
              <strong>Fecha de caducidad:</strong>{" "}
              {expiresAt ? formatDate(expiresAt) : "—"}
            </p>
            <p className="text-sm text-red-700">
              <strong>Límite para renovar:</strong>{" "}
              {graceDeadline ? formatDate(graceDeadline) : "—"}
            </p>
          </div>

          <p className="text-stone-500 text-sm">
            Renueva tu contrato antes de esa fecha para recuperar todos
            los datos de tu mascota.
          </p>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-1">
            <p className="text-sm font-bold text-stone-700">Contacta con nosotros:</p>
            <a
              href="mailto:jko@dogidcatid.es"
              className="text-blue-600 font-semibold text-sm underline"
            >
              jko@dogidcatid.es
            </a>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  //  PLACA DESACTIVADA POR ADMIN (sin caducidad o fuera de gracia)
  // -------------------------------------------------------------
  if (state === "inactive_permanent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <p className="text-5xl">🚫</p>
          <h1 className="text-xl font-bold text-stone-900">Placa desactivada</h1>
          <p className="text-stone-500 text-sm">
            Esta placa ha sido desactivada. Si crees que es un error,
            contacta con nosotros.
          </p>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <a
              href="mailto:hola@dogidcatid.es"
              className="text-blue-600 font-semibold text-sm underline"
            >
              jko@dogidcatid.es
            </a>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  //  PLACA EN PERÍODO DE BAJA
  // -------------------------------------------------------------
  if (state === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <p className="text-5xl">⏳</p>
          <h1 className="text-xl font-bold text-stone-900">Placa en período de baja</h1>
          <p className="text-stone-500 text-sm">
            Esta placa está siendo procesada. Si es tuya, puedes volver a
            usarla próximamente o contactar con nosotros.
          </p>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <a
              href="mailto:jko@dogidcatid.es"
              className="text-blue-600 font-semibold text-sm underline"
            >
              jko@dogidcatid.es
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
