// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://wyyurayswvzuovofyseh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G8iz7v3aOpS1fFSoTOT56Q_fmbLi8x3';
const CONTACTO_SOPORTE = 'nikomio7@hotmail.com';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Campos que se pueden configurar (en la general y en cada pantalla)
const CAMPOS = [
    { campo: 'guest_name', etiqueta: 'Nombre del huésped / familia:', tipo: 'text', requerido: true },
    { campo: 'lang', etiqueta: 'Idioma de bienvenida:', tipo: 'select',
      opciones: [['es', 'Español'], ['en', 'English'], ['nl', 'Nederlands'], ['de', 'Deutsch']] },
    { campo: 'wifi_name', etiqueta: 'Nombre de la red WiFi:', tipo: 'text' },
    { campo: 'wifi_pass', etiqueta: 'Contraseña del WiFi:', tipo: 'text' },
    { campo: 'phone', etiqueta: 'Teléfono / WhatsApp del anfitrión:', tipo: 'text' },
    { campo: 'checkout', etiqueta: 'Hora de check-out:', tipo: 'text' },
    { campo: 'guide_url', etiqueta: 'URL de la guía digital (para el QR de la TV):', tipo: 'url' }
];

let usuarioActual = null;
let configGeneral = null;   // fila de apartments_config de la cuenta
let dispositivos = [];      // filas de authorized_devices de la cuenta
let pairIdPendiente = null; // device_id que viene del QR (?pair=tv_xxx)

// ==========================================
// UTILIDADES
// ==========================================
const $ = (id) => document.getElementById(id);

function escapeHtml(texto) {
    return String(texto == null ? '' : texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

let toastTimer = null;
function toast(texto, esError) {
    const el = $('toast');
    el.textContent = texto;
    el.className = esError ? 'error' : '';
    el.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.display = 'none'; }, esError ? 6000 : 3500);
}

function mostrarVista(nombre) {
    ['vistaLista', 'vistaPantalla', 'vistaVincular'].forEach(v => {
        $(v).style.display = (v === nombre) ? 'block' : 'none';
    });
    window.scrollTo(0, 0);
}

function limpiarParametroPair() {
    try {
        window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {
        // Algunos navegadores no permiten cambiar la URL en file:// (pruebas en local)
    }
    pairIdPendiente = null;
}

// Genera los campos del formulario dentro de un contenedor (se usa en la general y en cada pantalla)
function renderCampos(contenedor, prefijo) {
    contenedor.innerHTML = CAMPOS.map(c => {
        const id = prefijo + c.campo;
        let control;
        if (c.tipo === 'select') {
            control = `<select id="${id}" data-campo="${c.campo}">` +
                c.opciones.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('') +
                `</select>`;
        } else {
            control = `<input type="${c.tipo}" id="${id}" data-campo="${c.campo}"${c.requerido ? ' required' : ''}>`;
        }
        return `<div class="form-group"><label for="${id}">${c.etiqueta}</label>${control}</div>`;
    }).join('');
}

function escribirCampos(contenedor, valores) {
    contenedor.querySelectorAll('[data-campo]').forEach(el => {
        const campo = el.dataset.campo;
        el.value = valores[campo] || (campo === 'lang' ? 'es' : '');
    });
}

function leerCampos(contenedor) {
    const resultado = {};
    contenedor.querySelectorAll('[data-campo]').forEach(el => {
        resultado[el.dataset.campo] = el.value.trim();
    });
    return resultado;
}

// ==========================================
// SESIÓN
// ==========================================
async function verificarSesion() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (!session) {
            $('authSection').style.display = 'block';
            $('appSection').style.display = 'none';
            return;
        }

        usuarioActual = session.user;
        $('authSection').style.display = 'none';
        $('appSection').style.display = 'block';
        $('cuentaEmail').textContent = usuarioActual.email;

        await cargarTodo();

        const pair = new URLSearchParams(window.location.search).get('pair');
        if (pair) {
            prepararVinculacion(pair);
        } else {
            mostrarVista('vistaLista');
        }
    } catch (err) {
        console.error('Error al verificar sesión:', err);
        toast('No se pudo cargar tu panel: ' + err.message, true);
    }
}

