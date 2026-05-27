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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
                <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
              </svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-300">
                <path d="M12 2a3 3 0 0 0-3 3c0 1.5.8 3 2 4 .4.3.7.5 1 .5s.6-.2 1-.5c1.2-1 2-2.5 2-4a3 3 0 0 0-3-3z"/><circle cx="7" cy="9" r="1.5"/><circle cx="17" cy="9" r="1.5"/><circle cx="5" cy="14" r="1.5"/><circle cx="19" cy="14" r="1.5"/>
              </svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
                <path d="M12 5c-3.9 0-7 2.5-7 5.5 0 1.7.9 3.2 2.3 4.2L6 18h12l-1.3-3.3C18.1 13.7 19 12.2 19 10.5 19 7.5 15.9 5 12 5z"/>
              </svg>
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