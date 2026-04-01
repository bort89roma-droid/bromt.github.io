
const CONFIG = {
  TG_BOT_TOKEN: "8778747196:AAG5BqNz_g0UABwfLuVA1QtruHYh5no9nPo",
  TG_CHAT_ID:   "8216979888"
};

const ADMIN_PASSWORD_HASH = 'd6df30fec1bc880bdc03a4babf3b995f7cb7993a6a7da78fdb11cdef532c6687';

let loginAttempts    = 0;
let loginLockedUntil = 0;

// ============================================================
//  SHA-256
// ============================================================
async function sha256(message) {
  const buf  = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
//  ЭКРАНИРОВАНИЕ HTML
// ============================================================
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

// ============================================================
//  ДАННЫЕ МЕНЮ
// ============================================================
const menuItems = [
  { id: 1,  category: 'breakfast', name: 'Сырники с ягодным соусом',       description: 'Нежные творожные сырники со сметаной и домашним ягодным соусом',                     price: '350 ₽', image: 'images/menu1.jpg'  },
  { id: 2,  category: 'breakfast', name: 'Омлет с овощами и зеленью',       description: 'Пышный омлет со свежими овощами, зеленью и сыром',                                   price: '320 ₽', image: 'images/menu2.jpg'  },
  { id: 3,  category: 'salads',    name: 'Цезарь с курицей',                description: 'Классический салат с листьями айсберг, куриной грудкой, сухариками и соусом цезарь', price: '420 ₽', image: 'images/menu3.jpg'  },
  { id: 4,  category: 'salads',    name: 'Греческий салат',                 description: 'Свежие овощи, оливки, сыр фета и оливковое масло',                                   price: '380 ₽', image: 'images/menu4.jpg'  },
  { id: 5,  category: 'main',      name: 'Стейк из лосося с овощами',       description: 'Нежный стейк лосося с гарниром из сезонных овощей и лимонным соусом',               price: '690 ₽', image: 'images/menu5.jpg'  },
  { id: 6,  category: 'main',      name: 'Паста Карбонара',                 description: 'Спагетти с беконом, сливочным соусом, яичным желтком и пармезаном',                 price: '450 ₽', image: 'images/menu6.jpg'  },
  { id: 7,  category: 'desserts',  name: 'Тирамису',                        description: 'Классический итальянский десерт с кофе и маскарпоне',                               price: '320 ₽', image: 'images/menu7.jpg'  },
  { id: 8,  category: 'desserts',  name: 'Чизкейк Нью-Йорк',               description: 'Нежный чизкейк с ягодным топпингом',                                                price: '350 ₽', image: 'images/menu8.jpg'  },
  { id: 9,  category: 'drinks',    name: 'Латте',                           description: 'Классический кофейный напиток с молоком',                                            price: '220 ₽', image: 'images/menu9.jpg'  },
  { id: 10, category: 'drinks',    name: 'Свежевыжатый апельсиновый сок',   description: 'Натуральный сок из свежих апельсинов',                                              price: '280 ₽', image: 'images/menu10.jpg' }
];

// ============================================================
//  ПРОМОАКЦИИ
// ============================================================
const promotions = [
  { title: 'Счастливые часы',      date: 'До 30 июня 2028',              description: 'С 16:00 до 19:00 скидка 20% на все напитки в баре и десерты.',                                                       image: 'images/promo1.jpg' },
  { title: 'Бранч выходного дня',  date: 'Каждые суббота и воскресенье', description: 'С 10:00 до 14:00 специальное бранч-меню. При заказе основного блюда кофе или сок в подарок.',                        image: 'images/promo2.jpg' },
  { title: 'День рождения',        date: 'Постоянная акция',             description: 'В день рождения именинник получает десерт в подарок при заказе от 1000 рублей. Покажите документ с датой рождения.', image: 'images/promo3.jpg' }
];

// ============================================================
//  ХРАНИЛИЩЕ
// ============================================================
let cart    = JSON.parse(localStorage.getItem('bromtCart'))   || [];
let orders  = JSON.parse(localStorage.getItem('bromtOrders')) || [];
let isAdmin = false;

// ============================================================
//  СТАТУСЫ ЗАКАЗОВ
// ============================================================
const ORDER_STATUSES = {
  new:       { label: 'Новый',       color: '#e67e22' },
  confirmed: { label: 'Подтверждён', color: '#2980b9' },
  preparing: { label: 'Готовится',   color: '#8e44ad' },
  ready:     { label: 'Готов',       color: '#27ae60' },
  done:      { label: 'Выдан',       color: '#95a5a6' },
  cancelled: { label: 'Отменён',     color: '#e74c3c' }
};

// ============================================================
//  TELEGRAM — новый заказ
// ============================================================
async function sendTelegramNotification(order) {
  const token  = CONFIG.TG_BOT_TOKEN;
  const chatId = CONFIG.TG_CHAT_ID;
  if (!token || !chatId) { console.warn('Telegram: config.js не настроен'); return; }

  const itemsList = order.items && order.items.length > 0
    ? order.items.map(i => `  • ${i.name} × ${i.quantity}`).join('\n')
    : '  (только бронирование)';

  const lines = [
    '🔔 *Новый заказ — Bromt!*',
    '',
    `👤 ${order.name}`,
    `📞 ${order.phone}`,
    `📅 Дата брони: ${order.bookingDate || '—'}`,
    `🕐 Время: ${order.time}`,
    `👥 Гостей: ${order.guests}`,
    order.notes ? `💬 ${order.notes}` : null,
    '',
    '🛒 *Состав:*',
    itemsList,
    '',
    `💰 *Итого: ${order.total.toLocaleString()} ₽*`,
    `🆔 #${order.id}`
  ].filter(l => l !== null).join('\n');

  try {
    const res  = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text: lines, parse_mode: 'Markdown' })
    });
    const data = await res.json();
    if (!data.ok) console.error('TG error:', data.description);
  } catch (e) { console.error('TG fetch error:', e); }
}

