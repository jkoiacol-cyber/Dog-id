import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

/**
 * Layout servidor para /admin/*
 * Verifica sesión y rol antes de renderizar cualquier página admin.
 * Funciona correctamente en iOS porque corre en servidor, no en cliente.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return <>{children}</>;
}