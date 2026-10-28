// ==========================================
// 0. CONFIGURACIÓN SUPABASE (API REST CON XMLHttpRequest)
// ==========================================
// Escrito en ES5 puro para funcionar en navegadores de Smart TV antiguos:
// sin async/await, sin const/let, sin flechas, sin plantillas ``, sin fetch.
var SUPABASE_URL = 'https://wyyurayswvzuovofyseh.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_G8iz7v3aOpS1fFSoTOT56Q_fmbLi8x3';

// La TV NO lee tablas: llama a una función de la base de datos que le devuelve
// únicamente los datos de su propio device_id. cb(error, respuesta)
function obtenerConfigTv(deviceId, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', SUPABASE_URL + '/rest/v1/rpc/tv_obtener_config', true);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 15000;
    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
            var datos;
            try {
                datos = JSON.parse(xhr.responseText);
            } catch (e) {
                cb(new Error('Respuesta no válida del servidor'));
                return;
            }
            cb(null, datos);
        } else if (xhr.status === 0) {
            cb(new Error('Sin conexión con el servidor'));
        } else {
            cb(new Error('HTTP ' + xhr.status));
        }
    };
    xhr.send(JSON.stringify({ p_device_id: deviceId }));
}

// Aviso de error visible en la TV (no tiene consola)
function mostrarAviso(texto) {
    var aviso = document.getElementById('avisoError');
    if (!aviso) {
        aviso = document.createElement('div');
        aviso.id = 'avisoError';
        aviso.style.cssText = 'position:fixed;bottom:20px;left:50%;margin-left:-40%;width:80%;text-align:center;background:#b91c1c;color:#fff;padding:12px 20px;border-radius:10px;z-index:9999;font-size:1rem;';
        document.body.appendChild(aviso);
    }
    aviso.textContent = texto;
}

function ocultarAviso() {
    var aviso = document.getElementById('avisoError');
    if (aviso && aviso.parentNode) aviso.parentNode.removeChild(aviso);
}

