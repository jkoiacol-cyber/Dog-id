"use client";

import { Suspense } from "react";
import HomePageContent from "./HomePageContent";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ color: "black", padding: "20px", textAlign: "center" }}>Cargando aplicación...</div>}>
      <HomePageContent />
    </Suspense>
  );
}