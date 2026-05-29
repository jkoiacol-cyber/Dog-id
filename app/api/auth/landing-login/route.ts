import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase con la service role key para poder
// consultar la tabla owners y disparar el magic link
// sin estar sujeto a las políticas RLS de usuario final.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // ── Validación básica ──────────────────────────────────
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, reason: "invalid_email" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Comprobar si el email existe en public.owners ──────
    // La tabla owners.email se rellena cuando el usuario
    // asocia su placa QR (número de placa → correo electrónico).
    const { data: owner, error: ownerError } = await supabase
      .from("owners")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (ownerError) {
      console.error("[landing-login] Error consultando owners:", ownerError);
      return NextResponse.json(
        { ok: false, reason: "db_error" },
        { status: 500 }
      );
    }

    // Email no registrado → el login.html mostrará la vista "no encontrado"
    if (!owner) {
      return NextResponse.json({ ok: false, reason: "not_found" });
    }

    // ── Email existe → disparar magic link via Supabase Auth ──
    // Equivalente a lo que hace /app/login/page.tsx llamando
    // a /api/auth/login, pero invocado directamente aquí para
    // mantener este endpoint independiente.
    const { error: magicError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        // Al hacer clic en el enlace del email, Supabase redirige aquí.
        // El middleware de Next.js intercambia el token y lleva al dashboard.
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      },
    });

    if (magicError) {
      console.error("[landing-login] Error enviando magic link:", magicError);
      return NextResponse.json(
        { ok: false, reason: "magic_link_error" },
        { status: 500 }
      );
    }

    // Todo correcto → el login.html mostrará "revisa tu correo"
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[landing-login] Error inesperado:", err);
    return NextResponse.json(
      { ok: false, reason: "server_error" },
      { status: 500 }
    );
  }
}