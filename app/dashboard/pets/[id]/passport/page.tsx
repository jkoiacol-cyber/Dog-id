// app/dashboard/pets/[id]/passport/page.tsx
"use client";

import { supabase } from "@/lib/supabase";
//import { supabaseClient as supabase } from "@/lib/supabaseClient";
import imageCompression from "browser-image-compression";
import { use, useEffect, useState } from "react";

// Vacunas que tienen fecha automática de 1 año
const VACUNAS_ANUALES = [
  "antirrábica",
  "polivalente",
  "tos de las perreras",
  "bordetella",
  "leishmaniosis",
  "pentavalente",
];

function calcularProximaFecha(fechaAplicacion: string): string | null {
  if (!fechaAplicacion) return null;
  const fecha = new Date(fechaAplicacion);
  fecha.setFullYear(fecha.getFullYear() + 1);
  return fecha.toISOString().split("T")[0];
}

export default function PassportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(0);


  const [showUpload, setShowUpload] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const [showFullPage, setShowFullPage] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [selectedRotation, setSelectedRotation] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showPassportSection, setShowPassportSection] = useState(false);
  const [showVaccinesSection, setShowVaccinesSection] = useState(false);
  const [showParasitesSection, setShowParasitesSection] = useState(false);
  const [showNotesSection, setShowNotesSection] = useState(false);

  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [newVaccine, setNewVaccine] = useState({
    name: "", date: "", next_date: "", batch: "", vet: "", notes: "",
  });
  const [autoNextDate, setAutoNextDate] = useState<string | null>(null);
  const [editingVaccineId, setEditingVaccineId] = useState<string | null>(null);
  const [editingVaccine, setEditingVaccine] = useState<any>(null);
  const [editingParasiteId, setEditingParasiteId] = useState<string | null>(null);
  const [editingParasite, setEditingParasite] = useState<any>(null);

  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", description: "", show_in_lost: false });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<any>(null);

  const [showAddParasite, setShowAddParasite] = useState(false);
  const [newParasite, setNewParasite] = useState({
    name: "", date: "", next_date: "", batch: "", vet: "", notes: "",
  });

  // -----------------------------------------------------------------------
  const loadPet = async () => {
    const { data, error } = await supabase
      .from("pets")
      .select(`
        *,
        pages:passport_photos(*),
        records:pet_records(*),
        vaccines:vaccines(*)
      `)
      .eq("id", id)
      .single();
    if (error) console.error("Error cargando pasaporte:", error);
    setPet(data);
    setLoading(false);
  };

  useEffect(() => { loadPet(); }, [id]);
  const reloadPet = async () => { await loadPet(); };

  // -----------------------------------------------------------------------
  //  CARTILLA
  // -----------------------------------------------------------------------
  const handleRotate = async () => {
    const newRotation = (selectedRotation + 90) % 360;
    setSelectedRotation(newRotation);
    await supabase.from("passport_photos").update({ rotation: newRotation }).eq("id", selectedPage.id);
    setPet((prev: any) => ({
      ...prev,
      pages: prev.pages.map((p: any) =>
        p.id === selectedPage.id ? { ...p, rotation: newRotation } : p
      ),
    }));
  };

