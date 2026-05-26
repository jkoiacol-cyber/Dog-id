"use client"; 

import dynamic from "next/dynamic";

// Ahora Next.js sí te permitirá usar ssr: false aquí
const NewPetPage = dynamic(() => import("./NewPetPage"), {
  ssr: false,
});

export default function Page() {
  return <NewPetPage />;
}