// ============================================================
//  TELEGRAM — смена статуса
// ============================================================
async function sendStatusNotification(order, newStatus) {
  const token  = CONFIG.TG_BOT_TOKEN;
  const chatId = CONFIG.TG_CHAT_ID;
  if (!token || !chatId) return;

  const s    = ORDER_STATUSES[newStatus] || { label: newStatus };
  const text = `📋 *Статус изменён*\n🆔 Заказ #${order.id} — ${order.name}\n🔄 Статус: *${s.label}*`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
    });
  } catch (e) { console.error('TG status error:', e); }
}

// ============================================================
//  КОРЗИНА — UI
// ============================================================
function updateCartUI() {
  localStorage.setItem('bromtCart', JSON.stringify(cart));
  renderCartPage();
}

function renderCartPage() {
  const cartContent = document.getElementById('cartContent');
  const cartTotalEl = document.getElementById('cartTotal');
  if (!cartContent || !cartTotalEl) return;

  if (cart.length === 0) {
    cartContent.innerHTML = '<p>Ваша корзина пуста.</p>';
    cartTotalEl.textContent = '';
    return;
  }

  let html = '', total = 0;
  cart.forEach(item => {
    const priceNum  = parseInt(item.price.replace(/\D/g, ''));
    const itemTotal = priceNum * item.quantity;
    total += itemTotal;
    html += `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          <div class="cart-item-quantity">${item.quantity} × ${priceNum} ₽</div>
        </div>
        <div class="cart-item-price">${itemTotal} ₽</div>
      </div>`;
  });

  cartContent.innerHTML = html;
  cartTotalEl.textContent = `Итого: ${total.toLocaleString()} ₽`;
}

// ============================================================
//  СОХРАНЕНИЕ ЗАКАЗА
// ============================================================
function saveOrder(name, phone, bookingDate, time, guests, notes) {
  const order = {
    id:          Date.now(),
    status:      'new',
    name:        escapeHtml(name),
    phone:       escapeHtml(phone),
    bookingDate: escapeHtml(bookingDate || ''),
    time:        escapeHtml(time),
    guests:      escapeHtml(guests),
    notes:       escapeHtml(notes || ''),
    items:       [...cart],
    total:       cart.reduce((s, i) => s + parseInt(i.price.replace(/\D/g, '')) * i.quantity, 0),
    createdAt:   new Date().toLocaleString('ru-RU')
  };

  orders.push(order);
  localStorage.setItem('bromtOrders', JSON.stringify(orders));
  sendTelegramNotification(order);
  cart = [];
  updateCartUI();
  return order;
}

