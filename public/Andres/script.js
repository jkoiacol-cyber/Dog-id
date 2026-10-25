// ==========================================
// 0. CONFIGURACIÓN E INICIALIZACIÓN SUPABASE
// ==========================================
const SUPABASE_URL = 'https://wyyurayswvzuovofyseh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G8iz7v3aOpS1fFSoTOT56Q_fmbLi8x3';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 1. DICCIONARIO DE TRADUCCIONES COMPLETO
// ==========================================
const translations = {
    es: {
        welcome: "Bienvenidos a Aruba",
        message: "Esperamos que disfrutéis de una estancia inolvidable.",
        cardTitle1: "📶 Conexión y Datos",
        cardTitle2: "🌴 Guía de Aruba",
        cardGuideDesc: "Escanea para descubrir recomendaciones, restaurantes y playas.",
        qrScanWifi: "¡Escanear para conectar!",
        qrScanGuide: "Guía Turística",
        weatherClear: "Cielo despejado",
        weatherClouds: "Parcialmente nublado",
        weatherFog: "Niebla",
        weatherRain: "Lluvia ligera",
        weatherShowers: "Chubascos",
        weatherStorm: "Tormenta",
        weatherDefault: "Soleado"
    },
    en: {
        welcome: "Welcome to Aruba",
        message: "We hope you enjoy an unforgettable stay.",
        cardTitle1: "📶 Connection & Info",
        cardTitle2: "🌴 Aruba Guide",
        cardGuideDesc: "Scan to discover recommendations, restaurants, and beaches.",
        qrScanWifi: "Scan to connect!",
        qrScanGuide: "Travel Guide",
        weatherClear: "Clear sky",
        weatherClouds: "Partly cloudy",
        weatherFog: "Foggy",
        weatherRain: "Light rain",
        weatherShowers: "Showers",
        weatherStorm: "Storm",
        weatherDefault: "Sunny"
    },
    de: {
        welcome: "Willkommen auf Aruba",
        message: "Wir wünschen Ihnen einen unvergesslichen Aufenthalt.",
        cardTitle1: "📶 Verbindung & Info",
        cardTitle2: "🌴 Aruba Reiseführer",
        cardGuideDesc: "Scannen Sie, um Empfehlungen, Restaurants und Strände zu entdecken.",
        qrScanWifi: "Scannen zum Verbinden!",
        qrScanGuide: "Reiseführer",
        weatherClear: "Klarer Himmel",
        weatherClouds: "Teilweise bewölkt",
        weatherFog: "Nebel",
        weatherRain: "Leichter Regen",
        weatherShowers: "Schauer",
        weatherStorm: "Sturm",
        weatherDefault: "Sonnig"
    },
    nl: {
        welcome: "Welkom op Aruba",
        message: "Wij hopen dat jullie een onvergetelijk verblijf hebben.",
        cardTitle1: "📶 Verbinding & Info",
        cardTitle2: "🌴 Aruba Gids",
        cardGuideDesc: "Scan om aanbevelingen, restaurants en stranden te ontdekken.",
        qrScanWifi: "Scan om te verbinden!",
        qrScanGuide: "Reisgids",
        weatherClear: "Heldere hemel",
        weatherClouds: "Gedeeltelijk bewolkt",
        weatherFog: "Mist",
        weatherRain: "Lichte regen",
        weatherShowers: "Buien",
        weatherStorm: "Storm",
        weatherDefault: "Zonnig"
    }
};

// ==========================================
// 2. GESTIÓN DE DISPOSITIVO (DEVICE ID)
// ==========================================
function obtenerDeviceId() {
    // Si la URL lleva ?reset=true, forzamos un ID completamente nuevo e ignoramos la caché
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
        localStorage.removeItem("aruba_tv_device_id");
        const newId = 'tv_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
        localStorage.setItem("aruba_tv_device_id", newId);
        return newId;
    }

    let devId = localStorage.getItem("aruba_tv_device_id");
    if (!devId) {
        devId = 'tv_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
        localStorage.setItem("aruba_tv_device_id", devId);
    }
    return devId;
}

