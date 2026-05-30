// app/api/send-welcome-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";
import { templateBienvenida } from "@/lib/welcome-email-template";

export async function POST(req: NextRequest) {
  try {
    const { email, petName, ownerName, species, qrCode } = await req.json();

    if (!email || !petName || !qrCode) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: email, petName, qrCode" },
        { status: 400 }
      );
    }

    const animalEmoji = species === "cat" ? "🐱" : "🐶";
    const subject = `${animalEmoji} ¡${petName} ya tiene su placa QR activada!`;

    const html = templateBienvenida({
      petName,
      ownerName: ownerName || "Propietario",
      email,
      qrCode,
      species: species || "dog",
    });

    await sendEmail({ to: email, subject, html, petName });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error enviando email de bienvenida:", error);
    return NextResponse.json(
      { error: "No se pudo enviar el email" },
      { status: 500 }
    );
  }
}