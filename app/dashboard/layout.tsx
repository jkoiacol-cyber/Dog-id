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
    <div className="min-h-screen bg-stone-50">
      <header className="p-4 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <h1 className="text-xl font-bold text-stone-800">Dog‑ID</h1>
          <span className="text-sm text-stone-500">{user.email}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4">
        {children}
      </main>
    </div>
  );
}
