"use client";

import { Suspense } from "react";
import HomePageContent from "./HomePageContent";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  );
}
