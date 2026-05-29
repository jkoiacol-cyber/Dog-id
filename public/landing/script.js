// ── VIDEO OBSERVER (Solo esto requiere DOMContentLoaded) ──
document.addEventListener("DOMContentLoaded", () => {
  const video = document.querySelector("video");

  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          video.play();
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.6 } // 60% visible para reproducir
  );

  if (video) {
    videoObserver.observe(video);
  }

  // Inicializar carrito al cargar la página
  renderCart();
});

// ── CART STATE (Globales y accesibles desde el HTML) ──
let cart = [];
let selectedPayMethod = 'bizum'; // Coherente con la clase 'active' de tu HTML por defecto

const PRODUCTS = {
  dog: { name: 'Dog-id', price: 19.99, emoji: '🐶' },
  cat: { name: 'Cat-id', price: 19.99, emoji: '🐱' }
};

function addToCart(type, event) {
  const existing = cart.find(i => i.type === type);
  if (existing) { 
    existing.qty++; 
  } else { 
    cart.push({ type, ...PRODUCTS[type], qty: 1 }); 
  }
  renderCart();
  toggleCart(true);

  // Animación de feedback visual en el botón correspondiente
  if (event && event.target) {
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '✓ Añadido!';
    btn.style.background = '#25D366';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 1500);
  }
}

function renderCart() {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  const countEl = document.getElementById('cartCount');

  if (!body || !footer || !countEl) return;

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  countEl.textContent = totalItems;

  if (cart.length === 0) {
    body.innerHTML = `<div class="cart-empty"><div class="empty-icon">🛍️</div><p>Tu carrito está vacío</p><p style="font-size:13px;color:#bbb;margin-top:8px;">Añade una placa para empezar</p></div>`;
    footer.style.display = 'none';
    return;
  }

  body.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${(item.price * item.qty).toFixed(2)}€</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty('${item.type}', -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.type}', 1)">+</button>
          <button class="cart-remove" onclick="removeFromCart('${item.type}')">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = total.toFixed(2).replace('.', ',') + '€';
  footer.style.display = 'block';
}

function changeQty(type, delta) {
  const item = cart.find(i => i.type === type);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(type);
  else renderCart();
}

function removeFromCart(type) {
  cart = cart.filter(i => i.type !== type);
  renderCart();
}

function toggleCart(forceOpen) {
  const overlay = document.getElementById('cartOverlay');
  const sidebar = document.getElementById('cartSidebar');
  if (!overlay || !sidebar) return;

  const isOpen = sidebar.classList.contains('open');
  if (forceOpen === true || !isOpen) {
    overlay.classList.add('open');
    sidebar.classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    overlay.classList.remove('open');
    sidebar.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function openCheckout() {
  toggleCart();
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderOrderSummary();
  }
}

function closeCheckout() {
  const modal = document.getElementById('checkoutModal');
  const form = document.getElementById('checkoutForm');
  const success = document.getElementById('successScreen');
  
  if (modal) modal.classList.remove('open');
  if (form) form.style.display = 'block';
  if (success) success.style.display = 'none';
  document.body.style.overflow = '';
}

function renderOrderSummary() {
  const el = document.getElementById('orderSummary');
  if (!el) return;
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  el.innerHTML = `
    <div class="order-summary-title">Resumen del pedido</div>
    ${cart.map(i => `<div class="order-summary-item"><span>${i.name} × ${i.qty}</span><span>${(i.price*i.qty).toFixed(2)}€</span></div>`).join('')}
    <div class="order-summary-item"><span>Envío</span><span style="color:#25D366;font-weight:600;">Gratis</span></div>
    <div class="order-summary-total"><span>Total</span><span>${total.toFixed(2).replace('.',',')}€</span></div>
  `;
}

function selectPay(btn, method) {
  document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedPayMethod = method;
}

function processOrder() {
  const name = document.getElementById('fName').value.trim();
  const email = document.getElementById('fEmail').value.trim();
  const address = document.getElementById('fAddress').value.trim();
  const city = document.getElementById('fCity').value.trim();
  const cp = document.getElementById('fCP').value.trim();

  const payText = selectedPayMethod === 'bizum' ? 'Bizum (606295911)' : 'Efectivo en entrega';

  if (!name || !email || !address) {
    alert('Por favor, completa los datos de contacto y envío.');
    return;
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemsText = cart
    .map(i => `• ${i.name} × ${i.qty} — ${(i.price * i.qty).toFixed(2)}€`)
    .join('%0A');

  const msg =
    `🐾 *Nuevo pedido Dog-id / Cat-id*%0A%0A` +
    `👤 *Cliente:* ${name}%0A` +
    `📧 *Email:* ${email}%0A` +
    `📍 *Dirección:* ${address}, ${cp} ${city}%0A%0A` +
    `💳 *Método de pago:* ${payText}%0A%0A` +
    `🛒 *Productos:*%0A${itemsText}%0A%0A` +
    `🚚 Envío: Gratis%0A` +
    `💰 *Total:* ${total.toFixed(2).replace('.', ',')}€%0A%0A` +
    `_Pedido realizado desde dogid.es_`;

  window.open(`https://wa.me/34606295911?text=${msg}`, '_blank');

  closeCheckout();
  cart = [];
  renderCart();

  setTimeout(() => {
    const form = document.getElementById('checkoutForm');
    const success = document.getElementById('successScreen');
    if (form) form.style.display = 'none';
    if (success) success.style.display = 'block';
  }, 500);
}

// ── SCROLL ANIMATIONS ──
const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => scrollObserver.observe(el));