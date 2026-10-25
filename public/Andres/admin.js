// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://wyyurayswvzuovofyseh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G8iz7v3aOpS1fFSoTOT56Q_fmbLi8x3';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let usuarioActual = null;

// ==========================================
// CICLO DE VIDA Y SESIÓN
// ==========================================
async function verificarSesion() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            usuarioActual = session.user;
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('appSection').style.display = 'block';

            // 1. Procesar QR pendiente si viene en la URL (?pair=tv_xxx)
            await procesarEmparejamientoPendiente();

            // 2. Cargar datos del apartamento y dispositivos
            await cargarDatosApartamento();
            await cargarGestionDispositivos(usuarioActual.email);
        } else {
            document.getElementById('authSection').style.display = 'block';
            document.getElementById('appSection').style.display = 'none';
        }
    } catch (err) {
        console.error("Error al verificar sesión:", err);
    }
}

// Iniciar Sesión
async function iniciarSesion(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert('Error al iniciar sesión: ' + error.message);
    } else {
        window.location.reload();
    }
}

// Cerrar Sesión
async function cerrarSesion() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

// ==========================================
// GESTIÓN DE DISPOSITIVOS Y LICENCIAS
// ==========================================
async function cargarGestionDispositivos(userEmail) {
    try {
        // 1. Obtener datos de configuración y límites
        const { data: config } = await supabaseClient
            .from('apartments_config')
            .select('max_devices, unbind_count, max_unbinds')
            .eq('user_email', userEmail)
            .maybeSingle();

        const maxDevices = config?.max_devices || 1;
        const unbindCount = config?.unbind_count || 0;
        const maxUnbinds = config?.max_unbinds || 2;
        const remainingUnbinds = Math.max(0, maxUnbinds - unbindCount);

        // 2. Obtener la lista de dispositivos autorizados
        const { data: devices } = await supabaseClient
            .from('authorized_devices')
            .select('*')
            .eq('user_email', userEmail);

        const currentDevices = devices ? devices.length : 0;

        // Actualizar encabezado de licencias
        const licenseInfoElem = document.getElementById('licenseInfo');
        if (licenseInfoElem) {
            licenseInfoElem.innerHTML = `Ocupación de licencias: <strong>${currentDevices} / ${maxDevices}</strong> pantallas activas.`;
        }

        // Actualizar aviso de desvinculaciones restantes
        const remainingElem = document.getElementById('remainingUnbinds');
        const warningElem = document.getElementById('unbindWarning');
        
        if (remainingElem) remainingElem.textContent = remainingUnbinds;

        if (remainingUnbinds === 0 && warningElem) {
            warningElem.style.borderLeftColor = '#ef4444';
            warningElem.style.background = 'rgba(239, 68, 68, 0.1)';
            warningElem.innerHTML = `
                ⚠️ <strong>Has alcanzado el límite de 2 desvinculaciones.</strong><br>
                Si necesitas cambiar de dispositivo o has tenido un problema, 
                <a href="mailto:nikomio7@hotmail.com?subject=Solicitud%20de%20reset%20de%20dispositivo%20-${encodeURIComponent(userEmail)}&body=Hola,%20necesito%20desvincular%20una%20pantalla%20pero%20he%20alcanzado%20el%20l%C3%ADmite." 
                   style="color: #38bdf8; text-decoration: underline; font-weight: 600;">
                   contacta con el administrador por correo aquí
                </a>.
            `;
        }

        // 3. Renderizar la lista de dispositivos
        const container = document.getElementById('devicesList');
        if (!container) return;

        if (!devices || devices.length === 0) {
            container.innerHTML = `<p style="color: #64748b; font-size: 0.9rem;">No hay ninguna Smart TV vinculada actualmente.</p>`;
            return;
        }

        container.innerHTML = devices.map(dev => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 12px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px;">
                <div>
                    <div style="font-weight: 600; color: #f8fafc; font-size: 0.95rem;">📺 ${dev.device_name || 'Smart TV'}</div>
                    <div style="font-size: 0.75rem; color: #64748b; font-family: monospace;">ID: ${dev.device_id}</div>
                </div>
                <button onclick="desvincularDispositivo('${dev.device_id}', ${unbindCount}, ${maxUnbinds}, '${userEmail}')" 
                        style="background: #ef4444; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-size: 0.85rem; cursor: pointer; font-weight: 500; transition: background 0.2s;">
                    Desvincular
                </button>
            </div>
        `).join('');

    } catch (err) {
        console.error("Error al cargar dispositivos:", err);
    }
}

// ==========================================
// ACCIÓN DE DESVINCULAR DISPOSITIVO
// ==========================================
async function desvincularDispositivo(deviceId, currentUnbinds, maxUnbinds, userEmail) {
    if (currentUnbinds >= maxUnbinds) {
        alert("Has alcanzado el límite de 2 desvinculaciones. Ponte en contacto con el soporte técnico mediante el enlace inferior.");
        return;
    }

    const restantes = maxUnbinds - (currentUnbinds + 1);
    const confirmar = confirm(`¿Estás seguro de que deseas desvincular esta pantalla?\n\nTe quedará ${restantes} cambio disponible.`);
    if (!confirmar) return;

    try {
        const { error: delErr } = await supabaseClient
            .from('authorized_devices')
            .delete()
            .eq('device_id', deviceId);

        if (delErr) throw delErr;

        await supabaseClient
            .from('apartments_config')
            .upsert({ 
                user_email: userEmail, 
                unbind_count: currentUnbinds + 1 
            }, { onConflict: 'user_email' });

        alert("Dispositivo desvinculado con éxito.");
        await cargarGestionDispositivos(userEmail);

    } catch (err) {
        console.error("Error al desvincular:", err);
        alert("Error al desvincular el dispositivo: " + err.message);
    }
}

// ==========================================
// VINCULACIÓN POR QR (?pair=tv_xxx)
// ==========================================
async function procesarEmparejamientoPendiente() {
    const params = new URLSearchParams(window.location.search);
    const pairDeviceId = params.get('pair');

    if (!pairDeviceId) return;

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            alert("Inicia sesión en tu panel para autorizar esta Smart TV.");
            return;
        }

        const userEmail = session.user.email;

        const { data: config } = await supabaseClient
            .from('apartments_config')
            .select('max_devices')
            .eq('user_email', userEmail)
            .maybeSingle();

        const maxDevices = (config && config.max_devices) ? config.max_devices : 1;

        const { data: devices } = await supabaseClient
            .from('authorized_devices')
            .select('*')
            .eq('user_email', userEmail);

        const yaEstaRegistrado = devices && devices.some(d => d.device_id === pairDeviceId);

        if (yaEstaRegistrado) {
            alert("Esta televisión ya estaba vinculada a tu cuenta.");
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        if (devices && devices.length >= maxDevices) {
            alert(`No puedes vincular más pantallas. Límite alcanzado (${devices.length}/${maxDevices}).`);
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        const { error } = await supabaseClient
            .from('authorized_devices')
            .insert([{
                user_email: userEmail,
                device_id: pairDeviceId,
                device_name: 'Smart TV'
            }]);

        if (error) throw error;

        alert("¡Smart TV autorizada con éxito! La pantalla de la televisión se actualizará en unos segundos.");
        window.history.replaceState({}, document.title, window.location.pathname);

    } catch (err) {
        console.error("Error al vincular el dispositivo:", err);
        alert("Error al autorizar el dispositivo: " + err.message);
    }
}

// ==========================================
// DATOS DEL APARTAMENTO (FORMULARIO)
// ==========================================
async function cargarDatosApartamento() {
    if (!usuarioActual) return;

    const { data } = await supabaseClient
        .from('apartments_config')
        .select('*')
        .eq('user_email', usuarioActual.email)
        .maybeSingle();

    if (data) {
        document.getElementById('guestName').value = data.guest_name || '';
        document.getElementById('langSelect').value = data.lang || 'es';
        document.getElementById('wifiName').value = data.wifi_name || '';
        document.getElementById('wifiPass').value = data.wifi_pass || '';
        document.getElementById('phone').value = data.phone || '';
        document.getElementById('checkout').value = data.checkout || '';
        document.getElementById('guideUrl').value = data.guide_url || '';
    }
}

async function guardarConfiguracion(event) {
    event.preventDefault();
    if (!usuarioActual) return;

    const btn = document.querySelector('#appSection .btn');
    if (btn) {
        btn.textContent = "Guardando...";
        btn.disabled = true;
    }

    const datosActualizados = {
        user_email: usuarioActual.email,
        guest_name: document.getElementById('guestName').value,
        lang: document.getElementById('langSelect').value,
        wifi_name: document.getElementById('wifiName').value,
        wifi_pass: document.getElementById('wifiPass').value,
        phone: document.getElementById('phone').value,
        checkout: document.getElementById('checkout').value,
        guide_url: document.getElementById('guideUrl').value,
        updated_at: Date.now()
    };

    const { error } = await supabaseClient
        .from('apartments_config')
        .upsert(datosActualizados, { onConflict: 'user_email' });

    if (error) {
        alert('Error al guardar: ' + error.message);
    } else {
        alert('¡Configuración guardada y sincronizada con la TV!');
    }

    if (btn) {
        btn.textContent = "Actualizar Pantalla de la TV";
        btn.disabled = false;
    }
}

// Ejecutar verificación al cargar la página
window.onload = verificarSesion;