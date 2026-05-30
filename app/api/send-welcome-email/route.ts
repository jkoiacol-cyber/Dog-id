import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";
import { templateBienvenida } from "@/lib/welcome-email-template";

export async function POST(req: NextRequest) {
  console.log("[API /send-welcome-email] Petición recibida");

  try {
    const body = await req.json();
    console.log("[API /send-welcome-email] Body recibido:", body);

    const { email, petName, ownerName, species, qrCode } = body;

    if (!email || !petName || !qrCode) {
      console.warn("[API /send-welcome-email] Faltan campos obligatorios:", {
        email,
        petName,
        qrCode,
      });

      return NextResponse.json(
        { error: "Faltan campos obligatorios: email, petName, qrCode" },
        { status: 400 }
      );
    }

    const animalEmoji = species === "cat" ? "🐱" : "🐶";
    const subject = `${animalEmoji} ¡${petName} ya tiene su placa QR activada!`;

    console.log("[API /send-welcome-email] Preparando email con:", {
      to: email,
      petName,
      ownerName: ownerName || "Propietario",
      species: species || "dog",
      qrCode,
      subject,
    });

    const html = templateBienvenida({
      petName,
      ownerName: ownerName || "Propietario",
      email,
      qrCode,
      species: species || "dog",
    });

    console.log("[API /send-welcome-email] Llamando a sendEmail...");

    await sendEmail({ to: email, subject, html, petName });

    console.log("[API /send-welcome-email] Email enviado correctamente");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /send-welcome-email] Error enviando email de bienvenida:", error);

    return NextResponse.json(
      { error: "No se pudo enviar el email" },
      { status: 500 }
    );
  }
}
