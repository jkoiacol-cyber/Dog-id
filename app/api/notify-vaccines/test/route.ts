// app/api/notify-vaccines/test/route.ts
//
// Endpoint SOLO para pruebas. Envía un único email de prueba
// al email que pases como parámetro, con datos ficticios.
//
// Uso:
//   GET /api/notify-vaccines/test?email=tu@email.com&type=1_mes
//   GET /api/notify-vaccines/test?email=tu@email.com&type=1_semana
//   GET /api/notify-vaccines/test?email=tu@email.com&type=caducada
//
// ⚠️ Elimina este archivo antes de subir a producción.

import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";
import {
  templateUnMesAntes,
  templateUnaSemanAntes,
  templateCaducada,
} from "@/lib/vaccine-email-templates";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const type = searchParams.get("type") ?? "caducada";
  const species = searchParams.get("species") ?? "dog";

  if (!email) {
    return NextResponse.json(
      { error: "Falta el parámetro ?email=tu@email.com" },
      { status: 400 }
    );
  }

  const templateData = {
    petName: "Mustafa (PRUEBA)",
    vaccineName: "Antirrábica",
    nextDate: "17 de mayo de 2026",
    species,
  };

  let subject = "";
  let html = "";

  if (type === "1_mes") {
    subject = `📅 [PRUEBA] Recordatorio: vacuna de Mustafa en 1 mes`;
    html = templateUnMesAntes(templateData);
  } else if (type === "1_semana") {
    subject = `⚠️ [PRUEBA] Urgente: la vacuna de Mustafa vence en 1 semana`;
    html = templateUnaSemanAntes(templateData);
  } else {
    subject = `🚨 [PRUEBA] La vacuna de Mustafa ha caducado — actualiza el pasaporte`;
    html = templateCaducada(templateData);
  }

  try {
    await sendEmail({ to: email, subject, html, petName: "Mustafa" });
    return NextResponse.json({
      ok: true,
      message: `Email de prueba enviado a ${email}`,
      type,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}