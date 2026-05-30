// app/dashboard/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import Link from "next/link";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  const { data: pets } = await supabase
    .from("pets")
    .select("*")
    .eq("owner_id", user?.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const isEmpty = !pets || pets.length === 0;

  return (
    <div className="pt-8 pb-6">

      {/* Estado vacío — estilo igual al welcome screen original */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center pt-16 pb-8 gap-6">
          {/* Iconos perro / huella / gato */}
          <img
            src="/public/img/icons.png"
            alt="dog paw cat icons"
            style={{ width: "220px", opacity: 0.9 }}
          />

          <div className="text-center">
            <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Bienvenido</p>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Dog‑id / Cat‑id</h2>
          </div>

          {/* Botones estilo original */}
          <div className="w-full flex flex-col gap-3 mt-2">
            <Link
              href="/dashboard/pets/scan"
              className="w-full bg-stone-900 text-white text-center font-semibold py-4 rounded-2xl active:scale-95 active:bg-stone-700 transition-transform"
            >
              Añadir mascota
            </Link>
            {profile?.role === "admin" && (
              <Link
                href="/admin/generate"
                className="w-full bg-white border border-stone-200 text-stone-700 text-center font-semibold py-4 rounded-2xl active:scale-95 active:bg-stone-50 transition-transform"
              >
                Admin QR
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Lista de mascotas */}
      {!isEmpty && (
        <>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">Mis mascotas</h2>
            <div className="flex gap-2">
              {profile?.role === "admin" && (
                <Link
                  href="/admin/generate"
                  className="rounded-xl bg-stone-100 text-stone-700 px-4 py-2 text-sm font-semibold active:scale-95 transition-transform"
                >
                  Admin QR
                </Link>
              )}
              <Link
                href="/dashboard/pets/scan"
                className="rounded-xl bg-stone-900 text-white px-4 py-2 text-sm font-semibold active:scale-95 transition-transform"
              >
                + Añadir
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {pets?.map((pet) => (
              <div
                key={pet.id}
                className={`bg-white rounded-2xl overflow-hidden ${
                  pet.is_lost
                    ? "ring-2 ring-red-500"
                    : "border border-stone-100 shadow-sm"
                }`}
              >
                {/* Foto + info */}
                <div className="flex items-center gap-4 p-4">
                  <div
                    className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0"
                    style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)" }}
                  >
                    <img
                      src={pet.photo_url || "https://placehold.co/200x200?text=🐾"}
                      className="w-full h-full object-cover"
                      alt={pet.name}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-stone-900 truncate">{pet.name}</h3>
                    <p className="text-sm text-stone-400 mt-0.5">
                      {pet.species === "dog" ? "Perro" : "Gato"}
                    </p>
                    {pet.is_lost && (
                      <span className="inline-block mt-1.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
                        Perdido
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="grid grid-cols-2 gap-px bg-stone-100 border-t border-stone-100">
                  <Link
                    href={`/dashboard/pets/${pet.id}/edit`}
                    className="bg-white py-3.5 text-center text-sm font-semibold text-stone-700 active:bg-stone-50 transition-colors"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/dashboard/pets/${pet.id}/passport`}
                    className="bg-white py-3.5 text-center text-sm font-semibold text-stone-700 active:bg-stone-50 transition-colors"
                  >
                    Pasaporte
                  </Link>
                  {pet.slug && (
                    <Link
                      href={`/pets/${pet.slug}`}
                      target="_blank"
                      className="bg-white py-3.5 text-center text-sm font-semibold text-stone-700 active:bg-stone-50 transition-colors"
                    >
                      Ver QR
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/pets/${pet.id}/lost-poster`}
                    className="bg-white py-3.5 text-center text-sm font-semibold text-red-500 active:bg-red-50 transition-colors"
                  >
                    Modo perdido
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}