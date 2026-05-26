"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      alert("Error enviando el enlace");
      return;
    }

    setSent(true);
  };

  return (
    <div className="max-w-sm mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>

      {sent ? (
        <p className="text-green-600">
          Te hemos enviado un enlace mágico a tu correo.
        </p>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            className="w-full border p-3 rounded-xl"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold"
          >
            Enviar enlace mágico
          </button>
        </form>
      )}
    </div>
  );
}
