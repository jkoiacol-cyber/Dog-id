"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";
export const dynamic = "force-dynamic";

export default function ScanPetQR() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        // 1. Obtener cámaras disponibles
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
          alert("No se encontró ninguna cámara.");
          return;
        }

        // 2. Seleccionar cámara trasera de forma AGRESIVA
        let backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
        );

        // iOS NO da nombres → fallback a la ÚLTIMA cámara (que suele ser la trasera)
        if (!backCamera) {
          backCamera = devices[devices.length - 1];
        }

        const deviceId = backCamera.deviceId;

        // 3. Solicitar acceso SOLO a la cámara trasera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: deviceId },
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        // 4. Mostrar vídeo
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // 5. Preparar ZXing
        const codeReader = new BrowserMultiFormatReader();
        readerRef.current = codeReader;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        // 6. Bucle de escaneo
        const tick = async () => {
          if (!videoRef.current || !readerRef.current) return;

          const video = videoRef.current;

          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            try {
              const result = await codeReader.decodeFromCanvas(canvas);

              if (result) {
                // Detener cámara inmediatamente
                stream.getTracks().forEach((t) => t.stop());

                const raw = result.getText();

                try {
                  const url = new URL(raw);

                  // ✅ URL corta tipo /t/Xk9mP2 (QRs nuevos con token)
                  // Ir directo a /dashboard/pets/new saltándose HomePage
                  const tokenMatch = url.pathname.match(
                    /^\/t\/([A-Za-z0-9]+)$/
                  );
                  if (tokenMatch) {
                    router.replace(`/dashboard/pets/scan/resolve?token=${tokenMatch[1]}`);
                    return;
                  }

                  // Legacy: URL con parámetros directos (QRs antiguos siguen funcionando)
                  const secretId = url.searchParams.get("secret_id");
                  const slug = url.searchParams.get("slug");
                  if (secretId && slug) {
                    router.replace(
                      `/dashboard/pets/new?qr=${secretId}&slug=${slug}`
                    );
                    return;
                  }

                  // Fallback: redirigir a la URL tal cual
                  router.replace(raw);
                } catch {
                  router.replace(raw);
                }
              }
            } catch {
              // ZXing lanza errores mientras no detecta nada → ignorarlos
            }
          }

          requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      } catch (err) {
        console.error(err);
        alert("No se pudo acceder a la cámara.");
      }
    };

    startScanner();

    // Cleanup
    return () => {
      try {
        readerRef.current = null;
      } catch {}

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <p className="text-lg mb-4">Escaneando QR...</p>

      <div className="w-full max-w-sm h-80 bg-black rounded-xl overflow-hidden border border-white">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>

      <p className="text-sm mt-4 opacity-70">Apunta la cámara hacia la placa</p>
    </div>
  );
}