async function iniciarSesion(event) {
    event.preventDefault();
    const btn = $('btnLogin');
    btn.disabled = true;
    btn.textContent = 'Entrando...';
    $('loginError').textContent = '';

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: $('loginEmail').value.trim(),
        password: $('loginPassword').value
    });

    if (error) {
        $('loginError').textContent = error.message === 'Invalid login credentials'
            ? 'Correo o contraseña incorrectos.'
            : error.message;
        btn.disabled = false;
        btn.textContent = 'Entrar al panel';
    } else {
        // Se conserva ?pair=... en la URL para continuar la vinculación tras entrar
        window.location.reload();
    }
}

async function cerrarSesion() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

// ==========================================
// CARGA DE DATOS
// ==========================================
async function cargarTodo() {
    const email = usuarioActual.email;

    const [cfgRes, devRes] = await Promise.all([
        supabaseClient.from('apartments_config').select('*').eq('user_email', email).maybeSingle(),
        supabaseClient.from('authorized_devices').select('*').eq('user_email', email)
    ]);

    if (cfgRes.error) throw cfgRes.error;
    if (devRes.error) throw devRes.error;

    configGeneral = cfgRes.data;
    dispositivos = (devRes.data || []).slice().sort((a, b) =>
        String(a.device_name || '').localeCompare(String(b.device_name || ''), 'es', { numeric: true })
    );

    renderLicencias();
    renderPantallas();
    escribirCampos($('camposGenerales'), configGeneral || {});
}

function limites() {
    return {
        maxDevices: (configGeneral && configGeneral.max_devices) || 1,
        unbindCount: (configGeneral && configGeneral.unbind_count) || 0,
        maxUnbinds: (configGeneral && configGeneral.max_unbinds != null) ? configGeneral.max_unbinds : 2
    };
}

// ==========================================
// LISTA DE PANTALLAS Y LICENCIAS
// ==========================================
function renderLicencias() {
    const { maxDevices, unbindCount, maxUnbinds } = limites();
    const restantes = Math.max(0, maxUnbinds - unbindCount);

    $('licenciasInfo').textContent = `${dispositivos.length} / ${maxDevices} pantallas`;

    const aviso = $('unbindWarning');
    if (restantes === 0) {
        aviso.className = 'aviso alerta';
        aviso.innerHTML = `⚠️ <strong>Has alcanzado el límite de ${maxUnbinds} desvinculaciones.</strong><br>
            Si necesitas cambiar una pantalla o has tenido un problema,
            <button type="button" class="btn-enlace" id="btnSoporte">contacta con el administrador aquí</button>.`;
    } else {
        aviso.className = 'aviso';
        aviso.innerHTML = `ℹ️ Te quedan <strong>${restantes}</strong> cambio(s) de pantalla.`;
    }
}

function renderPantallas() {
    const cont = $('pantallasList');

    if (dispositivos.length === 0) {
        cont.innerHTML = `<p class="vacio">Todavía no hay ninguna pantalla vinculada.<br>
            Abre la dirección de tu portal en la TV y escanea el código QR que aparece con este móvil.</p>`;
        return;
    }

    cont.innerHTML = dispositivos.map(d => {
        const propio = !!d.use_custom;
        return `
            <div class="pantalla">
                <div>
                    <div class="pantalla-nombre">📺 ${escapeHtml(d.device_name || 'Smart TV')}</div>
                    <span class="chip ${propio ? 'chip-propio' : ''}">${propio ? 'Contenido propio' : 'Igual que la general'}</span>
                    <div class="pantalla-id">ID: ${escapeHtml(d.device_id)}</div>
                </div>
                <div class="pantalla-acciones">
                    <button class="btn" data-action="configurar" data-id="${escapeHtml(d.device_id)}">Configurar</button>
                    <button class="btn btn-danger" data-action="desvincular" data-id="${escapeHtml(d.device_id)}">Desvincular</button>
                </div>
            </div>`;
    }).join('');
}

