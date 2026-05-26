import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "No imageUrl provided" }, { status: 400 });
    }

    // Descargar la imagen desde Supabase
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      console.error("No se pudo descargar la imagen:", imageRes.status);
      return NextResponse.json({ error: "No se pudo descargar la imagen" }, { status: 400 });
    }

    const arrayBuffer = await imageRes.arrayBuffer();

    // Procesamiento para OCR: nitidez, contraste, alta resolución
    const processed = await sharp(Buffer.from(arrayBuffer))
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .sharpen({ sigma: 1.5 })
      .normalise()
      .jpeg({ quality: 95 })
      .toBuffer();

    // Convertir a Uint8Array para compatibilidad con Vercel
    const uint8 = new Uint8Array(processed);

    // Llamar al Worker de Cloudflare con OCR dedicado
    const workerRes = await fetch("https://dogid-ocr.jkoiacol.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: uint8,
    });

    const workerData = await workerRes.json();
    console.log("OCR Worker response:", JSON.stringify(workerData).slice(0, 500));

    // Extraer texto del OCR
    const text =
      workerData?.result?.text ||
      workerData?.text ||
      "";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json({ error: "OCR failed" }, { status: 500 });
  }
}
