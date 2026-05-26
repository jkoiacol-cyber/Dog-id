"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Zoom from "react-medium-image-zoom";


interface Page {
  id: string;
  page_number: number;
  image_path: string;
  image_url: string;
}

export default function CartillaViewer({ petId }: { petId: string }) {
  const [pages, setPages] = useState<Page[]>([]);
  const [rotations, setRotations] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    setLoading(true);

    const { data, error } = await supabase
      .from("cartilla_pages")
      .select("*")
      .eq("pet_id", petId)
      .order("page_number", { ascending: true });

    if (error) {
      console.error("Error cargando páginas:", error);
      return;
    }

    if (!data) {
      setPages([]);
      setLoading(false);
      return;
    }

    const pagesWithUrls = data.map((page) => {
      const { data: urlData } = supabase.storage
        .from("cartillas")
        .getPublicUrl(page.image_path);

      return {
        ...page,
        image_url: urlData.publicUrl,
      };
    });

    setPages(pagesWithUrls);
    setLoading(false);
  }

  function rotate(id: string) {
    setRotations((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 90,
    }));
  }

  if (loading) {
    return <p className="text-stone-500">Cargando páginas...</p>;
  }

  if (pages.length === 0) {
    return <p className="text-stone-500">Aún no hay páginas subidas.</p>;
  }

  return (
    <div className="space-y-6">
      {pages.map((page) => (
        <div
          key={page.id}
          className="border rounded-lg p-4 bg-white shadow-sm space-y-2"
        >
          <h3 className="font-semibold text-stone-700">
            Página {page.page_number}
          </h3>

          <Zoom>
            <img
              src={page.image_url}
              className="w-full rounded cursor-pointer"
              style={{
                transform: `rotate(${rotations[page.id] || 0}deg)`,
                transition: "transform 0.2s ease",
              }}
            />
          </Zoom>

          <button
            onClick={() => rotate(page.id)}
            className="px-3 py-1 bg-stone-200 hover:bg-stone-300 rounded text-sm"
          >
            Girar 90°
          </button>
        </div>
      ))}
    </div>
  );
}
