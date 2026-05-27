"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";
export const dynamic = "force-dynamic";

function generateToken(length = 4): string {
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % 62]).join("");
}

type Tab = "generate" | "manage";

type TagRecord = {
  id: string;
  token: string | null;
  slug: string;
  status: string;
  has_expiry: boolean;
  expires_at: string | null;
  sold_at: string | null;
  pet_id: string | null;
  pet?: {
    name: string;
    deleted_at: string | null;
    email: string | null;
    owner?: { id: string } | null;
  } | null;
  owner_email?: string | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:   { label: "Activa",      color: "bg-emerald-100 text-emerald-700" },
  inactive: { label: "Desactivada", color: "bg-red-100 text-red-700"         },
  pending:  { label: "En baja",     color: "bg-amber-100 text-amber-700"     },
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });
};

// -------------------------------------------------------------
//  PÁGINA PRINCIPAL
// -------------------------------------------------------------
export default function AdminGeneratePage() {
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  return (
    <div className="max-w-xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold text-stone-900 mb-6">Placas QR (Admin)</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-stone-100 p-1 rounded-xl">
        {(["generate", "manage"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              activeTab === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
            }`}
          >
            {t === "generate" ? "Generar placa" : "Gestionar placas"}
          </button>
        ))}
      </div>

      {activeTab === "generate" && <GenerateTab />}
      {activeTab === "manage"   && <ManageTab />}
    </div>
  );
}

// -------------------------------------------------------------
//  TAB: GENERAR PLACA
// -------------------------------------------------------------
function GenerateTab() {
  const [hasExpiry, setHasExpiry] = useState(false);
  const [generated, setGenerated] = useState<{
    slug: string; secretId: string; token: string;
    qrDataUrl: string; reused: boolean;
  } | null>(null);

  const generateQR = async () => {
    let slug = "", secretId = "", token = "";
    let reused = false;

    // PASO 1: Placa libre con token activa
    const { data: freeWithToken } = await supabase
      .from("tags")
      .select("id, slug, secret_id, token")
      .is("pet_id", null)
      .not("token", "is", null)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1).single();

    if (freeWithToken) {
      // Resetear has_expiry según lo que el admin eligió ahora
      await supabase.from("tags")
        .update({ has_expiry: hasExpiry, expires_at: null, sold_at: null })
        .eq("id", freeWithToken.id);
      slug = freeWithToken.slug;
      secretId = freeWithToken.secret_id;
      token = freeWithToken.token;
      reused = true;
    } else {
      // PASO 2: Placa libre sin token
      const { data: freeWithoutToken } = await supabase
        .from("tags")
        .select("id, slug, secret_id")
        .is("pet_id", null).is("token", null).eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1).single();

      if (freeWithoutToken) {
        let done = false;
        while (!done) {
          token = generateToken(4);
          const { error } = await supabase.from("tags")
            .update({ token, has_expiry: hasExpiry, expires_at: null, sold_at: null })
            .eq("id", freeWithoutToken.id);
          if (!error) done = true;
          else if (error.code !== "23505") { alert("Error: " + error.message); return; }
        }
        slug = freeWithoutToken.slug;
        secretId = freeWithoutToken.secret_id;
        reused = true;
      } else {
        // PASO 3: Crear fila nueva
        secretId = crypto.randomUUID();
        slug = `tag-${Date.now()}`;
        let done = false;
        while (!done) {
          token = generateToken(4);
          const { error } = await supabase.from("tags").insert({
            slug, secret_id: secretId, token, status: "active", has_expiry: hasExpiry,
          });
          if (!error) done = true;
          else if (error.code !== "23505") { alert("Error: " + error.message); return; }
        }
      }
    }

    // QR con error correction L → mínima densidad, ideal para grabado láser
    //const url = `https://dogidcatid.es/t/${token}`;
    const url = `https://www.dogid.es/t/${token}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: "L",
      color: { dark: "#000000", light: "#ffffff" },
    });

    setGenerated({ slug, secretId, token, qrDataUrl, reused });
  };

  return (
    <div className="space-y-6">
      {/* Opción caducidad */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
        <p className="text-sm font-bold text-stone-700 mb-3">Tipo de placa</p>
        <div className="flex gap-3">
          <button
            onClick={() => setHasExpiry(false)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
              !hasExpiry
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 text-stone-500"
            }`}
          >
            Sin caducidad
          </button>
          <button
            onClick={() => setHasExpiry(true)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
              hasExpiry
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 text-stone-500"
            }`}
          >
            5 años
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-2">
          {hasExpiry
            ? "⏱ La caducidad empieza cuando el cliente registra su primera mascota."
            : "♾️ La placa no caduca nunca."}
        </p>
      </div>

      <button
        onClick={generateQR}
        className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold active:scale-95"
      >
        Generar nueva placa QR
      </button>

      {generated && (
        <div className="p-4 border rounded-xl bg-white shadow-sm">
          <h2 className="text-xl font-bold text-stone-800 mb-1">Nueva placa generada</h2>

          {generated.reused && (
            <p className="text-xs text-emerald-600 font-semibold mb-3">
              ♻️ Placa reutilizada (estaba libre)
            </p>
          )}

          <img
            src={generated.qrDataUrl}
            alt="QR generado"
            className="w-64 h-64 mx-auto mb-4 border rounded-xl"
          />

          <p className="text-sm text-stone-700"><strong>Token QR:</strong> {generated.token}</p>
          <p className="text-sm text-stone-700"><strong>Slug público:</strong> {generated.slug}</p>
          <p className="text-sm text-stone-700"><strong>ID oculto:</strong> {generated.secretId}</p>
          <p className="text-sm text-stone-700">
            <strong>Caducidad:</strong> {hasExpiry ? "5 años desde activación" : "Sin caducidad"}
          </p>

          <a
            href={generated.qrDataUrl}
            download={`placa-${generated.slug}.png`}
            className="block mt-4 bg-blue-600 text-white text-center py-3 rounded-xl font-semibold"
          >
            Descargar QR
          </a>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
//  TAB: GESTIONAR PLACAS
// -------------------------------------------------------------
function ManageTab() {
  const [searchEmail, setSearchEmail] = useState("");
  const [results, setResults] = useState<TagRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!searchEmail.trim()) return;
    setLoading(true);
    setSearched(true);

    // Buscar mascotas por correo de cuenta (auth) o correo de contacto (pets.email)
    // La relación placa↔mascota va por pets.tag_secret_id = tags.slug
    const { data: petsData } = await supabase
      .from("pets")
      .select(`
        id, name, email, deleted_at, tag_secret_id, owner_id,
        owner:owners(id)
      `)
      .or(`email.ilike.%${searchEmail.trim()}%`)
      .is("deleted_at", null);

    if (!petsData || petsData.length === 0) {
      // Intentar también por owner_id buscando en auth via owners
      // (cuando pets.email está vacío pero el correo de cuenta coincide)
      const { data: ownerPets } = await supabase
        .from("pets")
        .select(`
          id, name, email, deleted_at, tag_secret_id, owner_id
        `)
        .is("deleted_at", null);

      // Filtrar client-side por correo de cuenta no es posible sin RPC
      // Mostramos mensaje orientativo
      setResults([]);
      setLoading(false);
      return;
    }

    // Para cada mascota, buscar su placa via tag_secret_id
    const slugs = petsData
      .map((p: any) => p.tag_secret_id)
      .filter(Boolean);

    let tagsData: any[] = [];
    if (slugs.length > 0) {
      const { data: tags } = await supabase
        .from("tags")
        .select("id, token, slug, status, has_expiry, expires_at, sold_at, pet_id")
        .in("slug", slugs);
      tagsData = tags || [];
    }

    // Combinar mascotas con sus placas
    const combined = petsData.map((pet: any) => {
      const tag = tagsData.find((t: any) => t.slug === pet.tag_secret_id);
      return {
        id: tag?.id || pet.id,
        token: tag?.token || null,
        slug: tag?.slug || pet.tag_secret_id || null,
        status: tag?.status || null,
        has_expiry: tag?.has_expiry || false,
        expires_at: tag?.expires_at || null,
        sold_at: tag?.sold_at || null,
        pet_id: tag?.pet_id || null,
        pet: {
          name: pet.name,
          deleted_at: pet.deleted_at,
          email: pet.email,
        },
        _tag_id: tag?.id || null,
        _pet_id: pet.id,
      };
    });

    setResults(combined as any[]);
    setLoading(false);
  };

  const deactivate = async (tagId: string) => {
    if (!confirm("¿Desactivar esta placa? El cliente no podrá usarla.")) return;
    await supabase.from("tags")
      .update({ status: "inactive", pet_id: null }).eq("id", tagId);
    search();
  };

  const reactivateAndRenew = async (tagId: string, petId: string | null) => {
    if (!confirm("¿Reactivar y renovar 5 años desde hoy?")) return;
    const newExpiry = new Date();
    newExpiry.setFullYear(newExpiry.getFullYear() + 5);
    await supabase.from("tags").update({
      status: "active",
      expires_at: newExpiry.toISOString(),
      sold_at: new Date().toISOString(),
    }).eq("id", tagId);

    // Recuperar mascota si estaba en soft delete
    if (petId) {
      await supabase.from("pets")
        .update({ deleted_at: null }).eq("id", petId);
    }
    search();
  };

  const reactivatePermanent = async (tagId: string) => {
    if (!confirm("¿Reactivar esta placa sin caducidad?")) return;
    await supabase.from("tags").update({
      status: "active",
      has_expiry: false,
      expires_at: null,
    }).eq("id", tagId);
    search();
  };

  const freeAndReassign = async (tagId: string) => {
    if (!confirm("¿Liberar esta placa para reasignarla? Se desvinculará del cliente actual.")) return;
    await supabase.from("tags").update({
      status: "active",
      pet_id: null,
      expires_at: null,
      sold_at: null,
    }).eq("id", tagId);
    search();
  };

  // Generar QR de una placa existente para reimprimir
  const reprintQR = async (token: string) => {
    // const url = `https://dogidcatid.es/t/${token}`;
    const url = `https://www.dogid.es/t/${token}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: "L",
      color: { dark: "#000000", light: "#ffffff" },
    });
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `placa-${token}.png`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Búsqueda por email */}
      <div className="flex gap-2">
        <input
          className="flex-1 border border-stone-300 rounded-xl p-3 text-stone-900 text-sm"
          placeholder="Correo del cliente..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button
          onClick={search}
          className="px-5 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm active:scale-95"
        >
          Buscar
        </button>
      </div>

      {loading && (
        <div className="text-center py-8 text-stone-400">Buscando...</div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-8 text-stone-400">
          No se encontraron registros para ese correo.
        </div>
      )}

      {(results as any[]).map((item, idx) => {
        const pet = item.pet as any;
        const hasTag = !!item._tag_id;
        const statusInfo = item.status ? (STATUS_LABELS[item.status] || STATUS_LABELS.active) : null;
        const isExpired = item.has_expiry && item.expires_at && new Date(item.expires_at) < new Date();

        return (
          <div key={idx} className="border border-stone-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
            {/* Cabecera */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-stone-900 text-xl">
                {item.token || "sin token"}
              </span>
              {statusInfo && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              )}
              {!hasTag && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-stone-100 text-stone-400">
                  Placa antigua sin QR
                </span>
              )}
              {item.has_expiry && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  isExpired ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                }`}>
                  {isExpired ? "Caducada" : "5 años"}
                </span>
              )}
              {hasTag && !item.has_expiry && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-stone-100 text-stone-500">
                  Sin caducidad
                </span>
              )}
            </div>

            {/* Info */}
            <div className="text-xs text-stone-500 space-y-1">
              {pet?.name && (
                <p><strong className="text-stone-700">Mascota:</strong> 🐾 {pet.name}
                  {pet.deleted_at && <span className="text-amber-500 ml-1">(borrada, en espera)</span>}
                </p>
              )}
              {pet?.email && <p><strong className="text-stone-700">Email:</strong> {pet.email}</p>}
              {item.slug && <p><strong className="text-stone-700">Slug:</strong> {item.slug}</p>}
              {item.sold_at && <p><strong className="text-stone-700">Activada:</strong> {formatDate(item.sold_at)}</p>}
              {item.expires_at && <p><strong className="text-stone-700">Caduca:</strong> {formatDate(item.expires_at)}</p>}
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2 pt-1">
              {/* Reimprimir si tiene token */}
              {item.token && (
                <button
                  onClick={() => reprintQR(item.token!)}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold"
                >
                  🖨️ Reimprimir QR
                </button>
              )}

              {/* Acciones solo si tiene placa en BD */}
              {hasTag && (
                <>
                  {item.status === "active" && (
                    <button
                      onClick={() => deactivate(item._tag_id)}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold"
                    >
                      Desactivar
                    </button>
                  )}

                  {(item.status === "inactive" || isExpired) && (
                    <button
                      onClick={() => reactivateAndRenew(item._tag_id, item._pet_id)}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold"
                    >
                      ✅ Renovar 5 años
                    </button>
                  )}

                  {item.status === "inactive" && (
                    <>
                      <button
                        onClick={() => reactivatePermanent(item._tag_id)}
                        className="px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold"
                      >
                        ♾️ Sin caducidad
                      </button>
                      <button
                        onClick={() => freeAndReassign(item._tag_id)}
                        className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold"
                      >
                        ♻️ Liberar
                      </button>
                    </>
                  )}

                  {item.status === "pending" && (
                    <button
                      onClick={() => reactivatePermanent(item._tag_id)}
                      className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold"
                    >
                      Liberar ahora
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
