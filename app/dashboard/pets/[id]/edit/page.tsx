"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function EditPetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
  const [showMedicalNotes, setShowMedicalNotes] = useState(false);
  const [isLost, setIsLost] = useState(false);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);

  // Crop
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Escáner
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanning, setScanning] = useState(false);
  const [chipScanned, setChipScanned] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  // Cargar mascota
  useEffect(() => {
    const loadPet = async () => {
      const { data } = await supabase
        .from("pets")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setName(data.name);
        setSpecies(data.species);
        setChip(data.chip_id || "");
        setAddress(data.address || "");
        setPhone(data.phone || "");
        setPhone2(data.phone2 || "");
        setEmail(data.email || "");
        setOwners(data.owners || "");
        setBirthDate(data.birth_date || "");
        setSex(data.sex || "unknown");
        setShowPhone(data.show_phone);
        setShowAddress(data.show_address);
        setShowOwners(data.show_owners);
        setIsLost(data.is_lost);
        setPhotoUrl(data.photo_url || null);
        setShowMedicalNotes(data.show_medical_notes || false);
      }

      setLoading(false);
    };

    loadPet();
  }, [id]);

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
    ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, 400, 400);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        resolve(new File([blob], "photo.jpg", { type: "image/jpeg" }));
      }, "image/jpeg", 0.9);
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
  //  ESCÁNER
  // -------------------------------------------------------------
  const stopScanning = () => {
    // No llamamos a ningún método del reader porque ZXing no expone ninguno válido
    readerRef.current = null;

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };


  const scanBarcode = async () => {
    try {
      setScanning(true);
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (devices.length === 0) { alert("No se encontró ninguna cámara."); setScanning(false); return; }
      const backCamera = devices.find((d) =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear") ||
        d.label.toLowerCase().includes("trasera") ||
        d.label.toLowerCase().includes("environment")
      );
      const deviceId = backCamera ? backCamera.deviceId : devices[devices.length - 1].deviceId;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 }, focusMode: "continuous" } as any,
      });
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
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
            if (result) { setChip(result.getText()); setChipScanned(true); stopScanning(); return; }
          } catch {}
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch (err) {
      alert("No se pudo acceder a la cámara. Asegúrate de usar HTTPS o localhost.");
      setScanning(false);
    }
  };

  // -------------------------------------------------------------
  //  GUARDAR
  // -------------------------------------------------------------
  const handleSave = async () => {
    if (!name.trim()) { alert("El nombre es obligatorio."); return; }
    if (!phone.trim()) { alert("El teléfono es obligatorio."); return; }
    setSaving(true);
    let uploadedPhotoUrl = photoUrl;
    if (newPhotoFile) {
      const fileName = `pets/${id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("pet-photos").upload(fileName, newPhotoFile, { upsert: true });
      if (!uploadError) {
        const { data: publicUrl } = supabase.storage.from("pet-photos").getPublicUrl(fileName);
        uploadedPhotoUrl = publicUrl.publicUrl;
      }
    }
    await supabase.from("pets").update({
      name: name.trim(),
      species,
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
      show_medical_notes: showMedicalNotes,
      is_lost: isLost,
      photo_url: uploadedPhotoUrl,
    }).eq("id", id);
    setSaving(false);
    router.push("/dashboard");
  };

  // -------------------------------------------------------------
  //  BORRAR
  // -------------------------------------------------------------
  const handleDelete = async () => {
    setDeleting(true);
    await supabase.from("pets").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    setDeleting(false);
    router.push("/dashboard");
  };

  if (loading) return <p className="p-6 text-center">Cargando...</p>;

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6 px-4">
      <h1 className="text-2xl font-bold text-stone-800">Editar mascota</h1>

      {/* MODAL: Escáner */}
      {scanning && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center gap-4 p-6">
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border-2 border-white">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-72 object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-4/5 h-0.5 bg-red-500 animate-bounce opacity-80" />
            </div>
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-white rounded-br" />
          </div>
          <p className="text-white text-sm font-medium animate-pulse">Apunta al código de barras...</p>
          <button onClick={stopScanning} className="px-6 py-2 bg-white text-stone-900 rounded-xl font-semibold">Cancelar</button>
        </div>
      )}

      {/* MODAL: Crop */}
      {showCropper && cropSrc && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="relative flex-1">
            <Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
          </div>
          <div className="bg-black p-4 flex gap-3">
            <button onClick={() => { setShowCropper(false); setCropSrc(null); }} className="flex-1 py-3 bg-stone-700 text-white rounded-xl font-semibold">Cancelar</button>
            <button onClick={handleCropConfirm} className="flex-1 py-3 bg-white text-stone-900 rounded-xl font-semibold">Usar foto</button>
          </div>
        </div>
      )}

      {/* Foto */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-stone-800">Foto</label>
        <div className="w-40 h-40 rounded-xl overflow-hidden bg-white border border-stone-200 mb-3 flex items-center justify-center">
          {photoUrl ? (
            <img src={photoUrl} className="w-full h-full object-cover" alt="Foto de mascota" />
          ) : (
            <div className="flex flex-col items-center justify-center text-stone-300">
              <span className="text-xs mt-2">Sin foto</span>
            </div>
          )}
        </div>
        <button type="button" onClick={() => document.getElementById("photoInput")?.click()} className="px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-semibold active:scale-95">
          Subir foto
        </button>
        <input id="photoInput" type="file" accept="image/*" className="hidden"
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

      {/* Nombre */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {/* Fecha de nacimiento */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Fecha de nacimiento <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <input type="date" className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      </div>

      {/* Sexo */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">Sexo</label>
        <select className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white" value={sex} onChange={(e) => setSex(e.target.value)}>
          <option value="unknown">No especificado</option>
          <option value="male">🐾 Macho</option>
          <option value="female">🐾 Hembra</option>
        </select>
      </div>

      {/* Especie */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">Especie</label>
        <select className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white" value={species} onChange={(e) => setSpecies(e.target.value)}>
          <option value="dog">🐶 Perro</option>
          <option value="cat">🐱 Gato</option>
        </select>
      </div>

      {/* Chip */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Chip <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <div className="flex gap-2">
          <input className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white" value={chip} onChange={(e) => setChip(e.target.value)} />
          <button type="button" onClick={scanBarcode} className="px-3 py-2 rounded-xl text-sm text-white bg-blue-600">📷</button>
        </div>
        {chipScanned && (
          <div className="flex items-center gap-2 bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold mt-2">
            ✅ Chip leído correctamente
          </div>
        )}
        <p className="text-xs text-stone-500 mt-1">Escanea el código de barras del documento.</p>
      </div>

      {/* Propietario/s */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Propietario/s <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <input className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white" placeholder="Ej: Juan García / María García" value={owners} onChange={(e) => setOwners(e.target.value)} />
      </div>

      {/* Teléfono */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Teléfono <span className="text-red-500">*</span>
        </label>
        <PhoneInput international defaultCountry="ES" value={phone} onChange={(val) => setPhone(val ?? "")} className="w-full border border-stone-300 rounded-xl p-3" />
      </div>

      {/* Teléfono 2 */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Teléfono 2 <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <PhoneInput international defaultCountry="ES" value={phone2} onChange={(val) => setPhone2(val ?? "")} className="w-full border border-stone-300 rounded-xl p-3" />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Email <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <input type="email" className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-sm font-semibold mb-1 text-stone-800">
          Dirección <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <input className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 bg-white" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      {/* Privacidad */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-4">
        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 ml-1">
          Privacidad del perfil público
        </h3>
        <div className="space-y-3">
          {[
            { label: "Mostrar teléfono", state: showPhone, setter: setShowPhone, icon: "📞" },
            { label: "Mostrar dirección", state: showAddress, setter: setShowAddress, icon: "📍" },
            { label: "Mostrar propietarios", state: showOwners, setter: setShowOwners, icon: "👤" },
            { label: "Mostrar notas médicas", state: showMedicalNotes, setter: setShowMedicalNotes, icon: "🏥" },
          ].map((item, idx) => (
            <label key={idx} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-xl active:scale-[0.98] transition-transform shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs font-bold text-black uppercase tracking-tight">{item.label}</span>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={item.state} onChange={() => item.setter(!item.state)} />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </div>
            </label>
          ))}
        </div>
        <p className="text-[9px] text-zinc-400 italic text-center px-2">
          * Estos datos solo serán visibles cuando alguien escanee el código QR.
        </p>
      </div>

      {/* Modo perdido */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-red-600 font-semibold">Activar modo perdido</span>
          <button
            onClick={async () => {
              const newValue = !isLost;
              setIsLost(newValue);
              await supabase.from("pets").update({
                is_lost: newValue,
                lost_since: newValue ? new Date().toISOString() : null,
              }).eq("id", id);
            }}
            className={`relative inline-flex items-center w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none ${isLost ? "bg-red-500" : "bg-stone-300"}`}
          >
            <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${isLost ? "translate-x-8" : "translate-x-1"}`} />
          </button>
        </div>
        {isLost && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-stone-500">
              Cuando está en modo perdido, la página pública mostrará una alerta.
            </p>
            <a
              href={`/dashboard/pets/${id}/lost-poster`}
              className="block w-full text-center py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold"
            >
              🚨 Gestionar modo perdido →
            </a>
          </div>
        )}
      </div>

      {/* Guardar */}
      <button onClick={handleSave} disabled={saving} className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold active:scale-95 disabled:opacity-50">
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>

      {/* Eliminar */}
      <div className="pt-4 border-t">
        <button onClick={() => setShowDeleteConfirm(true)} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold active:scale-95">
          🗑️ Eliminar mascota
        </button>
      </div>

      {/* MODAL: Confirmar borrado */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold text-center text-red-600">¿Eliminar a {name}?</h3>
            <p className="text-sm text-stone-600 text-center">Se eliminarán todos los datos, documentos y registros médicos. Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold active:scale-95 disabled:opacity-50">
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}