"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function VaccinesSection({ petId }: { petId: string }) {
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [batch, setBatch] = useState("");
  const [vet, setVet] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadVaccines();
  }, []);

  async function loadVaccines() {
    setLoading(true);

    const { data, error } = await supabase
      .from("vaccines")
      .select("*")
      .eq("pet_id", petId)
      .order("date", { ascending: false });

    if (!error && data) setVaccines(data);
    setLoading(false);
  }

  async function addVaccine() {
    const { error } = await supabase.from("vaccines").insert({
      pet_id: petId,
      name,
      date,
      next_date: nextDate || null,
      batch,
      vet,
      notes,
    });

    if (error) {
      alert("Error guardando vacuna");
      return;
    }

    setShowForm(false);
    setName("");
    setDate("");
    setNextDate("");
    setBatch("");
    setVet("");
    setNotes("");

    loadVaccines();
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold mb-3">Vacunas</h2>

      {loading && <p className="text-stone-500">Cargando...</p>}

      {!loading && vaccines.length === 0 && (
        <p className="text-stone-500">No hay vacunas registradas.</p>
      )}

      <div className="space-y-4">
        {vaccines.map((v) => (
          <div key={v.id} className="p-4 bg-white rounded shadow-sm border">
            <h3 className="font-semibold">{v.name}</h3>
            <p className="text-sm text-stone-600">Fecha: {v.date}</p>
            {v.next_date && (
              <p className="text-sm text-stone-600">
                Próxima dosis: {v.next_date}
              </p>
            )}
            {v.batch && <p className="text-sm">Lote: {v.batch}</p>}
            {v.vet && <p className="text-sm">Veterinario: {v.vet}</p>}
            {v.notes && <p className="text-sm italic">{v.notes}</p>}
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="mt-4 w-full py-2 bg-stone-800 text-white rounded hover:bg-stone-700"
      >
        + Añadir vacuna
      </button>

      {showForm && (
        <div className="mt-4 p-4 bg-white border rounded shadow-sm space-y-3">
          <input
            type="text"
            placeholder="Nombre de la vacuna"
            className="w-full border rounded px-2 py-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="text-sm font-medium">Fecha de administración</label>
          <input
            type="date"
            className="w-full border rounded px-2 py-1"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label className="text-sm font-medium">Próxima dosis</label>
          <input
            type="date"
            className="w-full border rounded px-2 py-1"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            placeholder="Próxima dosis"
          />

          <input
            type="text"
            placeholder="Lote"
            className="w-full border rounded px-2 py-1"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
          />

          <input
            type="text"
            placeholder="Veterinario"
            className="w-full border rounded px-2 py-1"
            value={vet}
            onChange={(e) => setVet(e.target.value)}
          />

          <textarea
            placeholder="Notas"
            className="w-full border rounded px-2 py-1"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            onClick={addVaccine}
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-500"
          >
            Guardar vacuna
          </button>

          <button
            onClick={() => setShowForm(false)}
            className="w-full py-2 bg-stone-300 rounded hover:bg-stone-200"
          >
            Cancelar
          </button>
        </div>
      )}
    </section>
  );
}
