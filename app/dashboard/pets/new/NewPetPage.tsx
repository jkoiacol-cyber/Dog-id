"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

// -------------------------------------------------------------
//  HELPER: base64url → UUID completo
//  Invierte exactamente lo que hace uuidToBase64url() en AdminGeneratePage.
//  El parámetro ?qr= llega como base64url (~22 chars);
//  lo convertimos a UUID antes de cualquier query a Supabase.
// -------------------------------------------------------------
export const dynamic = "force-dynamic";

export default function NewPetPage() {
  const searchParams = useSearchParams();

// AHORA (correcto — el UUID llega completo desde /t/[token]):
  const secretId = searchParams.get("qr");

  const router = useRouter();

  // -------------------------------------------------------------
  // TODOS LOS HOOKS VAN AQUÍ (ANTES DE CUALQUIER RETURN)
  // -------------------------------------------------------------

  // Validación temprana
  const [loadingTag, setLoadingTag] = useState(true);
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagData, setTagData] = useState<any>(null);

  // Form fields
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [chip, setChip] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState<string>("");
  const [phone2, setPhone2] = useState<string>("");
  const [email, setEmail] = useState("");
  const [owners, setOwners] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("unknown");

  const [showPhone, setShowPhone] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [showOwners, setShowOwners] = useState(true);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);

  // Cropper
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const [saving, setSaving] = useState(false);

  // Scanner
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanning, setScanning] = useState(false);
  const [chipScanned, setChipScanned] = useState(false);
  const [useFrontCamera, setUseFrontCamera] = useState(false);

  // -------------------------------------------------------------
  // VALIDACIÓN TEMPRANA DE PLACA (useEffect)
  // Sin cambios: secretId ya es el UUID completo, la query funciona igual.
  // -------------------------------------------------------------
  useEffect(() => {
    const validateTag = async () => {
      if (!secretId) {
        setTagError("⚠️ Debes escanear un QR válido para registrar una mascota.");
        setLoadingTag(false);
        return;
      }

      const { data: tag, error } = await supabase
        .from("tags")
        .select("*")
        .eq("secret_id", secretId)
        .single();

      if (error || !tag) {
        setTagError("❌ Este QR no corresponde a ninguna placa válida.");
        setLoadingTag(false);
        return;
      }

      if (tag.pet_id) {
        setTagError("❌ Esta placa ya está registrada por otra mascota.");
        setLoadingTag(false);
        return;
      }

      setTagData(tag);
      setLoadingTag(false);
    };

    validateTag();
  }, [secretId]);

  // -------------------------------------------------------------
  // RETURN TEMPRANO (SIN HOOKS DESPUÉS)
  // -------------------------------------------------------------
  if (loadingTag) {
    return (
      <div className="p-10 text-center text-gray-600 font-semibold">
        Validando placa…
      </div>
    );
  }

  if (tagError) {
    return (
      <div className="p-10 text-center text-red-600 font-bold">
        {tagError}
      </div>
    );
  }

  // -------------------------------------------------------------
  //  ESCÁNER
  // -------------------------------------------------------------
  const stopScanning = () => {
    readerRef.current = null;

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };


  const scanBarcode = async (frontCam?: boolean) => {
    const useFront = frontCam !== undefined ? frontCam : useFrontCamera;
    try {
      setScanning(true);

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (devices.length === 0) {
        alert("No se encontró ninguna cámara.");
        setScanning(false);
        return;
      }

      const backCamera = devices.find(
        (d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("trasera") ||
          d.label.toLowerCase().includes("environment")
      );

      const frontCamera = devices.find(
        (d) =>
          d.label.toLowerCase().includes("front") ||
          d.label.toLowerCase().includes("delantera") ||
          d.label.toLowerCase().includes("user") ||
          d.label.toLowerCase().includes("facetime")
      );

      const deviceId = useFront
        ? frontCamera?.deviceId || devices[0].deviceId
        : backCamera?.deviceId || devices[devices.length - 1].deviceId;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          focusMode: "continuous",
        } as any,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const codeReader = new BrowserMultiFormatReader();
      readerRef.current = codeReader;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

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
              setChip(result.getText());
              setChipScanned(true);
              stopScanning();
              return;
            }
          } catch {}
        }
        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    } catch (err) {
      alert(
        "No se pudo acceder a la cámara. Asegúrate de usar HTTPS o localhost."
      );
      setScanning(false);
    }
  };

  const switchCamera = () => {
    const newVal = !useFrontCamera;
    setUseFrontCamera(newVal);
    stopScanning();
    setTimeout(() => scanBarcode(newVal), 300);
  };

  // -------------------------------------------------------------
  //  CROP
  // -------------------------------------------------------------
  const getCroppedImage = async (): Promise<File | null> => {
    if (!cropSrc || !croppedAreaPixels) return null;
    const image = new Image();
    image.src = cropSrc;
    await new Promise((res) => (image.onload = res));
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      400,
      400
    );
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          resolve(new File([blob], "photo.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleCropConfirm = async () => {
    const croppedFile = await getCroppedImage();
    if (!croppedFile) return;
    setNewPhotoFile(croppedFile);
    setPhotoUrl(URL.createObjectURL(croppedFile));
    setShowCropper(false);
    setCropSrc(null);
  };

  // -------------------------------------------------------------
  //  GUARDAR CORREGIDO (Seguro para iOS y Base de Datos)
  //  Sin cambios respecto al original: secretId ya es UUID completo.
  // -------------------------------------------------------------
  const handleSave = async () => {
    if (!name.trim()) {
      alert("El nombre es obligatorio.");
      return;
    }
    if (!phone.trim()) {
      alert("El teléfono es obligatorio.");
      return;
    }
    if (!email.trim()) {
      alert("El email es obligatorio.");
      return;
    }

    setSaving(true);

    // 1. Intentamos obtener el usuario de forma directa (más seguro en iOS)
    const {
      data: { user: activeUser },
      error: userError,
    } = await supabase.auth.getUser();

    // 2. Si falla (típico en iPhone), recuperamos la sesión como respaldo
    let user = activeUser;
    if (!user) {
      const {
        data: { session: backupSession },
      } = await supabase.auth.getSession();
      user = backupSession?.user || null;
    }

    // -------------------------------------------------------------
    // VALIDAR ID PRIVADO (secret_id) Y OBTENER SLUG PÚBLICO
    // -------------------------------------------------------------
    const slugPublic = searchParams.get("slug");

    if (!slugPublic) {
      alert("Este QR no contiene un identificador público válido.");
      setSaving(false);
      return;
    }

    // 1. Buscar la placa en la tabla tags
    // secretId ya es UUID completo → query sin cambios
    const { data: tagRecord, error: tagError } = await supabase
      .from("tags")
      .select("id, pet_id, slug, has_expiry")
      .eq("secret_id", secretId)
      .single();

    if (tagError || !tagRecord) {
      alert("Esta placa no existe o no es válida.");
      setSaving(false);
      return;
    }

    // 2. Verificar si ya está asignada a una mascota
    if (tagRecord.pet_id) {
      alert("Esta placa ya está registrada por otra mascota.");
      setSaving(false);
      return;
    }

    // 3. Verificar que el slug del QR coincide con el slug de la placa
    if (tagRecord.slug !== slugPublic) {
      alert("El QR no coincide con la placa registrada.");
      setSaving(false);
      return;
    }

    // --- PASO CRÍTICO: Registrar/Actualizar al Dueño primero ---
    // Validación necesaria para TypeScript y Vercel
    if (!user) {
      throw new Error("User not found");
    }

    const { error: ownerError } = await supabase
      .from("owners")
      .upsert(
        {
          id: user.id,
          full_name: owners || "Propietario",
          phone: phone.trim(),
          address: address || null,
        },
        { onConflict: "id" }
      );

    if (ownerError) {
      alert("Error al registrar perfil de dueño: " + ownerError.message);
      setSaving(false);
      return;
    }


    // 4. Crear el Slug y la Mascota
    const slug = `${name.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

    const { data: petData, error: petError } = await supabase
      .from("pets")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        species,
        slug,
        chip_id: chip || null,
        address: address || null,
        owners: owners || null,
        birth_date: birthDate || null,
        sex,
        phone: phone.trim(),
        phone2: phone2 || null,
        email: email || null,
        show_phone: showPhone,
        show_address: showAddress,
        show_owners: showOwners,
        tag_secret_id: tagData.slug,
      })
      .select()
      .single();

    // -------------------------------------------------------------
    // ASIGNAR LA PLACA A LA MASCOTA + ACTIVAR CONTRATO
    // sold_at = ahora (cuando el cliente activa, no cuando compra)
    // expires_at = ahora + 5 años si has_expiry, null si sin caducidad
    // -------------------------------------------------------------
    const now = new Date().toISOString();
    const expiresAt = tagRecord.has_expiry
      ? new Date(Date.now() + 5 * 365.25 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    await supabase
      .from("tags")
      .update({
        pet_id: petData.id,
        sold_at: now,
        expires_at: expiresAt,
      })
      .eq("secret_id", secretId);

    // 5. Gestión de la Foto
    if (newPhotoFile && petData) {
      const fileName = `pets/${petData.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("pet-photos")
        .upload(fileName, newPhotoFile, { upsert: true });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("pet-photos")
          .getPublicUrl(fileName);

        await supabase
          .from("pets")
          .update({ photo_url: publicUrlData.publicUrl })
          .eq("id", petData.id);
      }
    }

    setSaving(false);

    try {
      await fetch("/api/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:     email.trim(),
          petName:   name.trim(),
          ownerName: owners.trim() || "Propietario",
          species:   species,
          qrCode:    tagData.slug,
        }),
      });
    } catch (err) {
      console.warn("Email de bienvenida no enviado:", err);
    }

    router.push("/dashboard");
  };

  // -------------------------------------------------------------
  //  UI
  // -------------------------------------------------------------
  return (
    <div className="max-w-xl mx-auto py-6 space-y-6 px-4">
      <h1 className="text-2xl font-bold text-stone-800">Añadir mascota</h1>

      {/* MODAL: Escáner (siempre montado, pero no bloquea la UI cuando está oculto) */}
      <div
        className={`fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center gap-4 p-6 transition-opacity duration-200 ${
          scanning
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border-2 border-white">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-72 object-cover"
          />

          {/* Línea roja animada */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-4/5 h-0.5 bg-red-500 animate-bounce opacity-80" />
          </div>

          {/* Esquinas del marco */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-white rounded-br" />
        </div>

        <p className="text-white text-sm font-medium animate-pulse">
          Apunta al código de barras...
        </p>

        <div className="flex gap-3">
          <button
            onClick={switchCamera}
            className="px-4 py-2 bg-stone-600 text-white rounded-xl font-semibold text-sm"
          >
            {useFrontCamera ? "📷 Trasera" : "🤳 Delantera"}
          </button>

          <button
            onClick={stopScanning}
            className="px-6 py-2 bg-white text-stone-900 rounded-xl font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Botón escanear */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => scanBarcode()}
          className="px-4 py-2 rounded-xl text-white bg-blue-600 font-semibold"
        >
          Escanear chip 📷
        </button>

        {chipScanned && (
          <div className="flex items-center gap-2 bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold">
            ✅ Chip leído correctamente
          </div>
        )}
      </div>

      {/* Foto */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-stone-800">
          Foto
        </label>

        <div className="w-40 h-40 rounded-xl overflow-hidden bg-white border border-stone-200 mb-3 flex items-center justify-center">
          {photoUrl ? (
            <img
              src={photoUrl}
              className="w-full h-full object-cover"
              alt="Foto de mascota"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-stone-300">
              <span className="text-xs mt-2">Sin foto</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => document.getElementById("photoInput")?.click()}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-semibold active:scale-95"
        >
          Subir foto
        </button>

        <input
          id="photoInput"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            if (!f) return;
            setCropSrc(URL.createObjectURL(f));
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setShowCropper(true);
          }}
        />
      </div>

      {/* MODAL: Crop */}
      {showCropper && cropSrc && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="bg-black p-4 flex gap-3">
            <button
              onClick={() => {
                setShowCropper(false);
                setCropSrc(null);
              }}
              className="flex-1 py-3 bg-stone-700 text-white rounded-xl font-semibold"
            >
              Cancelar
            </button>

            <button
              onClick={handleCropConfirm}
              className="flex-1 py-3 bg-white text-stone-900 rounded-xl font-semibold"
            >
              Usar foto
            </button>
          </div>
        </div>
      )}

      {/* Nombre */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Fecha de nacimiento */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Fecha de nacimiento{" "}
          <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <input
          type="date"
          className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>

      {/* Sexo */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Sexo
        </label>
        <select
          className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white"
          value={sex}
          onChange={(e) => setSex(e.target.value)}
        >
          <option value="unknown">No especificado</option>
          <option value="male">🐾 Macho</option>
          <option value="female">🐾 Hembra</option>
        </select>
      </div>

      {/* Especie */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Especie
        </label>
        <select
          className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        >
          <option value="dog">🐶 Perro</option>
          <option value="cat">🐱 Gato</option>
        </select>
      </div>

      {/* Chip */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Chip <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <input
          className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white"
          value={chip}
          onChange={(e) => setChip(e.target.value)}
        />
      </div>

      {/* Propietario/s */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Propietario/s{" "}
          <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <input
          className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white"
          placeholder="Ej: Juan García / María García"
          value={owners}
          onChange={(e) => setOwners(e.target.value)}
        />
      </div>

      {/* Teléfono */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Teléfono <span className="text-red-500">*</span>
        </label>
        <PhoneInput
          international
          defaultCountry="ES"
          value={phone}
          onChange={(val) => setPhone(val ?? "")}
          className="w-full border border-stone-300 rounded-xl p-3"
        />
      </div>

      {/* Teléfono 2 */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Teléfono 2{" "}
          <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <PhoneInput
          international
          defaultCountry="ES"
          value={phone2}
          onChange={(val) => setPhone2(val ?? "")}
          className="w-full border border-stone-300 rounded-xl p-3"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Dirección{" "}
          <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <input
          className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      {/* PANEL DE PRIVACIDAD */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-4 mb-6">
        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 ml-1">
          Privacidad del perfil público
        </h3>

        <div className="space-y-3">
          {[
            {
              label: "Mostrar teléfono",
              state: showPhone,
              setter: setShowPhone,
              icon: "📞",
            },
            {
              label: "Mostrar dirección",
              state: showAddress,
              setter: setShowAddress,
              icon: "📍",
            },
            {
              label: "Mostrar propietarios",
              state: showOwners,
              setter: setShowOwners,
              icon: "👤",
            },
          ].map((item, idx) => (
            <label
              key={idx}
              className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-xl active:scale-[0.98] transition-transform shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs font-bold text-black uppercase tracking-tight">
                  {item.label}
                </span>
              </div>

              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={item.state}
                  onChange={() => item.setter(!item.state)}
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold active:scale-95 disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar mascota"}
      </button>
    </div>
  );
}