const ENDPOINT    = 'https://www.dogid.es/api/auth/landing-login';
const DASHBOARD   = 'https://www.dogid.es/dashboard';

let currentEmail   = '';
let resendCooldown = false;

// ── Al cargar: verificar si ya hay sesión activa enviando el email vacío
// no aplica — la comprobación de sesión se hace al enviar el email,
// porque el endpoint lee las cookies httpOnly del dominio dogid.es.
// El login.html está en dogid.es/landing así que las cookies viajan con el fetch.

async function checkEmail() {
  const input = document.getElementById('emailIn');
  const email = input.value.trim().toLowerCase();

  if (!isValidEmail(email)) {
    input.classList.add('err');
    showErr('Introduce un correo electrónico válido.');
    input.focus();
    return;
  }

  input.classList.remove('err');
  hideErr();
  setBtnLoading(true);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',          // <-- envía las cookies httpOnly de dogid.es
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    currentEmail = email;

    if (data.authenticated) {
      // Sesión activa detectada — mostrar vista de transición y redirigir
      showView('v3');
      setDots('done', 'done', 'done');
      setTimeout(() => { window.location.href = DASHBOARD; }, 1800);

    } else if (data.ok) {
      // Email encontrado, sin sesión — magic link enviado
      document.getElementById('sentMail').textContent = email;
      showView('v4');
      setDots('done', 'done', 'active');

    } else {
      // Email no encontrado en owners
      document.getElementById('nfEmail').textContent = email;
      showView('v2');
      setDots('done', 'err', 'idle');
    }

  } catch (err) {
    showErr('Error de conexión. Inténtalo de nuevo en unos segundos.');
  } finally {
    setBtnLoading(false);
  }
}

async function resendLink() {
  if (resendCooldown) return;
  resendCooldown = true;

  const btn = document.getElementById('btnResend');
  let s = 30;
  btn.textContent = `⏳ Reenviar en ${s}s`;
  btn.disabled = true;

  const t = setInterval(() => {
    s--;
    if (s <= 0) {
      clearInterval(t);
      btn.textContent = '🔄 Reenviar enlace';
      btn.disabled = false;
      resendCooldown = false;
    } else {
      btn.textContent = `⏳ Reenviar en ${s}s`;
    }
  }, 1000);

  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: currentEmail }),
    });
  } catch(_) {}
}

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goBack() {
  showView('v1');
  setDots('active', 'idle', 'idle');
  hideErr();
}

function setBtnLoading(on) {
  const btn = document.getElementById('btnCheck');
  btn.disabled = on;
  btn.innerHTML = on
    ? '<div class="spin"></div><span>Verificando...</span>'
    : 'Verificar acceso';
}

function showErr(msg) {
  document.getElementById('alertErrMsg').textContent = msg;
  document.getElementById('alertErr').classList.add('show');
}

function hideErr() {
  document.getElementById('alertErr').classList.remove('show');
}

function setDots(s1, s2, s3) {
  [['d1',s1],['d2',s2],['d3',s3]].forEach(([id, state]) => {
    document.getElementById(id).className = 'dot ' + state;
  });
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

window.addEventListener('load', () => {
  document.getElementById('emailIn').focus();
});