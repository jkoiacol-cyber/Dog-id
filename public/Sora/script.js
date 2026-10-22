// ==========================================
// 1. DICCIONARIO DE TRADUCCIONES
// ==========================================
const translations = {
    es: {
        welcome: "Bienvenidos a Aruba",
        message: "Esperamos que disfrutéis de una estancia inolvidable."
    },
    en: {
        welcome: "Welcome to Aruba",
        message: "We hope you enjoy an unforgettable stay."
    },
    de: {
        welcome: "Willkommen auf Aruba",
        message: "Wir wünschen Ihnen einen unvergesslichen Aufenthalt."
    },
    nl: {
        welcome: "Welkom op Aruba",
        message: "Wij hopen dat jullie een onvergetelijk verblijf hebben."
    }
};

// ==========================================
// 2. PARÁMETROS DE URL / VALORES POR DEFECTO
// ==========================================
const params = new URLSearchParams(window.location.search);

let guest = params.get("name") || "Nuestros Invitados";
let lang = params.get("lang") || "es";
let wifi = params.get("wifi") || "Aruba Paradise";
let password = params.get("pass") || "WelcomeAruba2026";
let phone = params.get("phone") || "+297 594 XXXX";
let checkout = params.get("checkout") || "11:00";
let guide = params.get("guide") || "https://guide.arubaparadisestay.com";

// Función principal para renderizar todos los datos en el DOM
function aplicarDatos(g, l, w, p, ph, ch, gu) {
    document.getElementById("guest").textContent = g;
    
    const langCode = translations[l] ? l : "es";
    document.getElementById("welcome").textContent = translations[langCode].welcome;
    document.getElementById("message").textContent = translations[langCode].message;

    document.getElementById("wifi").textContent = `📶 WiFi: ${w}`;
    document.getElementById("password").textContent = `🔐 Password: ${p}`;
    document.getElementById("phone").textContent = `📱 Host WhatsApp: ${ph}`;
    document.getElementById("checkout").textContent = `🔑 Check-out: ${ch}`;

    // Generar código QR automático de conexión WiFi directa
    const wifiString = `WIFI:S:${w};T:WPA;P:${p};;`;
    document.getElementById("wifiQrCode").src =
        `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(wifiString)}`;

    // Generar código QR de la Guía Digital
    document.getElementById("guideQrCode").src =
        `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(gu)}`;
    
    document.getElementById("guideText").textContent = gu.replace('https://', '').replace('http://', '');
    
    updateClock();
}

// Aplicar valores iniciales
aplicarDatos(guest, lang, wifi, password, phone, checkout, guide);

// ==========================================
// 3. CARGA DE CONFIGURACIÓN DESDE LA NUBE (npoint.io)
// ==========================================
async function cargarConfiguracionServidor() {
    try {
        const res = await fetch('https://api.npoint.io/7849d49f301ab0b1f2f9?v=' + new Date().getTime());
        if (res.ok) {
            const config = await res.json();
            
            guest = config.name || guest;
            lang = config.lang || lang;
            wifi = config.wifi || wifi;
            password = config.pass || password;
            phone = config.phone || phone;
            checkout = config.checkout || checkout;
            guide = config.guide || guide;

            aplicarDatos(guest, lang, wifi, password, phone, checkout, guide);
        }
    } catch (e) {
        console.log("Manteniendo valores por defecto o de URL:", e);
    }
}

cargarConfiguracionServidor();

// ==========================================
// 4. RELOJ EN TIEMPO REAL
// ==========================================
function updateClock() {
    const now = new Date();
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    const langCode = translations[lang] ? lang : "es";
    document.getElementById("clock").textContent = now.toLocaleDateString(langCode, options);
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

// ==========================================
// 6. REPRODUCCIÓN Y CONTROL DE AUDIO AMBIENTAL
// ==========================================
const audio = document.getElementById("oceanAudio");
if (audio) {
    audio.volume = 0.10;
}

const muteBtn = document.getElementById("muteBtn");

function iniciarAudio() {
    if (!audio) return;
    audio.play().then(() => {
        console.log("Audio de ambiente iniciado correctamente");
        if (muteBtn) muteBtn.innerHTML = "🔊";
    }).catch(err => {
        console.log("Esperando interacción para reproducir audio:", err);
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
            console.error("Error al controlar el audio:", err);
        }
    });
}

// ==========================================
// 7. WIDGET DEL CLIMA EN TIEMPO REAL (ARUBA)
// ==========================================
async function fetchArubaWeather() {
    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=12.524&longitude=-70.027&current_weather=true");
        const data = await res.json();
        
        if (data && data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            
            const tempElem = document.getElementById("weatherTemp");
            if (tempElem) tempElem.textContent = `${temp}°C`;
            
            let desc = "Soleado";
            let icon = "☀️";
            
            if (code === 0) { desc = "Cielo despejado"; icon = "☀️"; }
            else if (code >= 1 && code <= 3) { desc = "Parcialmente nublado"; icon = "⛅"; }
            else if (code >= 45 && code <= 48) { desc = "Niebla"; icon = "🌫️"; }
            else if (code >= 51 && code <= 67) { desc = "Lluvia ligera"; icon = "🌦️"; }
            else if (code >= 80 && code <= 82) { desc = "Chubascos"; icon = "🌧️"; }
            else if (code >= 95) { desc = "Tormenta"; icon = "⛈️"; }
            
            const iconElem = document.getElementById("weatherIcon");
            const descElem = document.getElementById("weatherDesc");
            
            if (iconElem) iconElem.textContent = icon;
            if (descElem) descElem.textContent = desc;
        }
    } catch (err) {
        console.error("Error al obtener el clima:", err);
        const descElem = document.getElementById("weatherDesc");
        if (descElem) descElem.textContent = "Aruba 29°C";
    }
}

fetchArubaWeather();
setInterval(fetchArubaWeather, 15 * 60 * 1000);