const currentDeviceId = obtenerDeviceId();
let lang = "es";
let ultimoCodigoClima = 0;

/// Pantalla de vinculación limpia, central y elegante
function mostrarPantallaEmparejamiento() {
    // Definimos la URL de administración respetando tu entorno de pruebas local
    //const urlAdminPair = `http://192.168.1.42:5500/admin.html?pair=${currentDeviceId}`;
    const urlAdminPair = `${window.location.origin}/admin.html?pair=${currentDeviceId}`;
    
    // Generamos la URL del servicio de códigos QR
    const qrPairUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(urlAdminPair)}`;

    // Reemplazamos el contenido del body por completo para vencer cualquier caché estática de la TV
    document.body.innerHTML = `
        <div id="bg1" class="background active" style="background-image: url('images/Eagle_Beach.jpg'); background-size: cover; background-position: center;"></div>
        <div id="bg2" class="background" style="background-size: cover; background-position: center;"></div>
        <div class="overlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.4); z-index: 1;"></div>

        <div style="
            position: relative;
            z-index: 10;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            width: 100vw;
            font-family: 'Poppins', sans-serif;
            color: #ffffff;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
        ">
            <div style="
                background: rgba(15, 23, 42, 0.85);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.15);
                padding: 40px 45px;
                border-radius: 28px;
                max-width: 520px;
                width: 100%;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
            ">
                <div style="font-size: 3rem; margin-bottom: 10px;">📺</div>
                <h1 style="
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    color: #38bdf8;
                    letter-spacing: -0.5px;
                ">Vincular Smart TV</h1>
                
                <p style="
                    font-size: 0.95rem;
                    line-height: 1.6;
                    color: #cbd5e1;
                    margin-bottom: 25px;
                ">
                    Escanea este código QR con tu teléfono móvil para autorizar esta pantalla y conectar tus datos.
                </p>

                <div style="
                    background: #ffffff;
                    padding: 16px;
                    border-radius: 20px;
                    display: inline-block;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                    margin-bottom: 20px;
                ">
                    <img src="${qrPairUrl}" alt="QR Vinculación" style="display: block; width: 200px; height: 200px; border-radius: 8px;">
                </div>

                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: #38bdf8;
                    font-weight: 500;
                    margin-bottom: 12px;
                ">
                    <span style="
                        width: 8px;
                        height: 8px;
                        background-color: #38bdf8;
                        border-radius: 50%;
                        display: inline-block;
                        box-shadow: 0 0 10px #38bdf8;
                    "></span>
                    Esperando autorización...
                </div>

                <p style="
                    font-size: 0.75rem;
                    color: #64748b;
                    letter-spacing: 0.5px;
                    font-family: monospace;
                    margin: 0;
                ">ID: ${currentDeviceId}</p>
            </div>
        </div>
    `;

    // Intentamos iniciar el carrusel de fondos de forma segura por si existen los elementos bg1/bg2
    try {
        if (typeof iniciarCarruselFondos === 'function') {
            iniciarCarruselFondos();
        }
    } catch (e) {
        console.warn("El carrusel de fondos se omitió en modo emparejamiento:", e);
    }
}

// Función auxiliar para mantener vivo el carrusel de fondo en la pantalla de carga
function iniciarCarruselFondos() {
    const bg1 = document.getElementById("bg1");
    const bg2 = document.getElementById("bg2");
    if (!bg1 || !bg2) return;

    let current = 0;
    let showingBg1 = true;

    setInterval(() => {
        current = (current + 1) % backgrounds.length;
        const nextImage = `url('${backgrounds[current]}')`;

        if (showingBg1) {
            bg2.style.backgroundImage = nextImage;
            bg2.classList.add("active");
            bg1.classList.remove("active");
        } else {
            bg1.style.backgroundImage = nextImage;
            bg1.classList.add("active");
            bg2.classList.remove("active");
        }
        showingBg1 = !showingBg1;
    }, 15000);
}

// Aplicar datos del huésped a la interfaz principal de la TV
function aplicarDatos(config) {
    const guest = config.guest_name || "Nuestros Invitados";
    lang = config.lang || "es";
    const wifi = config.wifi_name || "Aruba Paradise";
    const password = config.wifi_pass || "WelcomeAruba2026";
    const phone = config.phone || "+297 594 XXXX";
    const checkout = config.checkout || "11:00";
    const guide = config.guide_url || "https://aruba.com";

    const guestElem = document.getElementById("guest");
    if (guestElem) guestElem.textContent = guest;
    
    const langCode = translations[lang] ? lang : "es";
    const t = translations[langCode];

    const welcomeElem = document.getElementById("welcome");
    if (welcomeElem) welcomeElem.textContent = t.welcome;

    const messageElem = document.getElementById("message");
    if (messageElem) messageElem.textContent = t.message;

    const cardTitle1 = document.getElementById("cardTitle1");
    if (cardTitle1) cardTitle1.textContent = t.cardTitle1;

    const cardTitle2 = document.getElementById("cardTitle2");
    if (cardTitle2) cardTitle2.textContent = t.cardTitle2;

    const cardGuideDesc = document.getElementById("cardGuideDesc");
    if (cardGuideDesc) cardGuideDesc.textContent = t.cardGuideDesc;

    const qrScanWifi = document.getElementById("qrScanWifi");
    if (qrScanWifi) qrScanWifi.textContent = t.qrScanWifi;

    const qrScanGuide = document.getElementById("qrScanGuide");
    if (qrScanGuide) qrScanGuide.textContent = t.qrScanGuide;

    const wifiElem = document.getElementById("wifi");
    if (wifiElem) wifiElem.textContent = `📶 WiFi: ${wifi}`;

    const passwordElem = document.getElementById("password");
    if (passwordElem) passwordElem.textContent = `🔐 Password: ${password}`;

    const phoneElem = document.getElementById("phone");
    if (phoneElem) phoneElem.textContent = `📱 Host WhatsApp: ${phone}`;

    const checkoutElem = document.getElementById("checkout");
    if (checkoutElem) checkoutElem.textContent = `🔑 Check-out: ${checkout}`;

    // Generar QR de WiFi
    const wifiString = `WIFI:S:${wifi};T:WPA;P:${password};;`;
    const wifiQrElem = document.getElementById("wifiQrCode");
    if (wifiQrElem) {
        wifiQrElem.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(wifiString)}`;
    }

    // Adaptación inteligente URL Aruba y QR de Guía
    let guiaFinal = guide;
    if (guide.includes("aruba.com")) {
        const arubaLangs = { es: "es", en: "us", de: "de", nl: "nl" };
        const sufijo = arubaLangs[langCode] || "us";
        let urlBase = guide.replace(/\/([a-z]{2})(\/|$).*/, "").replace(/\/+$/, "");
        guiaFinal = `${urlBase}/${sufijo}`;
    }

    const guideQrElem = document.getElementById("guideQrCode");
    if (guideQrElem) {
        guideQrElem.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(guiaFinal)}`;
    }

    const guideText = document.getElementById("guideText");
    if (guideText) {
        guideText.textContent = guiaFinal.replace('https://', '').replace('http://', '');
    }
    
    actualizarTextoClima(ultimoCodigoClima, langCode);
    updateClock();
}

// ==========================================
// 3. COMPROBACIÓN DE VINCULACIÓN Y TIEMPO REAL
// ==========================================
async function verificarVinculacionYCargar() {
    try {
        // 1. Verificar si este dispositivo está autorizado en la tabla
        const { data: deviceRecord, error: devErr } = await supabaseClient
            .from('authorized_devices')
            .select('*')
            .eq('device_id', currentDeviceId)
            .maybeSingle();

        if (devErr) throw devErr;

        // 2. Si no está vinculado O el registro en la BD quedó huérfano, forzamos el QR
        if (!deviceRecord) {
            // Limpieza preventiva de localStorage para navegadores cerrados de TV
            localStorage.removeItem("aruba_tv_device_id");
            currentDeviceId = obtenerDeviceId(); // Genera uno nuevo y limpio

            mostrarPantallaEmparejamiento();

            // Escucha por WebSockets para cuando se autorice desde el móvil
            supabaseClient
                .channel('waiting_for_pairing')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'authorized_devices', filter: `device_id=eq.${currentDeviceId}` },
                    () => {
                        window.location.reload();
                    }
                )
                .subscribe();

            // Sondeo rápido de respaldo cada 3 segundos (detecta el emparejamiento al instante)
            const intervaloEspera = setInterval(async () => {
                const { data: checkDevice } = await supabaseClient
                    .from('authorized_devices')
                    .select('id')
                    .eq('device_id', currentDeviceId)
                    .maybeSingle();

                if (checkDevice) {
                    clearInterval(intervaloEspera);
                    window.location.reload();
                }
            }, 3000);

            return;
        }

        // 3. Si SÍ está vinculado, obtenemos el email y su configuración correspondiente
        const userEmail = deviceRecord.user_email;
        const { data: config, error: configErr } = await supabaseClient
            .from('apartments_config')
            .select('*')
            .eq('user_email', userEmail)
            .single();

        if (configErr || !config) {
            console.error("Configuración no encontrada para el usuario:", userEmail);
            mostrarPantallaEmparejamiento();
            return;
        }

        // Si la cuenta está suspendida, bloquear acceso
        if (config.is_suspended) {
            alert("Esta cuenta ha sido suspendida por el administrador.");
            localStorage.clear();
            location.reload();
            return;
        }

        // 4. ¡Pintar los datos reales en la interfaz de la TV!
        aplicarDatos(config);

        // 5. Activar el sistema de sincronización automática en segundo plano
        activarSincronizacionEnTiempoReal(userEmail);

    } catch (e) {
        console.error("Error al verificar vinculación:", e);
    }
}

function activarSincronizacionEnTiempoReal(userEmail) {
    // Escucha de cambios en tiempo real (WebSockets)
    try {
        supabaseClient
            .channel('cambios-dispositivo-dinamico')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'apartments_config', filter: `user_email=eq.${userEmail}` },
                (payload) => {
                    if (payload.new.is_suspended) {
                        localStorage.clear();
                        location.reload();
                    } else {
                        aplicarDatos(payload.new);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'authorized_devices', filter: `device_id=eq.${currentDeviceId}` },
                () => {
                    localStorage.removeItem('aruba_tv_device_id');
                    location.reload();
                }
            )
            .subscribe();
    } catch (e) {
        console.warn("Realtime no disponible, operando con sondeo periódico.");
    }

    // Sondeo de respaldo cada 5 segundos para actualizar datos o detectar desvinculación
    setInterval(async () => {
        try {
            const { data: config } = await supabaseClient
                .from('apartments_config')
                .select('*')
                .eq('user_email', userEmail)
                .single();

            if (config) {
                if (config.is_suspended) {
                    localStorage.clear();
                    location.reload();
                    return;
                }
                aplicarDatos(config);
            }

            const { data: device } = await supabaseClient
                .from('authorized_devices')
                .select('id')
                .eq('device_id', currentDeviceId)
                .maybeSingle();

            if (!device) {
                localStorage.removeItem('aruba_tv_device_id');
                location.reload();
            }
        } catch (err) {
            console.error("Error en sondeo automático:", err);
        }
    }, 5000);
}

verificarVinculacionYCargar();

// ==========================================
// 4. RELOJ EN TIEMPO REAL
// ==========================================
function updateClock() {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    const langCode = translations[lang] ? lang : "es";
    const clockElem = document.getElementById("clock");
    if (clockElem) clockElem.textContent = now.toLocaleDateString(langCode, options);
}
setInterval(updateClock, 1000);

// ==========================================
// 5. CARRUSEL DE IMÁGENES DE FONDO (CROSSFADE)
// ==========================================
const backgrounds = [
    "images/Eagle_Beach.jpg",
    "images/Baby_Beach.jpg",
    "images/Palm_Beach.jpg",
    "images/california-aruba.jpg"
];

const bg1 = document.getElementById("bg1");
const bg2 = document.getElementById("bg2");
let current = 0;
let showingBg1 = true;

if (bg1) {
    bg1.style.backgroundImage = `url('${backgrounds[0]}')`;
    bg1.classList.add("active");

    backgrounds.forEach(src => {
        const img = new Image();
        img.src = src;
    });

    setInterval(() => {
        current = (current + 1) % backgrounds.length;
        const nextImage = `url('${backgrounds[current]}')`;

        if (showingBg1) {
            if (bg2) { bg2.style.backgroundImage = nextImage; bg2.classList.add("active"); }
            bg1.classList.remove("active");
        } else {
            bg1.style.backgroundImage = nextImage;
            bg1.classList.add("active");
            if (bg2) bg2.classList.remove("active");
        }
        showingBg1 = !showingBg1;
    }, 15000);
}

// ==========================================
// 6. REPRODUCCIÓN Y CONTROL DE AUDIO AMBIENTAL
// ==========================================
const audio = document.getElementById("oceanAudio");
if (audio) audio.volume = 0.10;

const muteBtn = document.getElementById("muteBtn");

function iniciarAudio() {
    if (!audio) return;
    audio.play().then(() => {
        if (muteBtn) muteBtn.innerHTML = "🔊";
    }).catch(err => {
        console.log("Esperando interacción para audio:", err);
    });

    document.removeEventListener("click", iniciarAudio);
    document.removeEventListener("keydown", iniciarAudio);
}

document.addEventListener("click", iniciarAudio, { once: true });
document.addEventListener("keydown", iniciarAudio, { once: true });

if (muteBtn) {
    muteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!audio) return;

        try {
            if (audio.paused) {
                await audio.play();
                audio.muted = false;
                muteBtn.innerHTML = "🔊";
            } else {
                audio.muted = !audio.muted;
                muteBtn.innerHTML = audio.muted ? "🔇" : "🔊";
            }
        } catch (err) {
            console.error("Error audio:", err);
        }
    });
}

// ==========================================
// 7. WIDGET DEL CLIMA EN TIEMPO REAL (ARUBA)
// ==========================================
function actualizarTextoClima(code, langCode) {
    ultimoCodigoClima = code;
    const t = translations[langCode] || translations["es"];
    
    let desc = t.weatherDefault;
    let icon = "☀️";
    
    if (code === 0) { desc = t.weatherClear; icon = "☀️"; }
    else if (code >= 1 && code <= 3) { desc = t.weatherClouds; icon = "⛅"; }
    else if (code >= 45 && code <= 48) { desc = t.weatherFog; icon = "🌫️"; }
    else if (code >= 51 && code <= 67) { desc = t.weatherRain; icon = "🌦️"; }
    else if (code >= 80 && code <= 82) { desc = t.weatherShowers; icon = "🌧️"; }
    else if (code >= 95) { desc = t.weatherStorm; icon = "⛈️"; }
    
    const iconElem = document.getElementById("weatherIcon");
    const descElem = document.getElementById("weatherDesc");
    
    if (iconElem) iconElem.textContent = icon;
    if (descElem) descElem.textContent = desc;
}

async function fetchArubaWeather() {
    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=12.524&longitude=-70.027&current_weather=true");
        const data = await res.json();
        
        if (data && data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            
            const tempElem = document.getElementById("weatherTemp");
            if (tempElem) tempElem.textContent = `${temp}°C`;
            
            actualizarTextoClima(code, lang);
        }
    } catch (err) {
        console.error("Error al obtener el clima:", err);
    }
}

fetchArubaWeather();
setInterval(fetchArubaWeather, 15 * 60 * 1000);