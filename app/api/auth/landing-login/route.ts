import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Service role: consulta owners sin restricciones RLS y envía magic links
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, reason: "invalid_email" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── PASO 1: ¿Ya hay sesión activa? ──────────────────────────────────────
    // Usamos el mismo patrón que middleware.ts (createServerClient + cookies).
    // El fetch del login.html lleva credentials: "include", así que las cookies
    // httpOnly de dogid.es viajan con la petición y podemos leerlas aquí.
    const supabaseSession = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll() {},   // solo lectura, no escribimos cookies aquí
        },
      }
    );

    const { data: { user } } = await supabaseSession.auth.getUser();

    if (user) {
      // Sesión válida → el cliente redirigirá al dashboard sin enviar magic link
      return NextResponse.json({ authenticated: true });
    }

    // ── PASO 2: Sin sesión — ¿existe el email en owners? ────────────────────
    const { data: owner, error: ownerError } = await supabaseAdmin
      .from("owners")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (ownerError) {
      console.error("[landing-login] Error consultando owners:", ownerError);
      return NextResponse.json(
        { ok: false, reason: "db_error" },
        { status: 500 }
      );
    }

    if (!owner) {
      // Email no registrado → el cliente mostrará la vista "no encontrado"
      return NextResponse.json({ ok: false, reason: "not_found" });
    }

    // ── PASO 3: Email registrado y sin sesión → enviar magic link ───────────
    const { error: magicError } = await supabaseAdmin.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (magicError) {
      console.error("[landing-login] Error enviando magic link:", magicError);
      return NextResponse.json(
        { ok: false, reason: "magic_link_error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[landing-login] Error inesperado:", err);
    return NextResponse.json(
      { ok: false, reason: "server_error" },
      { status: 500 }
    );
  }
}