// Lee un parámetro de la URL (sustituye a URLSearchParams)
function leerParametroUrl(nombre) {
    var m = new RegExp('[?&]' + nombre + '=([^&#]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : null;
}

// ==========================================
// 1. DICCIONARIO DE TRADUCCIONES COMPLETO
// ==========================================
var translations = {
    es: {
        welcome: "Bienvenidos a Aruba",
        message: "Esperamos que disfruten de una estancia inolvidable.",
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
// localStorage es por dominio, no por carpeta. Incluir la carpeta en la clave hace que
// dogid.es/andres/ y dogid.es/sora/ tengan cada una su propio ID de dispositivo.
var CLAVE_DEVICE_ID = 'aruba_tv_device_id:' + window.location.pathname.replace(/[^\/]*$/, '');
var CLAVE_DEVICE_ID_ANTIGUA = 'aruba_tv_device_id';

function generarDeviceId() {
    var aleatorio = '';
    try {
        var bytes = new Uint8Array(16);
        (window.crypto || window.msCrypto).getRandomValues(bytes);
        for (var i = 0; i < bytes.length; i++) {
            aleatorio += ('0' + bytes[i].toString(16)).slice(-2);
        }
    } catch (e) {
        aleatorio = Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
    }
    return 'tv_' + aleatorio;
}

function obtenerDeviceId() {
    if (leerParametroUrl('reset') === 'true') {
        var nuevoId = generarDeviceId();
        localStorage.setItem(CLAVE_DEVICE_ID, nuevoId);
        // Quitamos ?reset=true de la URL para no regenerar el ID en cada recarga
        try {
            if (window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (e) {
            // Algunos navegadores no permiten cambiar la URL en file:// (pruebas en local)
        }
        return nuevoId;
    }

    var devId = localStorage.getItem(CLAVE_DEVICE_ID);
    if (!devId) {
        // Migración: las TV ya vinculadas conservan su ID (solo en la primera carpeta que lo reclame)
        var idAntiguo = localStorage.getItem(CLAVE_DEVICE_ID_ANTIGUA);
        if (idAntiguo) {
            devId = idAntiguo;
            localStorage.removeItem(CLAVE_DEVICE_ID_ANTIGUA);
        } else {
            devId = generarDeviceId();
        }
        localStorage.setItem(CLAVE_DEVICE_ID, devId);
    }
    return devId;
}

var currentDeviceId = obtenerDeviceId();
var lang = "es";
var ultimoCodigoClima = 0;
var ultimaConfigAplicada = '';

// Pantalla de vinculación limpia, central y elegante
function mostrarPantallaEmparejamiento() {
    var pathSegments = window.location.pathname.split('/');
    pathSegments.pop();
    var baseSubpath = pathSegments.join('/');
    var basePath = window.location.origin + (baseSubpath.charAt(0) === '/' ? baseSubpath : '/' + baseSubpath);

    var urlAdminPair = basePath + '/admin.html?pair=' + currentDeviceId;
    var qrPairUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(urlAdminPair);

    document.body.innerHTML =
        '<div id="bg1" class="background active" style="background-image: url(\'images/Eagle_Beach.jpg\'); background-size: cover; background-position: center;"></div>' +
        '<div id="bg2" class="background" style="background-size: cover; background-position: center;"></div>' +
        '<div class="overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1;"></div>' +

        '<div style="position: relative; z-index: 10; display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; font-family: \'Poppins\', sans-serif; color: #ffffff; text-align: center; padding: 20px; box-sizing: border-box;">' +
            '<div style="background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(255, 255, 255, 0.15); padding: 40px 45px; border-radius: 28px; max-width: 520px; width: 100%; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);">' +
                '<div style="font-size: 3rem; margin-bottom: 10px;">📺</div>' +
                '<h1 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 12px; color: #38bdf8;">Vincular Smart TV</h1>' +
                '<p style="font-size: 0.95rem; line-height: 1.6; color: #cbd5e1; margin-bottom: 25px;">' +
                    'Escanea este código QR con tu teléfono móvil para autorizar esta pantalla y conectar tus datos.' +
                '</p>' +
                '<div style="background: #ffffff; padding: 16px; border-radius: 20px; display: inline-block; box-shadow: 0 10px 25px rgba(0,0,0,0.3); margin-bottom: 20px;">' +
                    '<img src="' + qrPairUrl + '" alt="QR Vinculación" style="display: block; width: 200px; height: 200px; border-radius: 8px;">' +
                '</div>' +
                '<div style="font-size: 0.85rem; color: #38bdf8; font-weight: 500; margin-bottom: 12px;">' +
                    '● Esperando autorización...' +
                '</div>' +
                '<p style="font-size: 0.75rem; color: #64748b; letter-spacing: 0.5px; font-family: monospace; margin: 0;">ID: ' + currentDeviceId + '</p>' +
            '</div>' +
        '</div>';
}

// Aplicar datos del huésped a la interfaz principal de la TV
function ponerTexto(id, texto) {
    var el = document.getElementById(id);
    if (el) el.textContent = texto;
}

function aplicarDatos(config) {
    if (!config) {
        console.error("¡Atención! El objeto config llegó vacío o nulo.");
        return;
    }

    var guest = config.guest_name || "Nuestros Invitados";
    lang = config.lang || "es";
    var wifi = config.wifi_name || "Aruba Paradise";
    var password = config.wifi_pass || "WelcomeAruba2026";
    var phone = config.phone || "+297 594 XXXX";
    var checkout = config.checkout || "11:00";
    var guide = config.guide_url || "https://aruba.com";

    var langCode = translations[lang] ? lang : "es";
    var t = translations[langCode];

    ponerTexto("guest", guest);
    ponerTexto("welcome", t.welcome);
    ponerTexto("message", t.message);
    ponerTexto("cardTitle1", t.cardTitle1);
    ponerTexto("cardTitle2", t.cardTitle2);
    ponerTexto("cardGuideDesc", t.cardGuideDesc);
    ponerTexto("qrScanWifi", t.qrScanWifi);
    ponerTexto("qrScanGuide", t.qrScanGuide);
    ponerTexto("wifi", "📶 WiFi: " + wifi);
    ponerTexto("password", "🔐 Password: " + password);
    ponerTexto("phone", "📱 Host WhatsApp: " + phone);
    ponerTexto("checkout", "🔑 Check-out: " + checkout);

    var wifiString = "WIFI:S:" + wifi + ";T:WPA;P:" + password + ";;";
    var wifiQrElem = document.getElementById("wifiQrCode");
    if (wifiQrElem) {
        wifiQrElem.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(wifiString);
    }

    var guiaFinal = guide;
    if (guide.indexOf("aruba.com") !== -1) {
        var arubaLangs = { es: "es", en: "us", de: "de", nl: "nl" };
        var sufijo = arubaLangs[langCode] || "us";
        var urlBase = guide.replace(/\/([a-z]{2})(\/|$).*/, "").replace(/\/+$/, "");
        guiaFinal = urlBase + "/" + sufijo;
    }

    var guideQrElem = document.getElementById("guideQrCode");
    if (guideQrElem) {
        guideQrElem.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(guiaFinal);
    }

    ponerTexto("guideText", guiaFinal.replace('https://', '').replace('http://', ''));

    actualizarTextoClima(ultimoCodigoClima, langCode);
    updateClock();
}

// ==========================================
// 3. COMPROBACIÓN DE VINCULACIÓN Y SONDEO
// ==========================================
function reiniciarDispositivo() {
    localStorage.removeItem(CLAVE_DEVICE_ID);
    location.reload();
}

// Pantalla de bloqueo por cuenta suspendida. NO borra nada: la TV conserva su identidad
// y, cuando se reactiva la cuenta, vuelve sola a su estado anterior.
function mostrarSuspension() {
    var el = document.getElementById('suspensionOverlay');
    if (!el) {
        el = document.createElement('div');
        el.id = 'suspensionOverlay';
        el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0f172a;color:#ffffff;z-index:99998;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;font-family:Poppins,sans-serif;padding:5%;';
        el.innerHTML =
            '<div style="font-size:5rem;margin-bottom:1.5rem;">⏸️</div>' +
            '<h1 style="font-size:3rem;font-weight:700;color:#38bdf8;margin-bottom:1rem;">Servicio suspendido temporalmente</h1>' +
            '<p style="font-size:1.6rem;opacity:0.9;margin-bottom:2rem;">Contacta con tu anfitrión o con el administrador.</p>' +
            '<p style="font-size:1.3rem;opacity:0.7;">Service temporarily suspended. Please contact your host.</p>';
        document.body.appendChild(el);
    }
    el.style.display = 'flex';
    if (typeof audio !== 'undefined' && audio) {
        try { audio.pause(); } catch (e) {}
    }
}

function ocultarSuspension() {
    var el = document.getElementById('suspensionOverlay');
    if (el && el.style.display !== 'none') {
        el.style.display = 'none';
        if (typeof audio !== 'undefined' && audio) {
            intentarReproducir(function () {});
        }
    }
}

function verificarVinculacionYCargar() {
    obtenerConfigTv(currentDeviceId, function (err, respuesta) {
        if (err) {
            console.error("Error al verificar vinculación:", err);
            mostrarAviso('Error de conexión: ' + err.message + ' — reintentando...');
            setTimeout(verificarVinculacionYCargar, 10000);
            return;
        }

        // --- Dispositivo todavía sin vincular: QR y espera ---
        if (!respuesta || !respuesta.vinculado) {
            mostrarPantallaEmparejamiento();

            var intervaloEspera = setInterval(function () {
                obtenerConfigTv(currentDeviceId, function (err2, check) {
                    if (!err2 && check && check.vinculado) {
                        clearInterval(intervaloEspera);
                        window.location.reload();
                    }
                });
            }, 3000);
            return;
        }

        // --- Dispositivo vinculado: la configuración ya viene mezclada desde el servidor ---
        var config = respuesta.config;
        if (!config) {
            console.error("Configuración no encontrada para esta pantalla");
            mostrarPantallaEmparejamiento();
            return;
        }

        ocultarAviso();
        if (config.is_suspended) {
            // Cuenta suspendida: se bloquea la pantalla pero se conserva el dispositivo
            ultimaConfigAplicada = '';
            mostrarSuspension();
        } else {
            ultimaConfigAplicada = JSON.stringify(config);
            aplicarDatos(config);
        }
        iniciarSondeo();
    });
}

// Sondeo cada 5 s: detecta cambios de configuración, suspensión y desvinculación
function iniciarSondeo() {
    var enCurso = false;

    setInterval(function () {
        if (enCurso) return;
        enCurso = true;

        obtenerConfigTv(currentDeviceId, function (err, respuesta) {
            enCurso = false;

            if (err) {
                // Un fallo de red NO debe desvincular la TV: se reintenta en el siguiente ciclo
                console.error("Error en sondeo automático:", err);
                return;
            }

            if (!respuesta || !respuesta.vinculado) {
                reiniciarDispositivo();
                return;
            }

            var config = respuesta.config;
            if (!config) return;

            if (config.is_suspended) {
                mostrarSuspension();
                return;
            }
            ocultarSuspension();

            var huella = JSON.stringify(config);
            if (huella !== ultimaConfigAplicada) {
                ultimaConfigAplicada = huella;
                aplicarDatos(config);
            }
            ocultarAviso();
        });
    }, 5000);
}

verificarVinculacionYCargar();

// ==========================================
// 4. RELOJ EN TIEMPO REAL
// ==========================================
function updateClock() {
    var now = new Date();
    var options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    var langCode = translations[lang] ? lang : "es";
    var clockElem = document.getElementById("clock");
    if (clockElem) clockElem.textContent = now.toLocaleDateString(langCode, options);
}
setInterval(updateClock, 1000);
updateClock();

// ==========================================
// 5. CARRUSEL DE IMÁGENES DE FONDO (CROSSFADE)
// ==========================================
var backgrounds = [
    "images/Eagle_Beach.jpg",
    "images/Baby_Beach.jpg",
    "images/Palm_Beach.jpg",
    "images/california-aruba.jpg"
];

var bg1 = document.getElementById("bg1");
var bg2 = document.getElementById("bg2");
var current = 0;
var showingBg1 = true;

if (bg1) {
    bg1.style.backgroundImage = "url('" + backgrounds[0] + "')";
    bg1.classList.add("active");

    for (var i = 0; i < backgrounds.length; i++) {
        var imgPrecarga = new Image();
        imgPrecarga.src = backgrounds[i];
    }

    setInterval(function () {
        current = (current + 1) % backgrounds.length;
        var nextImage = "url('" + backgrounds[current] + "')";

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
var audio = document.getElementById("oceanAudio");
if (audio) audio.volume = 0.10;

var muteBtn = document.getElementById("muteBtn");

// play() devuelve una promesa en navegadores modernos y undefined en los antiguos
function intentarReproducir(cb) {
    var p;
    try {
        p = audio.play();
    } catch (e) {
        cb(false);
        return;
    }
    if (p && typeof p.then === 'function') {
        p.then(function () { cb(true); }, function () { cb(false); });
    } else {
        cb(true);
    }
}

function iniciarAudio() {
    document.removeEventListener("click", iniciarAudio);
    document.removeEventListener("keydown", iniciarAudio);
    if (!audio) return;
    intentarReproducir(function (ok) {
        if (ok && muteBtn) muteBtn.innerHTML = "🔊";
    });
}

document.addEventListener("click", iniciarAudio);
document.addEventListener("keydown", iniciarAudio);

if (muteBtn) {
    muteBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!audio) return;

        if (audio.paused) {
            intentarReproducir(function (ok) {
                if (ok) {
                    audio.muted = false;
                    muteBtn.innerHTML = "🔊";
                }
            });
        } else {
            audio.muted = !audio.muted;
            muteBtn.innerHTML = audio.muted ? "🔇" : "🔊";
        }
    });
}

// ==========================================
// 7. WIDGET DEL CLIMA EN TIEMPO REAL (ARUBA)
// ==========================================
function actualizarTextoClima(code, langCode) {
    ultimoCodigoClima = code;
    var t = translations[langCode] || translations["es"];

    var desc = t.weatherDefault;
    var icon = "☀️";

    if (code === 0) { desc = t.weatherClear; icon = "☀️"; }
    else if (code >= 1 && code <= 3) { desc = t.weatherClouds; icon = "⛅"; }
    else if (code >= 45 && code <= 48) { desc = t.weatherFog; icon = "🌫️"; }
    else if (code >= 51 && code <= 67) { desc = t.weatherRain; icon = "🌦️"; }
    else if (code >= 80 && code <= 82) { desc = t.weatherShowers; icon = "🌧️"; }
    else if (code >= 95) { desc = t.weatherStorm; icon = "⛈️"; }

    var iconElem = document.getElementById("weatherIcon");
    var descElem = document.getElementById("weatherDesc");

    if (iconElem) iconElem.textContent = icon;
    if (descElem) descElem.textContent = desc;
}

function fetchArubaWeather() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.open-meteo.com/v1/forecast?latitude=12.524&longitude=-70.027&current_weather=true', true);
    xhr.timeout = 15000;
    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status < 200 || xhr.status >= 300) {
            console.error("Error al obtener el clima: HTTP " + xhr.status);
            return;
        }
        try {
            var data = JSON.parse(xhr.responseText);
            if (data && data.current_weather) {
                var temp = Math.round(data.current_weather.temperature);
                var code = data.current_weather.weathercode;
                ponerTexto("weatherTemp", temp + "°C");
                actualizarTextoClima(code, lang);
            }
        } catch (err) {
            console.error("Error al procesar el clima:", err);
        }
    };
    xhr.send();
}

fetchArubaWeather();
setInterval(fetchArubaWeather, 15 * 60 * 1000);