$('pantallasList').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'configurar') abrirPantalla(btn.dataset.id);
    if (btn.dataset.action === 'desvincular') desvincularDispositivo(btn.dataset.id);
});

// ==========================================
// CONFIGURACIÓN GENERAL
// ==========================================
async function guardarConfiguracionGeneral(event) {
    event.preventDefault();
    const btn = $('btnGuardarGeneral');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
        const datos = Object.assign(
            { user_email: usuarioActual.email },
            leerCampos($('camposGenerales')),
            { updated_at: Date.now() }
        );

        const { error } = await supabaseClient
            .from('apartments_config')
            .upsert(datos, { onConflict: 'user_email' });
        if (error) throw error;

        await cargarTodo();
        toast('¡Configuración guardada! Las pantallas se actualizan en unos segundos.');
    } catch (err) {
        console.error('Error al guardar:', err);
        toast('Error al guardar: ' + err.message, true);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar y actualizar las pantallas';
    }
}

// ==========================================
// EDITOR DE UNA PANTALLA
// ==========================================
let pantallaEnEdicion = null;

function actualizarModoVisual() {
    const modo = document.querySelector('input[name="modo"]:checked').value;
    $('camposPropios').style.display = (modo === 'propio') ? 'block' : 'none';
    $('opcionGeneral').classList.toggle('activa', modo === 'general');
    $('opcionPropio').classList.toggle('activa', modo === 'propio');
}

function abrirPantalla(deviceId) {
    const dev = dispositivos.find(d => d.device_id === deviceId);
    if (!dev) return;

    pantallaEnEdicion = deviceId;
    $('tituloPantalla').textContent = '📺 ' + (dev.device_name || 'Smart TV');
    $('pantallaNombre').value = dev.device_name || '';

    // Valores iniciales: los propios si existen; si no, los de la configuración general
    const general = configGeneral || {};
    const valores = {};
    CAMPOS.forEach(c => {
        valores[c.campo] = (dev.use_custom && dev[c.campo]) ? dev[c.campo] : (general[c.campo] || '');
    });
    escribirCampos($('camposPropios'), valores);

    document.querySelector(`input[name="modo"][value="${dev.use_custom ? 'propio' : 'general'}"]`).checked = true;
    actualizarModoVisual();
    mostrarVista('vistaPantalla');
}

async function guardarPantalla(event) {
    event.preventDefault();
    if (!pantallaEnEdicion) return;

    const btn = $('btnGuardarPantalla');
    const nombre = $('pantallaNombre').value.trim();
    const modo = document.querySelector('input[name="modo"]:checked').value;

    if (!nombre) { toast('Ponle un nombre a la pantalla.', true); return; }

    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
        const cambios = { device_name: nombre, use_custom: modo === 'propio' };
        if (modo === 'propio') Object.assign(cambios, leerCampos($('camposPropios')));

        const { data, error } = await supabaseClient
            .from('authorized_devices')
            .update(cambios)
            .eq('device_id', pantallaEnEdicion)
            .eq('user_email', usuarioActual.email)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error('No se pudo modificar la pantalla.');

        await cargarTodo();
        mostrarVista('vistaLista');
        toast('Pantalla guardada. Se actualizará en unos segundos.');
    } catch (err) {
        console.error('Error al guardar la pantalla:', err);
        toast('Error al guardar: ' + err.message, true);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar pantalla';
    }
}