const handleUpload = async () => {
    // 1. Obtención segura del usuario para iOS
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) { alert("Sesión expirada. Por favor, recarga la página."); return; }
    if (!file) { alert("Selecciona una imagen"); return; }

    try {
      setLoading(true);

      // 2. Compresión compatible con iPhone (useWebWorker: false es la clave)
      const options = { 
        maxSizeMB: 0.7, 
        maxWidthOrHeight: 1600, 
        useWebWorker: false, 
        initialQuality: 0.7 
      };
      const compressed = await imageCompression(file, options);

      // 3. Borrado de página existente (usando tabla passport_photos)
      const existing = pet.pages?.find((p: any) => p.page_number === pageNumber);
      if (existing) {
        await supabase.from("passport_photos").delete().eq("id", existing.id);
      }

      // 4. Subida al Storage
      const fileName = `cartilla/${id}-page-${pageNumber}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("pet-photos")
        .upload(fileName, compressed, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) { 
        alert("Error de subida: " + uploadError.message); 
        setLoading(false);
        return; 
      }

      // 5. Inserción en Base de Datos (USANDO photo_url)
      const { data: urlData } = supabase.storage.from("pet-photos").getPublicUrl(fileName);
      
      const { error: insertError } = await supabase
        .from("passport_photos")
        .insert({ 
          pet_id: id, 
          page_number: pageNumber, 
          photo_url: urlData.publicUrl // <--- CAMBIADO DE image_url A photo_url
        });

      if (insertError) {
        alert("Error en tabla: " + insertError.message);
      } else {
        alert("¡Página guardada con éxito!");
        await reloadPet();
        setShowUpload(false);
        setFile(null);
        setPageNumber(0);
      }
    } catch (err) { 
      console.error(err);
      alert("Error al procesar la imagen en iOS."); 
    } finally {
      setLoading(false);
    }
  };
  const handleDeletePage = async () => {
    if (!selectedPage) return;
    await supabase.from("passport_photos").delete().eq("id", selectedPage.id);
    await reloadPet();
    setShowDeleteConfirm(false);
    setShowFullPage(false);
    setSelectedPage(null);
    setSelectedRotation(0);
    
  };

  // -----------------------------------------------------------------------
  //  VACUNAS
  // -----------------------------------------------------------------------
  const eliminarVacuna = async (vacunaId: string) => {
    await supabase.from("vaccines").delete().eq("id", vacunaId);
    await reloadPet();
  };

  const guardarEdicionVacuna = async () => {
  if (!editingVaccineId) return;
  await supabase.from("vaccines").update({
    name: editingVaccine.name,
    date: editingVaccine.date,
    next_date: editingVaccine.next_date || null,
    batch: editingVaccine.batch || null,
    vet: editingVaccine.vet || null,
    notes: editingVaccine.notes || null,
  }).eq("id", editingVaccineId);
  setEditingVaccineId(null);
  setEditingVaccine(null);
  await reloadPet();
};

const guardarEdicionParasito = async () => {
  if (!editingParasiteId) return;
  await supabase.from("pet_records").update({
    name: editingParasite.name,
    date: editingParasite.date,
    next_date: editingParasite.next_date || null,
    batch: editingParasite.batch || null,
    vet: editingParasite.vet || null,
    notes: editingParasite.notes || null,
  }).eq("id", editingParasiteId);
  setEditingParasiteId(null);
  setEditingParasite(null);
  await reloadPet();
};

  const guardarVacuna = async () => {
    if (!newVaccine.name || !newVaccine.date) {
      alert("El nombre y la fecha son obligatorios.");
      return;
    }
    const nextDate = autoNextDate || newVaccine.next_date || null;
    const { error } = await supabase.from("vaccines").insert({
      pet_id: id,
      name: newVaccine.name,
      date: newVaccine.date,
      next_date: nextDate,
      batch: newVaccine.batch || null,
      vet: newVaccine.vet || null,
      notes: newVaccine.notes || null,
    });
    if (error) { alert("Error guardando vacuna: " + error.message); return; }
    setShowAddVaccine(false);
    setNewVaccine({ name: "", date: "", next_date: "", batch: "", vet: "", notes: "" });
    setAutoNextDate(null);
    reloadPet();
  };



  // -----------------------------------------------------------------------
  //  PARÁSITOS
  // -----------------------------------------------------------------------
  const eliminarParasito = async (parasitoId: string) => {
    await supabase.from("pet_records").delete().eq("id", parasitoId);
    await reloadPet();
  };

  const guardarParasito = async () => {
    if (!newParasite.name || !newParasite.date) {
      alert("El nombre y la fecha son obligatorios.");
      return;
    }
    const { error } = await supabase.from("pet_records").insert({
      pet_id: id,
      type: "parasite",
      name: newParasite.name,
      date: newParasite.date,
      next_date: newParasite.next_date || null,
      batch: newParasite.batch || null,
      vet: newParasite.vet || null,
      notes: newParasite.notes || null,
    });
    if (error) { alert("Error guardando desparasitación: " + error.message); return; }
    setShowAddParasite(false);
    setNewParasite({ name: "", date: "", next_date: "", batch: "", vet: "", notes: "" });
    reloadPet();
  };

  // -----------------------------------------------------------------------
  //  NOTAS
  // -----------------------------------------------------------------------

  const guardarNota = async () => {
    if (!newNote.title) { alert("El título es obligatorio."); return; }
    const { error } = await supabase.from("pet_records").insert({
      pet_id: id,
      type: "note",
      title: newNote.title,
      description: newNote.description || null,
      date: new Date().toISOString().split("T")[0],
      show_in_lost: newNote.show_in_lost,
    });
    if (error) { alert("Error guardando nota: " + error.message); return; }
    setShowAddNote(false);
    setNewNote({ title: "", description: "", show_in_lost: false });
    reloadPet();
  };

  const guardarEdicionNota = async () => {
    if (!editingNoteId) return;
    await supabase.from("pet_records").update({
      title: editingNote.title,
      description: editingNote.description || null,
    }).eq("id", editingNoteId);
    setEditingNoteId(null);
    setEditingNote(null);
    await reloadPet();
  };

  const eliminarNota = async (notaId: string) => {
    await supabase.from("pet_records").delete().eq("id", notaId);
    await reloadPet();
  };

  // -----------------------------------------------------------------------
  if (loading || !pet) return <p className="p-6 text-center">Cargando pasaporte...</p>;

  const { name, species, photo_url, chip_id, is_lost, vaccines = [] } = pet;

  // Filtrar eliminados
  const activeVaccines = vaccines.filter((v: any) => v);
  const parasites = (pet.records ?? []).filter((r: any) => r.type === "parasite");

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      {is_lost && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-xl text-center font-semibold">
          ⚠️ Esta mascota está marcada como PERDIDA
        </div>
      )}

      {/* Cabecera */}
      <div className="flex flex-col items-center">
        <div className="w-40 h-40 rounded-full overflow-hidden bg-stone-200 border border-stone-300">
          {photo_url ? (
            <img src={photo_url} className="w-full h-full object-cover" alt="Foto de mascota" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400">
              {species === "dog" ? "🐶" : "🐱"}
            </div>
          )}
        </div>
        <h1 className="text-3xl font-black mb-1" style={{ color: '#000000', WebkitTextFillColor: '#000000' }}>{pet.name}</h1>
        <p className="text-stone-500 text-lg">{species === "dog" ? "Perro" : "Gato"}</p>
        {chip_id && <p className="text-stone-400 text-sm font-mono mt-1">Chip: {chip_id}</p>}
      </div>

      {/* ACORDEÓN: Cartilla oficial */}
      <div className="bg-white border border-stone-200 rounded-xl">
        <button className="w-full flex items-center justify-between px-4 py-3" onClick={() => setShowPassportSection((v) => !v)}>
          <span className="font-semibold text-stone-700 text-lg">📘 Cartilla oficial</span>
          <span className="text-stone-500 text-sm">{showPassportSection ? "▾" : "▸"}</span>
        </button>
        {showPassportSection && (
          <div className="px-4 pb-4 space-y-3">
            <button onClick={() => setShowUpload(true)} className="px-3 py-2 bg-stone-900 text-white rounded-lg text-sm font-semibold active:scale-95">
              ➕ Subir página
            </button>
            {pet.pages?.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {pet.pages
                  .sort((a: any, b: any) => a.page_number - b.page_number)
                  .map((page: any) => (
                    <div key={page.id} className="border rounded-lg overflow-hidden">
                      <img
                        src={page.photo_url}
                        className="w-full h-40 object-cover cursor-pointer active:scale-95"
                        style={{ transform: `rotate(${page.rotation ?? 0}deg)`, transition: "transform 0.2s ease" }}
                        alt={`Página ${page.page_number}`}
                        onClick={() => { setSelectedPage(page); setSelectedRotation(page.rotation ?? 0); setShowFullPage(true); }}
                      />
                      <div className="p-2 text-center text-sm">Página {page.page_number}</div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">No hay páginas de la cartilla subidas aún.</p>
            )}
          </div>
        )}
      </div>

      {/* ACORDEÓN: Vacunas */}
      <div className="bg-white border border-zinc-300 rounded-2xl overflow-hidden mb-4 shadow-sm">
        <button 
          className="w-full flex items-center justify-between px-4 py-4 bg-white border-b border-zinc-100" 
          onClick={() => setShowVaccinesSection((v) => !v)}
        >
          <span className="font-bold text-black text-lg flex items-center gap-2 notranslate">
            💉 <span style={{ color: '#000000', WebkitTextFillColor: '#000000' }}>Vacunas</span>
          </span>
          <span className="font-bold" style={{ color: '#000000' }}>{showVaccinesSection ? "▾" : "▸"}</span>
        </button>
        
        {showVaccinesSection && (
          <div className="p-3 space-y-4 bg-zinc-50/30">
            {/* Botón Añadir: Estilo reforzado para iOS */}
            <button 
              onClick={() => setShowAddVaccine(true)} 
              className="w-full py-3.5 bg-black text-white rounded-xl text-xs font-black shadow-md active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
              style={{ backgroundColor: '#000000', color: '#ffffff', opacity: 1 }}
            >
              <span>＋</span> Añadir registro
            </button>

            {activeVaccines.length > 0 ? (
              <div className="space-y-1">
                {/* Agrupación por año con Timeline Colapsable */}
                {Object.entries(
                  activeVaccines.reduce((acc: any, v: any) => {
                    const year = new Date(v.date).getFullYear();
                    if (!acc[year]) acc[year] = [];
                    acc[year].push(v);
                    return acc;
                  }, {})
                )
                .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
                .map(([year, items]: [string, any]) => (
                  <details key={year} className="group" open={year === new Date().getFullYear().toString()}>
                    <summary className="flex items-center justify-between py-3 px-2 cursor-pointer list-none select-none">
                      <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">{year}</h3>
                      <div className="h-[1px] flex-1 bg-zinc-200 mx-4 opacity-50"></div>
                      <span className="text-zinc-400 group-open:rotate-180 transition-transform duration-200 text-xs">▼</span>
                    </summary>
                    
                    <div className="space-y-4 pb-4 px-1">
                      {items.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((v: any) => {
                        
                        // Formateador de fecha DD/MM/AAAA
                        const displayDate = (dateStr: string) => {
                          if (!dateStr) return "";
                          const d = new Date(dateStr);
                          return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        };

                        return (
                          <div key={v.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                            {editingVaccineId === v.id && editingVaccine ? (
                              /* --- MODO EDICIÓN: Optimizado para Android (Sin desbordamientos) --- */
                              <div className="space-y-4 animate-in fade-in duration-200">
                                <div>
                                  <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Nombre</label>
                                  <input 
                                    className="w-full border border-zinc-300 rounded-xl p-3 text-sm text-black bg-zinc-50 outline-none focus:border-black" 
                                    value={editingVaccine.name} 
                                    onChange={(e) => setEditingVaccine({ ...editingVaccine, name: e.target.value })} 
                                  />
                                </div>

                                {/* Fechas en vertical para evitar que se corten los números en Android */}
                                <div className="flex flex-col gap-3">
                                  <div className="flex flex-col w-full">
                                    <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Fecha Aplicación</label>
                                    <input 
                                      type="date" 
                                      className="w-full border border-zinc-300 rounded-xl p-3 text-sm text-black bg-white" 
                                      style={{ minHeight: '48px' }}
                                      value={editingVaccine.date} 
                                      onChange={(e) => setEditingVaccine({ ...editingVaccine, date: e.target.value })} 
                                    />
                                  </div>
                                  <div className="flex flex-col w-full">
                                    <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Próxima Dosis</label>
                                    <input 
                                      type="date" 
                                      className="w-full border border-zinc-300 rounded-xl p-3 text-sm text-black bg-white" 
                                      style={{ minHeight: '48px' }}
                                      value={editingVaccine.next_date || ''} 
                                      onChange={(e) => setEditingVaccine({ ...editingVaccine, next_date: e.target.value })} 
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Lote</label>
                                    <input className="w-full border border-zinc-300 rounded-xl p-3 text-xs text-black" value={editingVaccine.batch || ''} onChange={(e) => setEditingVaccine({ ...editingVaccine, batch: e.target.value })} />
                                  </div>
                                  <div className="flex flex-col">
                                    <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Vet</label>
                                    <input className="w-full border border-zinc-300 rounded-xl p-3 text-xs text-black" value={editingVaccine.vet || ''} onChange={(e) => setEditingVaccine({ ...editingVaccine, vet: e.target.value })} />
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <button onClick={guardarEdicionVacuna} className="flex-1 bg-green-600 text-white py-3.5 rounded-2xl text-xs font-black shadow-md active:scale-95">GUARDAR</button>
                                  <button onClick={() => setEditingVaccineId(null)} className="flex-1 bg-zinc-200 text-zinc-700 py-3.5 rounded-2xl text-xs font-black active:scale-95">CANCELAR</button>
                                </div>
                                <button onClick={() => eliminarVacuna(v.id)} className="w-full py-2 text-red-600 text-[10px] font-black uppercase tracking-tighter opacity-60">Eliminar Registro</button>
                              </div>
                            ) : (
                              /* --- MODO VISUALIZACIÓN: Alto contraste para iOS --- */
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-black text-sm uppercase truncate" style={{ color: '#000000', WebkitTextFillColor: '#000000' }}>
                                      {v.name}
                                    </h4>
                                    <span className="shrink-0 text-[9px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded-md">
                                      {displayDate(v.date)}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 gap-y-1">
                                    {v.next_date && (
                                      <div className="flex justify-between items-center text-[10px] border-b border-zinc-50 pb-1">
                                        <span className="font-bold text-zinc-400 uppercase">Próxima:</span>
                                        <span className="font-black text-black">{displayDate(v.next_date)}</span>
                                      </div>
                                    )}
                                    {v.batch && (
                                      <div className="flex justify-between items-center text-[10px] py-0.5">
                                        <span className="font-bold text-zinc-400 uppercase">Lote:</span>
                                        <span className="font-bold text-zinc-600">{v.batch}</span>
                                      </div>
                                    )}
                                    {v.vet && (
                                      <div className="flex justify-between items-center text-[10px] py-0.5">
                                        <span className="font-bold text-zinc-400 uppercase">Colegiado:</span>
                                        <span className="font-bold text-zinc-600 truncate ml-4">{v.vet}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <button 
                                  onClick={() => { setEditingVaccineId(v.id); setEditingVaccine({ ...v }); }}
                                  className="shrink-0 p-3 bg-zinc-50 border border-zinc-200 rounded-xl active:bg-zinc-200 transition-colors shadow-sm"
                                >
                                  <span className="text-sm">✏️</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.3em]">Sin registros históricos</p>
              </div>
            )}
          </div>
        )}
      </div>

    {/* ACORDEÓN: Desparasitaciones */}
    <div className="bg-white border border-zinc-300 rounded-2xl overflow-hidden mb-4 shadow-sm">
      <button 
        className="w-full flex items-center justify-between px-4 py-4 bg-white border-b border-zinc-100" 
        onClick={() => setShowParasitesSection((v) => !v)}
      >
        <span className="font-bold text-black text-lg flex items-center gap-2 notranslate">
          🪱 <span style={{ color: '#000000', WebkitTextFillColor: '#000000' }}>Desparasitaciones</span>
        </span>
        <span className="font-bold" style={{ color: '#000000' }}>{showParasitesSection ? "▾" : "▸"}</span>
      </button>
      
      {showParasitesSection && (
        <div className="p-3 space-y-4 bg-zinc-50/30">
          {/* Botón Añadir: Estilo reforzado para visibilidad en iOS */}
          <button 
            onClick={() => setShowAddParasite(true)} 
            className="w-full py-3.5 bg-black text-white rounded-xl text-xs font-black shadow-md active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
            style={{ backgroundColor: '#000000', color: '#ffffff' }}
          >
            <span>＋</span> Añadir registro
          </button>

          {parasites.length > 0 ? (
            <div className="space-y-1">
              {/* Lógica de agrupación por año (Timeline) */}
              {Object.entries(
                parasites.reduce((acc: any, p: any) => {
                  const year = new Date(p.date).getFullYear();
                  if (!acc[year]) acc[year] = [];
                  acc[year].push(p);
                  return acc;
                }, {})
              )
              .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
              .map(([year, items]: [string, any]) => (
                <details key={year} className="group" open={year === new Date().getFullYear().toString()}>
                  <summary className="flex items-center justify-between py-3 px-2 cursor-pointer list-none select-none">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">{year}</h3>
                    <div className="h-[1px] flex-1 bg-zinc-200 mx-4 opacity-50"></div>
                    <span className="text-zinc-400 group-open:rotate-180 transition-transform duration-200 text-xs">▼</span>
                  </summary>
                  
                  <div className="space-y-4 pb-4 px-1">
                    {items.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p: any) => {
                      
                      // Formateador de fecha DD/MM/AAAA para visualización
                      const displayDate = (dateStr: string) => {
                        if (!dateStr) return "";
                        const d = new Date(dateStr);
                        return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                      };

                      return (
                        <div key={p.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                          {editingParasiteId === p.id && editingParasite ? (
                            /* --- MODO EDICIÓN: Optimizado para Android --- */
                            <div className="space-y-4 animate-in fade-in duration-200">
                              <div>
                                <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Producto / Tipo</label>
                                <input 
                                  className="w-full border border-zinc-300 rounded-xl p-3 text-sm text-black bg-zinc-50 outline-none" 
                                  value={editingParasite.name} 
                                  onChange={(e) => setEditingParasite({ ...editingParasite, name: e.target.value })} 
                                />
                              </div>

                              {/* Fechas en vertical para evitar truncado en Android */}
                              <div className="flex flex-col gap-3">
                                <div className="flex flex-col w-full">
                                  <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Fecha Aplicación</label>
                                  <input 
                                    type="date" 
                                    className="w-full border border-zinc-300 rounded-xl p-3 text-sm text-black bg-white" 
                                    style={{ minHeight: '48px' }}
                                    value={editingParasite.date} 
                                    onChange={(e) => setEditingParasite({ ...editingParasite, date: e.target.value })} 
                                  />
                                </div>
                                <div className="flex flex-col w-full">
                                  <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Próxima Dosis</label>
                                  <input 
                                    type="date" 
                                    className="w-full border border-zinc-300 rounded-xl p-3 text-sm text-black bg-white" 
                                    style={{ minHeight: '48px' }}
                                    value={editingParasite.next_date || ''} 
                                    onChange={(e) => setEditingParasite({ ...editingParasite, next_date: e.target.value })} 
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Notas</label>
                                <textarea 
                                  className="w-full border border-zinc-300 rounded-xl p-3 text-xs text-black bg-white" 
                                  value={editingParasite.notes || ''} 
                                  onChange={(e) => setEditingParasite({ ...editingParasite, notes: e.target.value })} 
                                  placeholder="Observaciones..."
                                  rows={2}
                                />
                              </div>

                              <div className="flex gap-2 pt-2">
                                <button onClick={guardarEdicionParasito} className="flex-1 bg-green-600 text-white py-3.5 rounded-2xl text-xs font-black shadow-md">GUARDAR</button>
                                <button onClick={() => setEditingParasiteId(null)} className="flex-1 bg-zinc-200 text-zinc-700 py-3.5 rounded-2xl text-xs font-black">CANCELAR</button>
                              </div>
                              <button onClick={() => eliminarParasito(p.id)} className="w-full py-2 text-red-600 text-[10px] font-black uppercase tracking-tighter opacity-60">Eliminar Registro</button>
                            </div>
                          ) : (
                            /* --- MODO VISUALIZACIÓN: Alto contraste iOS --- */
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-black text-sm uppercase truncate" style={{ color: '#000000', WebkitTextFillColor: '#000000' }}>
                                    {p.name}
                                  </h4>
                                  <span className="shrink-0 text-[9px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded-md">
                                    {displayDate(p.date)}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-y-1">
                                  {p.next_date && (
                                    <div className="flex justify-between items-center text-[10px] border-b border-zinc-50 pb-1">
                                      <span className="font-bold text-zinc-400 uppercase">Próxima:</span>
                                      <span className="font-black text-black">{displayDate(p.next_date)}</span>
                                    </div>
                                  )}
                                  {p.notes && (
                                    <p className="mt-2 text-[10px] text-zinc-500 italic leading-tight">
                                      "{p.notes}"
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <button 
                                onClick={() => { setEditingParasiteId(p.id); setEditingParasite({ ...p }); }}
                                className="shrink-0 p-3 bg-zinc-50 border border-zinc-200 rounded-xl active:bg-zinc-200 shadow-sm"
                              >
                                <span className="text-sm">✏️</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.3em]">Sin desparasitaciones</p>
            </div>
          )}
        </div>
      )}
    </div>

{/* ACORDEÓN: Notas médicas */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <button className="w-full flex items-center justify-between px-4 py-4 bg-white" onClick={() => setShowNotesSection((v) => !v)}>
          <span className="font-bold text-black text-lg">📝 Notas médicas</span>
          <span className="text-zinc-500 font-bold">{showNotesSection ? "▾" : "▸"}</span>
        </button>
        
        {showNotesSection && (
          <div className="px-4 pb-4 space-y-4 bg-zinc-50/30">
            <button onClick={() => setShowAddNote(true)} className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold active:scale-95 shadow-md">
              ➕ Añadir nota
            </button>

            {pet.records?.filter((r: any) => r.type === "note").length > 0 ? (
              <div className="space-y-3">
                {pet.records
                  .filter((r: any) => r.type === "note")
                  .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((n: any) => (
                    <div key={n.id} className="border-l-4 border-zinc-500 bg-white shadow-sm rounded-xl px-4 py-4 mb-3 border-y border-r border-zinc-200">
                      {editingNoteId === n.id && editingNote ? (
                        <div className="space-y-3">
                          <input
                            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-base font-bold text-black bg-white"
                            value={editingNote.title}
                            onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                            placeholder="Título de la nota"
                          />
                          <textarea
                            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-base text-black bg-white"
                            rows={3}
                            value={editingNote.description || ""}
                            onChange={(e) => setEditingNote({ ...editingNote, description: e.target.value })}
                            placeholder="Descripción..."
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setEditingNoteId(null); setEditingNote(null); }} 
                              className="flex-1 py-2 border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 bg-zinc-50"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={guardarEdicionNota} 
                              className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-bold active:scale-95"
                            >
                              Guardar
                            </button>
                          </div>
                          <button 
                            onClick={() => eliminarNota(n.id)} 
                            className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 active:scale-95"
                          >
                            🗑 Eliminar Nota
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-bold text-black text-base leading-tight">{n.title}</p>
                            <button
                              onClick={() => { setEditingNoteId(n.id); setEditingNote({ ...n }); }}
                              className="flex-shrink-0 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold active:scale-95 shadow-sm"
                            >
                              ✏️ Editar
                            </button>
                          </div>
                          
                          {n.description && (
                            <p className="text-sm text-zinc-800 mt-2 leading-relaxed bg-zinc-50 p-2 rounded-lg border border-zinc-50">
                              {n.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-3 text-zinc-500">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 px-2 py-0.5 rounded">
                              {new Date(n.date).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                              Mostrar en perfil público y cartel perdido
                            </span>
                            <button
                              onClick={async () => {
                                const newValue = !n.show_in_lost;
                                // Actualizar estado local inmediatamente sin recargar
                                setPet((prev: any) => ({
                                  ...prev,
                                  records: prev.records.map((r: any) =>
                                    r.id === n.id ? { ...r, show_in_lost: newValue } : r
                                  ),
                                }));
                                // Guardar en BD en segundo plano
                                await supabase
                                  .from("pet_records")
                                  .update({ show_in_lost: newValue })
                                  .eq("id", n.id);
                              }}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}
                              style={{ backgroundColor: n.show_in_lost ? "#16a34a" : "#d1d5db" }}
                            >
                              <span
                                className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out"
                                style={{ transform: n.show_in_lost ? "translateX(20px)" : "translateX(0px)" }}
                              />
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  ))}
              </div>  
            ) : (
              <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center">
                <p className="text-sm font-medium text-zinc-500">No hay notas médicas registradas.</p>
              </div>
            )}
          </div>
        )}
      </div> 

      {/* MODAL: Añadir nota */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-3">
            <h2 className="text-xl font-bold">Añadir nota médica</h2>
            <div>
              <label className="text-xs font-semibold">Título <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Ej: Perro castrado"
                className="w-full border rounded px-2 py-1 mt-1"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Descripción <span className="text-stone-400 font-normal">(opcional)</span></label>
              <textarea
                placeholder="Ej: Castrado en enero 2024, sin complicaciones"
                className="w-full border rounded px-2 py-1 mt-1"
                rows={3}
                value={newNote.description}
                onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-bold text-zinc-700">Mostrar en perfil público</p>
                <p className="text-[10px] text-zinc-400">Visible en QR público y cartel de perdido</p>
              </div>
              <button
                onClick={() => setNewNote({ ...newNote, show_in_lost: !newNote.show_in_lost })}
                className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
                style={{ backgroundColor: newNote.show_in_lost ? "#16a34a" : "#d1d5db" }}
              >
                <span
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out"
                  style={{ transform: newNote.show_in_lost ? "translateX(20px)" : "translateX(0px)" }}
                />
              </button>
            </div>

            <button onClick={guardarNota} className="w-full py-2 bg-green-600 text-white rounded-xl font-semibold">Guardar nota</button>
            <button onClick={() => setShowAddNote(false)} className="w-full py-2 bg-stone-300 rounded-xl text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL: Subir página */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold">Subir página de cartilla</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Número de página</label>
              <input type="number" min="0" className="w-full border rounded-lg p-2" value={pageNumber} onChange={(e) => setPageNumber(Number(e.target.value))} />
              <p className="text-xs text-stone-500">La portada debe ser la página 0.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Imagen</label>
              <input type="file" accept="image/*" className="block w-full text-sm text-stone-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-stone-700" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowUpload(false); setFile(null); }} className="flex-1 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleUpload} className="flex-1 py-2 bg-stone-900 text-white rounded-lg font-semibold active:scale-95">Subir</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Vista completa con rotación */}
      {showFullPage && selectedPage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-semibold text-center">Página {selectedPage.page_number}</h3>
            <div className="flex items-center justify-center overflow-hidden max-h-[60vh]">
              <img
                src={selectedPage.photo_url}
                className="rounded-lg w-full"
                style={{ transform: `rotate(${selectedRotation}deg)`, transition: "transform 0.2s ease" }}
                alt="Página completa"
              />
            </div>
            <button onClick={handleRotate} className="w-full py-2 bg-stone-200 hover:bg-stone-300 rounded-lg text-sm">🔄 Girar 90°</button>
            <div className="flex gap-2">
              <button onClick={() => { setShowFullPage(false); setSelectedPage(null); setSelectedRotation(0); }} className="flex-1 py-2 border rounded-lg">Cerrar</button>
              <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold active:scale-95">Eliminar página</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar borrado de página */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold text-center text-red-600">¿Eliminar esta página?</h3>
            <p className="text-sm text-stone-600 text-center">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleDeletePage} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold active:scale-95">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Añadir vacuna */}
      {showAddVaccine && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black notranslate" style={{ color: '#000000', WebkitTextFillColor: '#000000' }}>Añadir vacuna</h2>

            <div>
              <label className="text-xs font-semibold">Nombre</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 mt-1"
                value={newVaccine.name}
                onChange={(e) => {
                  setNewVaccine({ ...newVaccine, name: e.target.value });
                }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Fecha de aplicación</label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1 mt-1"
                value={newVaccine.date}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewVaccine({ ...newVaccine, date: val });
                  setAutoNextDate(calcularProximaFecha(val));
                }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Próxima dosis</label>
              {autoNextDate ? (
                <div className="mt-1 flex items-center gap-2 bg-green-50 border border-green-200 rounded px-2 py-1 text-sm text-green-700">
                  📅 Calculada automáticamente: <span className="font-semibold">{autoNextDate}</span>
                  <button onClick={() => setAutoNextDate(null)} className="ml-auto text-xs text-stone-400 hover:text-stone-600">Editar</button>
                </div>
              ) : (
                <input
                  type="date"
                  className="w-full border rounded px-2 py-1 mt-1"
                  value={newVaccine.next_date}
                  onChange={(e) => setNewVaccine({ ...newVaccine, next_date: e.target.value })}
                />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold">Lote</label>
              <input type="text" className="w-full border rounded px-2 py-1 mt-1" value={newVaccine.batch} onChange={(e) => setNewVaccine({ ...newVaccine, batch: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold">Nº Colegiado</label>
              <input type="text" className="w-full border rounded px-2 py-1 mt-1" value={newVaccine.vet} onChange={(e) => setNewVaccine({ ...newVaccine, vet: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold">Notas</label>
              <textarea className="w-full border rounded px-2 py-1 mt-1" rows={2} value={newVaccine.notes} onChange={(e) => setNewVaccine({ ...newVaccine, notes: e.target.value })} />
            </div>

            <button onClick={guardarVacuna} className="w-full py-2 bg-green-600 text-white rounded-xl font-semibold">Guardar vacuna</button>
                      <button 
            onClick={() => setShowAddVaccine(false)}
            className="w-full py-4 bg-zinc-200 text-black rounded-xl font-bold active:scale-95"
            style={{ backgroundColor: '#e4e4e7', color: '#000000' }}
          >
            Cancelar
          </button>
          </div>
        </div>
      )}

      {/* MODAL: Añadir desparasitación */}
      {showAddParasite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">Añadir desparasitación</h2>
            <div>
              <label className="text-xs font-semibold">Nombre</label>
              <input type="text" className="w-full border rounded px-2 py-1 mt-1" value={newParasite.name} onChange={(e) => setNewParasite({ ...newParasite, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold">Fecha</label>
              <input type="date" className="w-full border rounded px-2 py-1 mt-1" value={newParasite.date} onChange={(e) => setNewParasite({ ...newParasite, date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold">Próxima dosis</label>
              <input type="date" className="w-full border rounded px-2 py-1 mt-1" value={newParasite.next_date} onChange={(e) => setNewParasite({ ...newParasite, next_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold">Lote</label>
              <input type="text" className="w-full border rounded px-2 py-1 mt-1" value={newParasite.batch} onChange={(e) => setNewParasite({ ...newParasite, batch: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold">Nº Colegiado</label>
              <input type="text" className="w-full border rounded px-2 py-1 mt-1" value={newParasite.vet} onChange={(e) => setNewParasite({ ...newParasite, vet: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold">Notas</label>
              <textarea className="w-full border rounded px-2 py-1 mt-1" rows={2} value={newParasite.notes} onChange={(e) => setNewParasite({ ...newParasite, notes: e.target.value })} />
            </div>
            <button onClick={guardarParasito} className="w-full py-2 bg-green-600 text-white rounded-xl font-semibold">Guardar desparasitación</button>
            <button onClick={() => setShowAddParasite(false)} className="w-full py-2 bg-stone-300 rounded-xl text-sm">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
