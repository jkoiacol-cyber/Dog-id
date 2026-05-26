"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Zoom from "react-medium-image-zoom";


export default function CartillaUploader({ petId }: { petId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [rotations, setRotations] = useState<number[]>([]);
  const [pageNumbers, setPageNumbers] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
    setRotations(selected.map(() => 0));
    setPageNumbers(selected.map((_, i) => i + 1)); // páginas por defecto
  }

  function rotate(index: number) {
    setRotations((prev) => {
      const copy = [...prev];
      copy[index] = copy[index] + 90;
      return copy;
    });
  }

  function updatePageNumber(index: number, value: number) {
    setPageNumbers((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }

  async function uploadAll() {
    if (!files.length) return;

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pageNumber = pageNumbers[i];

      const filePath = `cartillas/${petId}/${Date.now()}-${file.name}`;

      // 1. Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("cartillas")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error subiendo archivo:", uploadError);
        alert("Error subiendo archivo: " + uploadError.message);
        continue;
      }

      // 2. Guardar registro en la tabla cartilla_pages
      const { error: dbError } = await supabase
        .from("cartilla_pages")
        .insert({
          pet_id: petId,
          page_number: pageNumber,
          image_path: filePath,
        });

      if (dbError) {
        console.error("Error guardando en BD:", dbError);
        alert("Error guardando en BD: " + dbError.message);
      }
    }

    setUploading(false);
    alert("Páginas subidas correctamente");

    // Reset
    setFiles([]);
    setPreviews([]);
    setRotations([]);
    setPageNumbers([]);
  }

  return (
    <div className="space-y-4">
      {/* Input */}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="block w-full text-sm text-stone-700"
      />

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {previews.map((src, i) => (
            <div key={i} className="border rounded-lg p-2 bg-white shadow-sm space-y-2">
              <Zoom>
                <img
                  src={src}
                  className="w-full rounded cursor-pointer"
                  style={{
                    transform: `rotate(${rotations[i]}deg)`,
                    transition: "transform 0.2s ease",
                  }}
                />
              </Zoom>

              <button
                onClick={() => rotate(i)}
                className="w-full py-1 text-sm bg-stone-200 hover:bg-stone-300 rounded"
              >
                Girar 90°
              </button>

              <input
                type="number"
                min={1}
                value={pageNumbers[i]}
                onChange={(e) => updatePageNumber(i, Number(e.target.value))}
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="Número de página"
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {files.length > 0 && (
        <button
          onClick={uploadAll}
          disabled={uploading}
          className="w-full py-2 bg-stone-800 text-white rounded hover:bg-stone-700"
        >
          {uploading ? "Subiendo..." : "Subir páginas"}
        </button>
      )}
    </div>
  );
}
