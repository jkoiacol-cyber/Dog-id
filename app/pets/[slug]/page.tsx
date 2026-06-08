//C:\Users\nikom\Desktop\Proyecto_Dog-id\dog-id\app\pets\[slug]\page.tsx
import { supabase } from "@/lib/supabase";
import LocationButton from "@/components/LocationButton";
export const revalidate = 0;

export default async function PublicPetPage(
  props: {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ lang?: string }>;
  }
) {
  const { slug } = await props.params;
  const { lang = "es" } = (await props.searchParams) || {};

  const t = {
    es: {
      lost: "¡Mascota perdida!",
      lastLocation: "Última localización",
      notFoundTitle: "Mascota no encontrada",
      tutors: "TUTORES",
      callOwner: "Llamar",
      callOwner2: "Llamar (2º contacto)",
      whatsapp: "WhatsApp",
      shareLocation: "Enviar mi ubicación",
      address: "Dirección",
      chip: "Chip",
      private: "Privado",
    },
    en: {
      lost: "Lost pet!",
      lastLocation: "Last known location",
      notFoundTitle: "Pet not found",
      tutors: "OWNERS",
      callOwner: "Call",
      callOwner2: "Call (2nd contact)",
      whatsapp: "WhatsApp",
      shareLocation: "Send my location",
      address: "Address",
      chip: "Chip",
      private: "Private",
    },
  }[lang];

  if (!t) return null; // ← Narrowing global

  let { data: pet } = await supabase
    .from("pets")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!pet) {
    const { data: petByTag } = await supabase
      .from("pets")
      .select("*")
      .eq("tag_secret_id", slug)
      .single();

    pet = petByTag;
  }

    let medicalNotes: { title: string; description: string; notes: string }[] = [];

    if (pet && pet.show_medical_notes) {
      const { data: records } = await supabase
        .from("pet_records")
        .select("title, description, notes")
        .eq("pet_id", pet.id)
        .eq("show_in_lost", true);

      medicalNotes = records || [];
    }

  if (!pet) {
    if (!t) return null;

    return (
      <div className="p-10 text-center">
        <h1>{t.notFoundTitle}</h1>
      </div>
    );
  }


  const cleanPhone = pet.phone?.replace(/\D/g, "");
  const cleanPhone2 = pet.phone2?.replace(/\D/g, "");

  const fallbackImage =
    "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=1000&auto=format&fit=crop";

  return (
    <div className="mx-auto max-w-xl p-4 pb-4 bg-white min-h-screen pb-[env(safe-area-inset-bottom)]">

      {/* Alerta perdido */}
      {pet.is_lost && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-red-700 border border-red-200">
          <h2 className="text-base font-bold">
            🚨 {t?.lost ?? "Mascota perdida"}
          </h2>
          <p className="text-xs">
            {(t?.lastLocation ?? "Última ubicación")}: {pet.last_location}
          </p>
        </div>
      )}


      {/* Imagen */}
      <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl shadow-xl">
        <img
          src={pet.photo_url || fallbackImage}
          className="h-full w-full object-cover"
          alt={pet.name}
        />
      </div>

      {/* Nombre */}
      <div className="mt-5 text-center">
        <h1 className="text-4xl font-black text-stone-900">{pet.name}</h1>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-500">
            {pet.species === "dog" ? "🐶 Perro" : "🐱 Gato"}
          </span>
          {pet.sex && pet.sex !== "unknown" && (
            <span className="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-500">
              {pet.sex === "male" ? "♂ Macho" : "♀ Hembra"}
            </span>
          )}
        </div>
        <p className="mt-1 text-[10px] text-stone-400 font-mono">
          {t.chip}: {pet.chip_id || "—"}
        </p>
      </div>

      {/* Datos */}
      <div className="mt-6 space-y-3">

        {/* Propietario/s */}
        <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
          <span className="text-[9px] font-black text-stone-400 tracking-widest uppercase">
            {t.tutors}
          </span>
          <p className="text-lg font-bold text-stone-800">
            {pet.show_owners
              ? (pet.owners || "—")
              : <span className="text-stone-400 text-base font-normal">🔒 {t.private}</span>
            }
          </p>
        </div>

        {/* Teléfono */}
        <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
          <span className="text-[9px] font-black text-stone-400 tracking-widest uppercase">
            Teléfono
          </span>
          {pet.show_phone ? (
            pet.phone ? (
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${pet.phone}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-stone-800 py-3 text-white font-semibold shadow-md active:scale-95"
                  >
                    📞 {t.callOwner}
                  </a>
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-white font-semibold shadow-md active:scale-95"
                  >
                    💬 {t.whatsapp}
                  </a>
                </div>

                {pet.phone2 && (
                  <a
                    href={`tel:${pet.phone2}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-stone-600 py-3 text-white font-semibold shadow-md active:scale-95 w-full"
                  >
                    📞 {t.callOwner2}
                  </a>
                )}

                <LocationButton
                  phone={cleanPhone}
                  petName={pet.name}
                  petSlug={pet.slug}
                  label={t.shareLocation}
                />
              </div>
            ) : (
              <p className="text-stone-500 text-sm mt-1">—</p>
            )
          ) : (
            <p className="text-stone-400 text-base font-normal mt-1">🔒 {t.private}</p>
          )}
        </div>

        {/* Dirección */}
        <div className="rounded-xl bg-stone-50 p-4 border border-stone-100 flex items-start gap-3">
          <span className="text-lg">📍</span>
          <div>
            <span className="text-[9px] font-black text-stone-400 tracking-widest uppercase">
              {t.address}
            </span>
            <p className="text-stone-800 text-sm leading-tight mt-1">
              {pet.show_address
                ? (pet.address || "—")
                : <span className="text-stone-400 font-normal">🔒 {t.private}</span>
              }
            </p>
          </div>
        </div>

        
        {/* Notas médicas / pasaporte */}
        {medicalNotes.length > 0 && (
          <div className="rounded-xl bg-orange-50 p-4 border border-orange-200 flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <span className="text-[9px] font-black text-orange-500 tracking-widest uppercase">
                Información importante
              </span>
              <div className="mt-2 space-y-2">
                {medicalNotes.map((record, idx) => (
                  <div key={idx}>
                    {record.title && (
                      <p className="text-xs font-bold text-stone-700">{record.title}</p>
                    )}
                    {record.description && (
                      <p className="text-stone-700 text-sm leading-relaxed">{record.description}</p>
                    )}
                    {record.notes && (
                      <p className="text-stone-500 text-xs mt-0.5">{record.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}