// ============================================================
//  СМЕНА СТАТУСА
// ============================================================
function changeOrderStatus(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = newStatus;
  localStorage.setItem('bromtOrders', JSON.stringify(orders));
  sendStatusNotification(order, newStatus);
  renderAdminPanel();
}

// ============================================================
//  УДАЛЕНИЕ ЗАКАЗА
// ============================================================
function deleteOrder(orderId) {
  if (!confirm('Удалить этот заказ?')) return;
  orders = orders.filter(o => o.id !== orderId);
  localStorage.setItem('bromtOrders', JSON.stringify(orders));
  renderAdminPanel();
}

// ============================================================
//  ЭКСПОРТ CSV
// ============================================================
function exportOrdersCSV() {
  if (!orders.length) { alert('Нет заказов для экспорта'); return; }

  const header = ['ID','Статус','Имя','Телефон','Дата брони','Время','Гостей','Пожелания','Состав','Сумма','Создан'];
  const rows   = orders.map(o => [
    o.id,
    ORDER_STATUSES[o.status]?.label || o.status,
    o.name, o.phone,
    o.bookingDate || '', o.time, o.guests, o.notes,
    (o.items || []).map(i => `${i.name} x${i.quantity}`).join('; '),
    o.total, o.createdAt
  ].map(v => `"${String(v).replace(/"/g, '""')}"`));

  const csv  = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `bromt_${new Date().toISOString().slice(0,10)}.csv`
  });
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
//  ОТРИСОВКА АДМИН-ПАНЕЛИ
// ============================================================
function renderAdminPanel() {
  const container = document.getElementById('adminPanelContent');
  if (!container) return;

  // Статистика
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const newCount     = orders.filter(o => o.status === 'new').length;
  const doneCount    = orders.filter(o => o.status === 'done').length;

  // Фильтр
  const filterEl    = document.getElementById('adminStatusFilter');
  const filterValue = filterEl ? filterEl.value : 'all';
  const searchEl    = document.getElementById('adminSearch');
  const searchQuery = searchEl ? searchEl.value.toLowerCase().trim() : '';

  let displayed = filterValue === 'all' ? [...orders] : orders.filter(o => o.status === filterValue);
  if (searchQuery) {
    displayed = displayed.filter(o =>
      o.name.toLowerCase().includes(searchQuery) ||
      o.phone.includes(searchQuery) ||
      String(o.id).includes(searchQuery)
    );
  }
  displayed.reverse();

  // Карточки заказов
  const ordersHtml = displayed.length === 0
    ? '<p style="color:#888;text-align:center;padding:2rem">Заказов не найдено</p>'
    : displayed.map(order => {
        const s         = ORDER_STATUSES[order.status] || { label: order.status, color: '#999' };
        const itemsList = order.items && order.items.length
          ? order.items.map(i => `<span style="display:block">• ${escapeHtml(i.name)} × ${i.quantity}</span>`).join('')
          : '<span style="color:#aaa">Без блюд</span>';

        return `
          <div style="background:#fff;border:1px solid #e8e0d5;border-radius:14px;padding:1.5rem;margin-bottom:1.2rem;box-shadow:0 2px 8px rgba(0,0,0,.06)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:.5rem;margin-bottom:.8rem">
              <div>
                <span style="font-weight:700;font-size:1.05rem">${escapeHtml(order.name)}</span>
                <span style="color:#888;margin-left:.5rem">📞 ${escapeHtml(order.phone)}</span>
              </div>
              <span style="background:${s.color};color:#fff;padding:.25rem .75rem;border-radius:20px;font-size:.8rem;font-weight:600">${s.label}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.4rem .8rem;font-size:.9rem;margin-bottom:.8rem;color:#555">
              <span>📅 ${escapeHtml(order.bookingDate || '—')}</span>
              <span>🕐 ${escapeHtml(order.time)}</span>
              <span>👥 Гостей: ${escapeHtml(order.guests)}</span>
              <span>🕓 ${order.createdAt || '—'}</span>
              ${order.notes ? `<span style="grid-column:1/-1">💬 ${escapeHtml(order.notes)}</span>` : ''}
            </div>
            <div style="border-top:1px solid #f0ebe4;padding-top:.8rem;margin-bottom:.8rem;font-size:.88rem;color:#444">${itemsList}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.6rem">
              <span style="font-weight:700;color:#8B5E3C;font-size:1rem">💰 ${order.total.toLocaleString()} ₽</span>
              <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center">
                <select onchange="changeOrderStatus(${order.id}, this.value)"
                  style="padding:.3rem .6rem;border-radius:8px;border:1px solid #ddd;font-size:.85rem;cursor:pointer">
                  ${Object.entries(ORDER_STATUSES).map(([k, v]) =>
                    `<option value="${k}" ${order.status === k ? 'selected' : ''}>${v.label}</option>`
                  ).join('')}
                </select>
                <button onclick="deleteOrder(${order.id})"
                  style="background:#e74c3c;color:#fff;border:none;padding:.3rem .8rem;border-radius:8px;cursor:pointer;font-size:.85rem">
                  🗑 Удалить
                </button>
              </div>
            </div>
          </div>`;
      }).join('');

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:1rem;margin-bottom:1.5rem">
      ${[
        ['📋', 'Всего',   orders.length,                     '#8B5E3C'],
        ['🆕', 'Новых',   newCount,                          '#e67e22'],
        ['✅', 'Выдано',  doneCount,                         '#27ae60'],
        ['💰', 'Выручка', totalRevenue.toLocaleString()+' ₽','#2980b9']
      ].map(([icon, label, val, color]) => `
        <div style="background:#fff;border-radius:12px;padding:1rem;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.07);border-top:3px solid ${color}">
          <div style="font-size:1.4rem">${icon}</div>
          <div style="font-size:1.35rem;font-weight:700;color:${color}">${val}</div>
          <div style="font-size:.78rem;color:#888">${label}</div>
        </div>`).join('')}
    </div>

    <div style="display:flex;gap:.8rem;flex-wrap:wrap;margin-bottom:1.2rem;align-items:center">
      <input id="adminSearch" type="text" placeholder="🔍 Имя / телефон / ID"
        value="${escapeHtml(searchQuery)}" oninput="renderAdminPanel()"
        style="flex:1;min-width:180px;padding:.5rem .9rem;border-radius:8px;border:1px solid #ddd;font-size:.9rem">
      <select id="adminStatusFilter" onchange="renderAdminPanel()"
        style="padding:.5rem .9rem;border-radius:8px;border:1px solid #ddd;font-size:.9rem;cursor:pointer">
        <option value="all" ${filterValue==='all'?'selected':''}>Все статусы</option>
        ${Object.entries(ORDER_STATUSES).map(([k, v]) =>
          `<option value="${k}" ${filterValue===k?'selected':''}>${v.label}</option>`
        ).join('')}
      </select>
      <button onclick="exportOrdersCSV()"
        style="background:#27ae60;color:#fff;border:none;padding:.5rem 1rem;border-radius:8px;cursor:pointer;font-size:.85rem;white-space:nowrap">
        ⬇ Скачать CSV
      </button>
    </div>

    <div>${ordersHtml}</div>
  `;
}

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('current-year').textContent = new Date().getFullYear();
  setTimeout(() => document.getElementById('loader')?.classList.remove('active'), 1000);

  initNavigation();
  initPromotions();
  initMenu();
  initBookingForm();
  initCart();
  initReviewsSlider();
  initAdmin();

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const offset = document.getElementById('header')?.offsetHeight || 0;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      }
    });
  });
});

// ============================================================
//  НАВИГАЦИЯ
// ============================================================
function initNavigation() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu       = document.getElementById('navMenu');

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => navMenu.classList.toggle('active'));
    document.querySelectorAll('.nav-menu a').forEach(link => {
      link.addEventListener('click', () => navMenu.classList.remove('active'));
    });
  }

  window.addEventListener('scroll', () => {
    let current = '';
    document.querySelectorAll('section').forEach(section => {
      if (window.scrollY >= section.offsetTop - 100) current = section.getAttribute('id');
    });
    document.querySelectorAll('.nav-menu li a').forEach(li => {
      li.classList.toggle('active', li.getAttribute('href') === '#' + current);
    });
  });
}

// ============================================================
//  ПРОМОАКЦИИ
// ============================================================
function initPromotions() {
  const promoGrid = document.getElementById('promoGrid');
  if (!promoGrid) return;
  promoGrid.innerHTML = '';
  promotions.forEach(promo => {
    const card = document.createElement('div');
    card.className = 'promo-card';
    card.innerHTML = `
      <div class="promo-img" style="background-image:url('${promo.image}')"></div>
      <div class="promo-content">
        <h3>${escapeHtml(promo.title)}</h3>
        <div class="promo-date">${escapeHtml(promo.date)}</div>
        <p>${escapeHtml(promo.description)}</p>
      </div>`;
    promoGrid.appendChild(card);
  });
}

// ============================================================
//  МЕНЮ
// ============================================================
function initMenu() {
  const menuGrid     = document.getElementById('menuGrid');
  const categoryBtns = document.querySelectorAll('.category-btn');
  if (!menuGrid) return;

  function renderMenu(category = 'all') {
    menuGrid.innerHTML = '';
    const items = category === 'all' ? menuItems : menuItems.filter(i => i.category === category);
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'menu-item';
      el.innerHTML = `
        <div class="menu-item-img" style="background-image:url('${item.image}')"></div>
        <div class="menu-item-content">
          <div class="menu-item-header">
            <div class="menu-item-title">${escapeHtml(item.name)}</div>
            <div class="menu-item-price">${item.price}</div>
          </div>
          <div class="menu-item-description">${escapeHtml(item.description)}</div>
          <button class="btn btn-outline add-to-cart" data-id="${item.id}">В корзину</button>
        </div>`;
      menuGrid.appendChild(el);
    });
  }

  renderMenu();
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMenu(btn.dataset.category);
    });
  });
}

// ============================================================
//  БРОНИРОВАНИЕ
// ============================================================
function initBookingForm() {
  const form = document.getElementById('reservationForm');
  if (!form) return;

  const dateInput  = document.getElementById('date');
  const tomorrow   = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.min    = tomorrow.toISOString().split('T')[0];
  dateInput.value  = dateInput.min;

  const phoneInput = document.getElementById('phone');
  const phoneError = document.getElementById('phone-error');

  function validatePhone() {
    if (!phoneInput || !phoneError) return true;
    const digits  = phoneInput.value.replace(/\D/g, '');
    const isValid = digits.length === 11;
    phoneError.textContent = (!isValid && digits.length > 0) ? 'Номер не дописан' : '';
    return isValid;
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      let v = this.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (v.length > 0 && !v.startsWith('7')) v = '7' + v;
      if (v.length > 11) v = v.slice(0, 11);

      let f = '';
      if      (v.length === 0) f = '';
      else if (v.length <= 1)  f = '+7';
      else if (v.length <= 4)  f = '+7 (' + v.slice(1);
      else if (v.length <= 7)  f = '+7 (' + v.slice(1,4) + ') ' + v.slice(4);
      else if (v.length <= 9)  f = '+7 (' + v.slice(1,4) + ') ' + v.slice(4,7) + '-' + v.slice(7);
      else                     f = '+7 (' + v.slice(1,4) + ') ' + v.slice(4,7) + '-' + v.slice(7,9) + '-' + v.slice(9,11);

      this.value = f;
      validatePhone();
    });
    phoneInput.addEventListener('blur', validatePhone);
    phoneInput.addEventListener('paste', () => setTimeout(() => phoneInput.dispatchEvent(new Event('input')), 10));
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name   = document.getElementById('name').value.trim();
    const phone  = document.getElementById('phone').value;
    const date   = document.getElementById('date').value;
    const time   = document.getElementById('time').value;
    const guests = document.getElementById('guests').value;
    const notes  = document.getElementById('notes').value;

    if (!name || !validatePhone() || !time || !guests) {
      alert('Пожалуйста, заполните все обязательные поля корректно.');
      return;
    }

    saveOrder(name, phone, date, time, guests, notes);
    alert(`Спасибо, ${name}! Столик на ${date} в ${time} для ${guests} гостей забронирован.`);
    form.reset();
    dateInput.value = dateInput.min;
    if (phoneError) phoneError.textContent = '';
  });
}

// ============================================================
//  КОРЗИНА — кнопки
// ============================================================
function initCart() {
  updateCartUI();

  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (cart.length === 0) { alert('Корзина пуста!'); return; }

    const name  = prompt('Ваше имя:');
    const phone = prompt('Ваш телефон:');
    const time  = prompt('Желаемое время (например, 19:00):');
    if (!name || !phone || !time) { alert('Заказ отменён'); return; }

    saveOrder(name, phone, '', time, '—', '');
    alert('Спасибо за заказ! Мы скоро свяжемся с вами.');
  });

  document.getElementById('clearCartBtn')?.addEventListener('click', () => {
    cart = [];
    updateCartUI();
  });

  document.addEventListener('click', e => {
    if (!e.target.classList.contains('add-to-cart')) return;
    const id   = parseInt(e.target.dataset.id);
    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    const existing = cart.find(i => i.id === id);
    existing ? existing.quantity++ : cart.push({ ...item, quantity: 1 });

    updateCartUI();
    alert(`«${item.name}» добавлен в корзину!`);
  });
}

// ============================================================
//  ОТЗЫВЫ — СЛАЙДЕР
// ============================================================
function initReviewsSlider() {
  const slides  = document.querySelectorAll('.slide');
  const dots    = document.querySelectorAll('.slider-dot');
  const prevBtn = document.querySelector('.slider-arrow.prev');
  const nextBtn = document.querySelector('.slider-arrow.next');
  let currentIndex = 0;

  function showSlide(index) {
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d  => d.classList.remove('active'));
    slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');
    currentIndex = index;
  }

  if (prevBtn) prevBtn.onclick = () => showSlide((currentIndex - 1 + slides.length) % slides.length);
  if (nextBtn) nextBtn.onclick = () => showSlide((currentIndex + 1) % slides.length);
  dots.forEach(dot => { dot.onclick = () => showSlide(parseInt(dot.dataset.index)); });
}

// ============================================================
//  АДМИНКА — вход с защитой паролем
// ============================================================
function initAdmin() {
  const adminBtn     = document.getElementById('adminBtn');
  const logoutBtn    = document.getElementById('logoutAdminBtn');
  const adminSection = document.getElementById('admin-section');

  if (!adminBtn || !adminSection) return;

  adminBtn.addEventListener('click', async () => {
    const now = Date.now();
    if (now < loginLockedUntil) {
      const secs = Math.ceil((loginLockedUntil - now) / 1000);
      alert(`Слишком много попыток. Подождите ${secs} сек.`);
      return;
    }

    const password = prompt('Введите пароль администратора:');
    if (password === null) return;

    const hash = await sha256(password);

    if (hash === ADMIN_PASSWORD_HASH) {
      loginAttempts          = 0;
      isAdmin                = true;
      adminSection.style.display = 'block';
      adminBtn.style.display     = 'none';
      renderAdminPanel();
      adminSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      loginAttempts++;
      if (loginAttempts >= 3) {
        loginLockedUntil = Date.now() + 60000;
        loginAttempts    = 0;
        alert('3 неверных попытки. Вход заблокирован на 60 секунд.');
      } else {
        alert(`Неверный пароль. Попытка ${loginAttempts} из 3.`);
      }
    }
  });

  logoutBtn?.addEventListener('click', () => {
    isAdmin                    = false;
    adminSection.style.display = 'none';
    adminBtn.style.display     = '';
  });
}