// ==========================================
// DESVINCULAR PANTALLA
// ==========================================
async function desvincularDispositivo(deviceId) {
    const { unbindCount, maxUnbinds } = limites();

    // Comprobación previa solo para avisar rápido; el límite real lo aplica la base de datos
    if (unbindCount >= maxUnbinds) {
        toast(`Has alcanzado el límite de ${maxUnbinds} desvinculaciones. Contacta con soporte con el enlace de abajo.`, true);
        return;
    }

    const restantes = maxUnbinds - (unbindCount + 1);
    const dev = dispositivos.find(d => d.device_id === deviceId);
    const nombre = dev ? (dev.device_name || 'Smart TV') : 'esta pantalla';

    if (!confirm(`¿Seguro que quieres desvincular "${nombre}"?\n\nTe quedarán ${restantes} cambio(s) disponible(s).`)) return;

    try {
        // La función de la base de datos comprueba el límite, borra la pantalla y suma el contador
        const { error } = await supabaseClient.rpc('desvincular_pantalla', { p_device_id: deviceId });
        if (error) throw error;

        await cargarTodo();
        toast('Pantalla desvinculada.');
    } catch (err) {
        console.error('Error al desvincular:', err);
        toast('Error al desvincular: ' + err.message, true);
        await cargarTodo();
    }
}

// ==========================================
// VINCULACIÓN POR QR (?pair=tv_xxx)
// ==========================================
function prepararVinculacion(pairId) {
    if (!/^tv_[A-Za-z0-9_]+$/.test(pairId)) {
        toast('El código de la pantalla no es válido.', true);
        limpiarParametroPair();
        mostrarVista('vistaLista');
        return;
    }

    const { maxDevices } = limites();

    if (dispositivos.some(d => d.device_id === pairId)) {
        toast('Esta pantalla ya estaba vinculada a tu cuenta.');
        limpiarParametroPair();
        mostrarVista('vistaLista');
        return;
    }

    if (dispositivos.length >= maxDevices) {
        toast(`No puedes vincular más pantallas. Límite alcanzado (${dispositivos.length}/${maxDevices}).`, true);
        limpiarParametroPair();
        mostrarVista('vistaLista');
        return;
    }

    pairIdPendiente = pairId;
    $('vincularNombre').value = 'Pantalla ' + (dispositivos.length + 1);
    mostrarVista('vistaVincular');
}

async function vincularPantalla(event) {
    event.preventDefault();
    if (!pairIdPendiente) return;

    const nombre = $('vincularNombre').value.trim();
    if (!nombre) { toast('Ponle un nombre a la pantalla.', true); return; }

    const btn = $('btnVincular');
    btn.disabled = true;
    btn.textContent = 'Autorizando...';

    try {
        const { error } = await supabaseClient
            .from('authorized_devices')
            .insert([{
                user_email: usuarioActual.email,
                device_id: pairIdPendiente,
                device_name: nombre
            }]);

        if (error) {
            if (error.code === '23505') throw new Error('Esta pantalla ya está vinculada a otra cuenta.');
            throw error;
        }

        limpiarParametroPair();
        await cargarTodo();
        mostrarVista('vistaLista');
        toast('¡Pantalla autorizada! La TV se actualizará en unos segundos.');
    } catch (err) {
        console.error('Error al vincular:', err);
        toast('Error al autorizar: ' + err.message, true);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Autorizar esta pantalla';
    }
}

// ==========================================
// ARRANQUE
// ==========================================
renderCampos($('camposGenerales'), 'g_');
renderCampos($('camposPropios'), 'p_');

$('loginForm').addEventListener('submit', iniciarSesion);
$('btnSalir').addEventListener('click', cerrarSesion);
$('configForm').addEventListener('submit', guardarConfiguracionGeneral);
$('pantallaForm').addEventListener('submit', guardarPantalla);
$('vincularForm').addEventListener('submit', vincularPantalla);
$('btnVolver').addEventListener('click', () => mostrarVista('vistaLista'));
$('btnCancelarVincular').addEventListener('click', () => { limpiarParametroPair(); mostrarVista('vistaLista'); });
document.querySelectorAll('input[name="modo"]').forEach(r => r.addEventListener('change', actualizarModoVisual));

