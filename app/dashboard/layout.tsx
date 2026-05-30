// app/dashboard/layout.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header minimalista negro */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-100">
        <div className="mx-auto max-w-lg flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            {/* Iconos perro / huella / gato */}
            <div className="flex items-center gap-1">
              <img
                src="/img/icons.png"
                alt="dog paw cat icons"
                width={72}
                height={24}
                className="opacity-90"
              />
            </div>
            <span className="text-base font-bold text-stone-900 tracking-tight">Dog‑id / Cat‑id</span>
          </div>
          <span className="text-xs text-stone-400 max-w-[140px] truncate">{user.email}</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-10">
        {children}
      </main>
    </div>
  );
}