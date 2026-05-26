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

  return (
    <div className="py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-stone-800">Mis mascotas</h2>

        <div className="flex items-center gap-3">
          {/* BOTÓN ADMIN SOLO SI EL USUARIO ES ADMIN */}
          {profile?.role === "admin" && (
            <Link
              href="/admin/generate"
              className="rounded-xl bg-blue-600 text-white px-4 py-2 font-semibold active:scale-95 active:bg-blue-700"
            >
              Admin QR
            </Link>
          )}

          {/* BOTÓN AÑADIR MASCOTA */}
          <Link
            href="/dashboard/pets/scan"
            className="rounded-xl bg-stone-900 text-white px-4 py-2 font-semibold active:scale-95 active:bg-stone-700"
          >
            + Añadir
          </Link>
        </div>
      </div>

      {(!pets || pets.length === 0) && (
        <p className="text-stone-500 text-center mt-10">
          Aún no tienes mascotas registradas.
        </p>
      )}

      <div className="space-y-5">
        {pets?.map((pet) => (
        <div
          key={pet.id}
          className={`
            bg-white p-5 rounded-2xl shadow-md 
            ${pet.is_lost ? "border-[3px] border-red-500" : "border border-stone-200"}
            space-y-4
          `}
        >
            {/* Foto + nombre */}
            <div className="flex items-center gap-4">
              <div 
                className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0"
                style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)" }}>
                <img
                  src={pet.photo_url || "https://placehold.co/200x200?text=🐾"}
                  className="w-full h-full object-cover"
                  alt={pet.name}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-stone-900 truncate">
                  {pet.name}
                </h3>
                <p className="text-sm text-stone-500">
                  {pet.species === "dog" ? "🐶 Perro" : "🐱 Gato"}
                </p>

                {pet.is_lost && (
                  <span className="inline-block mt-2 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                    🚨 Perdido
                  </span>
                )}
              </div>
            </div>

            {/* Acciones grandes y táctiles */}
            <div className="grid grid-cols-2 gap-3 text-center text-sm font-semibold">
              <Link
                href={`/dashboard/pets/${pet.id}/edit`}
                className="py-3 rounded-xl bg-stone-100 text-stone-700 active:scale-95 active:bg-stone-200"
              >
                ✏️ Editar
              </Link>

              <Link
                href={`/dashboard/pets/${pet.id}/passport`}
                className="py-3 rounded-xl bg-stone-100 text-stone-700 active:scale-95 active:bg-stone-200"
              >
                📘 Pasaporte
              </Link>

              {pet.slug && (
                <Link
                  href={`/pets/${pet.slug}`}
                  target="_blank"
                  className="py-3 rounded-xl bg-blue-50 text-blue-600 active:scale-95 active:bg-blue-100"
                >
                  🔗 Ver QR
                </Link>
              )}

              <Link
                href={`/dashboard/pets/${pet.id}/lost-poster`}
                className="py-3 rounded-x1 bg-red-50 text-red-600 active:scale-95 active:bg-red-100"
              >
                🚨 Modo perdido
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
