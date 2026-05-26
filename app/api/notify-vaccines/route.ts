// app/api/notify-vaccines/route.ts
//
// Llama a este endpoint una vez al día con un cron job.
// Opciones para dispararlo automáticamente:
//   - Vercel Cron Jobs (vercel.json)
//   - GitHub Actions scheduled workflow
//   - Cron-job.org (gratis, llama a tu URL cada día)
//
// Protección: incluye CRON_SECRET en las variables de entorno y
// pásalo como header Authorization: Bearer <CRON_SECRET> desde el cron.

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";
import {
  templateUnMesAntes,
  templateUnaSemanAntes,
  templateCaducada,
} from "@/lib/vaccine-email-templates";

// Cliente con service_role para leer todas las mascotas sin RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Helpers de fecha ──────────────────────────────────────────────────────────
function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(target: Date): number {
  return Math.round((target.getTime() - today().getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Tipo de notificación ─────────────────────────────────────────────────────
type NotificationType = "1_mes" | "1_semana" | "caducada";

function getNotificationType(nextDate: string): NotificationType | null {
  const diff = diffDays(new Date(nextDate));
  if (diff === 30) return "1_mes";
  if (diff === 7)  return "1_semana";
  if (diff < 0)    return "caducada";
  return null;
}

// ── Comprueba si ya existe una dosis más reciente registrada ─────────────────
// Solo se llama para vacunas caducadas. Hace una query acotada buscando
// únicamente vacunas del mismo nombre con date >= next_date de la caducada.
async function yaRenovada(vaccine: any): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("vaccines")
    .select("id")
    .eq("pet_id", vaccine.pet_id)
    .eq("name", vaccine.name)
    .neq("id", vaccine.id)
    .gte("date", vaccine.next_date)
    .limit(1);

  if (error) {
    console.error("Error comprobando renovación:", error.message);
    return false; // ante la duda, enviar el email
  }

  return (data?.length ?? 0) > 0;
}

// ── Handler principal ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {

  // 1. Verificar secreto del cron (opcional pero recomendado)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  // 2. Calcular el rango de fechas relevantes:
  //    - Caducadas: next_date < hoy
  //    - 7 días:    next_date = hoy + 7
  //    - 30 días:   next_date = hoy + 30
  //    Traemos el rango hoy-∞ hasta hoy+30, el filtro exacto se aplica en memoria.
  const in30days = new Date(today()); in30days.setDate(in30days.getDate() + 30);
  const in30daysStr = in30days.toISOString().split("T")[0];

  // Solo traemos vacunas cuyo next_date sea hoy+30, hoy+7, o cualquier fecha pasada.
  // Usamos lte(hoy+30) para un único índice eficiente y descartamos el resto en memoria.
  const { data: vaccines, error } = await supabaseAdmin
    .from("vaccines")
    .select(`
      id,
      name,
      date,
      next_date,
      pet_id,
      pets (
        name,
        email,
        species,
        deleted_at
      )
    `)
    .not("next_date", "is", null)
    .lte("next_date", in30daysStr);  // solo vacunas con next_date <= hoy+30

  if (error) {
    console.error("Error consultando vacunas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const vaccine of vaccines ?? []) {
    const pet = vaccine.pets as any;

    // Saltar mascotas eliminadas o sin email
    if (!pet || pet.deleted_at || !pet.email) {
      results.skipped++;
      continue;
    }

    const notifType = getNotificationType(vaccine.next_date);
    if (!notifType) {
      results.skipped++;
      continue;
    }

    results.processed++;

    // Para vacunas caducadas, comprobar si ya se registró una dosis más reciente
    if (notifType === "caducada" && await yaRenovada(vaccine)) {
      console.log(`⏭ Vacuna ya renovada, omitiendo: ${pet.name} — ${vaccine.name}`);
      results.skipped++;
      results.processed--;
      continue;
    }

    const templateData = {
      petName: pet.name,
      vaccineName: vaccine.name,
      nextDate: formatDate(vaccine.next_date),
      species: pet.species ?? "dog",
    };

    let subject = "";
    let html = "";

    if (notifType === "1_mes") {
      subject = `📅 Recordatorio: vacuna de ${pet.name} en 1 mes`;
      html = templateUnMesAntes(templateData);
    } else if (notifType === "1_semana") {
      subject = `⚠️ Urgente: la vacuna de ${pet.name} vence en 1 semana`;
      html = templateUnaSemanAntes(templateData);
    } else {
      subject = `🚨 La vacuna de ${pet.name} ha caducado — actualiza el pasaporte`;
      html = templateCaducada(templateData);
    }

    try {
      await sendEmail({ to: pet.email, subject, html, petName: pet.name });
      results.sent++;
      console.log(`✅ Email enviado a ${pet.email} — ${pet.name} — ${notifType}`);
    } catch (err: any) {
      results.errors.push(`${pet.email} (${pet.name}): ${err.message}`);
      console.error(`❌ Error enviando a ${pet.email}:`, err.message);
    }
  }

  return NextResponse.json({
    ok: true,
    date: new Date().toISOString(),
    ...results,
  });
}