// ==========================================
// CONTRASEÑA: CAMBIO Y OJO PARA VERLA
// ==========================================
async function cambiarPassword(event) {
    event.preventDefault();
    const nueva = $('nuevaPassword').value;
    const repetir = $('repetirPassword').value;

    if (nueva.length < 8) { toast('La contraseña debe tener al menos 8 caracteres.', true); return; }
    if (nueva !== repetir) { toast('Las dos contraseñas no coinciden.', true); return; }

    const btn = $('btnPassword');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
        const { error } = await supabaseClient.auth.updateUser({ password: nueva });
        if (error) throw error;
        $('nuevaPassword').value = '';
        $('repetirPassword').value = '';
        toast('Contraseña actualizada.');
    } catch (err) {
        console.error('Error al cambiar la contraseña:', err);
        toast('No se pudo cambiar la contraseña: ' + err.message, true);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Cambiar contraseña';
    }
}

function agregarOjo(input) {
    const wrap = document.createElement('div');
    wrap.className = 'campo-pass';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-ojo';
    btn.textContent = '👁';
    btn.setAttribute('aria-label', 'Mostrar contraseña');
    btn.addEventListener('click', () => {
        const visible = input.type === 'text';
        input.type = visible ? 'password' : 'text';
        btn.textContent = visible ? '👁' : '🙈';
        btn.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });
    wrap.appendChild(btn);
}

$('passwordForm').addEventListener('submit', cambiarPassword);
document.querySelectorAll('input[type="password"]').forEach(agregarOjo);

// ==========================================
// CONTACTO CON EL ADMINISTRADOR (cualquier gestor de correo)
// ==========================================
// Una página web no puede listar las aplicaciones instaladas. Por eso se ofrecen tres vías:
// el menú de compartir del propio dispositivo (muestra TODAS sus apps), los correos web
// más habituales y copiar el mensaje para pegarlo donde quieras.
function datosSoporte() {
    return {
        asunto: 'Solicitud de reset de dispositivo - ' + usuarioActual.email,
        cuerpo: 'Hola, necesito desvincular una pantalla pero he alcanzado el límite.\n\nMi cuenta: ' + usuarioActual.email
    };
}

function abrirSoporte() {
    $('soporteCompartir').style.display = navigator.share ? 'block' : 'none';
    $('modalSoporte').classList.add('abierto');
}

function cerrarSoporte() {
    $('modalSoporte').classList.remove('abierto');
}

async function enviarSoporte(via) {
    const { asunto, cuerpo } = datosSoporte();
    const para = encodeURIComponent(CONTACTO_SOPORTE);
    const as = encodeURIComponent(asunto);
    const cu = encodeURIComponent(cuerpo);

    if (via === 'gmail') {
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${para}&su=${as}&body=${cu}`, '_blank');
    } else if (via === 'outlook') {
        window.open(`https://outlook.live.com/mail/0/deeplink/compose?to=${para}&subject=${as}&body=${cu}`, '_blank');
    } else if (via === 'yahoo') {
        window.open(`https://compose.mail.yahoo.com/?to=${para}&subject=${as}&body=${cu}`, '_blank');
    } else if (via === 'mailto') {
        window.location.href = `mailto:${CONTACTO_SOPORTE}?subject=${as}&body=${cu}`;
    } else if (via === 'compartir') {
        try {
            await navigator.share({ title: asunto, text: `Para: ${CONTACTO_SOPORTE}\n\n${asunto}\n\n${cuerpo}` });
        } catch (e) { /* el usuario cerró el menú: no pasa nada */ }
    } else if (via === 'copiar') {
        const texto = `Para: ${CONTACTO_SOPORTE}\nAsunto: ${asunto}\n\n${cuerpo}`;
        try {
            await navigator.clipboard.writeText(texto);
            toast('Copiado. Pégalo en tu aplicación de correo.');
        } catch (e) {
            window.prompt('Copia este texto:', texto);
        }
    }
}

document.addEventListener('click', (e) => {
    if (e.target.closest('#btnSoporte')) { abrirSoporte(); return; }
    if (e.target.closest('#soporteCerrar') || e.target === $('modalSoporte')) { cerrarSoporte(); return; }
    if (e.target.closest('#soporteCompartir')) { enviarSoporte('compartir'); return; }
    const opcion = e.target.closest('[data-correo]');
    if (opcion) enviarSoporte(opcion.dataset.correo);
});

window.addEventListener('load', verificarSesion);