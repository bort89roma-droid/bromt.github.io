// === ФУНКЦИЯ ЭКРАНИРОВАНИЯ HTML ===
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// === ДАННЫЕ МЕНЮ ===
const menuItems = [
  { id: 1, category: 'breakfast', name: 'Сырники с ягодным соусом', description: 'Нежные творожные сырники со сметаной и домашним ягодным соусом', price: '350 ₽', image: 'images/menu1.jpg' },
  { id: 2, category: 'breakfast', name: 'Омлет с овощами и зеленью', description: 'Пышный омлет со свежими овощами, зеленью и сыром', price: '320 ₽', image: 'images/menu2.jpg' },
  { id: 3, category: 'salads', name: 'Цезарь с курицей', description: 'Классический салат с листьями айсберг, куриной грудкой, сухариками и соусом цезарь', price: '420 ₽', image: 'images/menu3.jpg' },
  { id: 4, category: 'salads', name: 'Греческий салат', description: 'Свежие овощи, оливки, сыр фета и оливковое масло', price: '380 ₽', image: 'images/menu4.jpg' },
  { id: 5, category: 'main', name: 'Стейк из лосося с овощами', description: 'Нежный стейк лосося с гарниром из сезонных овощей и лимонным соусом', price: '690 ₽', image: 'images/menu5.jpg' },
  { id: 6, category: 'main', name: 'Паста Карбонара', description: 'Спагетти с беконом, сливочным соусом, яичным желтком и пармезаном', price: '450 ₽', image: 'images/menu6.jpg' },
  { id: 7, category: 'desserts', name: 'Тирамису', description: 'Классический итальянский десерт с кофе и маскарпоне', price: '320 ₽', image: 'images/menu7.jpg' },
  { id: 8, category: 'desserts', name: 'Чизкейк Нью-Йорк', description: 'Нежный чизкейк с ягодным топпингом', price: '350 ₽', image: 'images/menu8.jpg' },
  { id: 9, category: 'drinks', name: 'Латте', description: 'Классический кофейный напиток с молоком', price: '220 ₽', image: 'images/menu9.jpg' },
  { id: 10, category: 'drinks', name: 'Свежевыжатый апельсиновый сок', description: 'Натуральный сок из свежих апельсинов', price: '280 ₽', image: 'images/menu10.jpg' }
];

// === ПРОМОАКЦИИ ===
const promotions = [
  { title: 'Счастливые часы', date: 'До 30 июня 2028', description: 'С 16:00 до 19:00 скидка 20% на все напитки в баре и десерты. Идеальное время для встреч после работы.', image: 'images/promo1.jpg' },
  { title: 'Бранч выходного дня', date: 'Каждые суббота и воскресенье', description: 'С 10:00 до 14:00 специальное бранч-меню. При заказе основного блюда кофе или сок в подарок.', image: 'images/promo2.jpg' },
  { title: 'День рождения', date: 'Постоянная акция', description: 'В день рождения именинник получает десерт в подарок при заказе от 1000 рублей. Покажите документ, подтверждающий дату рождения.', image: 'images/promo3.jpg' }
];

// === ХРАНИЛИЩЕ ===
let cart = JSON.parse(localStorage.getItem('bromtCart')) || [];
let orders = JSON.parse(localStorage.getItem('bromtOrders')) || [];
let isAdmin = false;

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
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

  let html = '';
  let total = 0;

  cart.forEach(item => {
    const priceNum = parseInt(item.price.replace(/\D/g, ''));
    const itemTotal = priceNum * item.quantity;
    total += itemTotal;

    html += `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class "cart-item-name">${escapeHtml(item.name)}</div>
          <div class="cart-item-quantity">${item.quantity} × ${priceNum} ₽</div>
        </div>
        <div class="cart-item-price">${itemTotal} ₽</div>
      </div>
    `;
  });

  cartContent.innerHTML = html;
  cartTotalEl.textContent = `Итого: ${total.toLocaleString()} ₽`;
}

function saveOrder(name, phone, time, guests, notes) {
  // Санитизация входных данных
  const order = {
    id: Date.now(),
    name: escapeHtml(name),
    phone: escapeHtml(phone),
    time: escapeHtml(time),
    guests: escapeHtml(guests),
    notes: escapeHtml(notes || ''),
    items: [...cart],
    total: cart.reduce((sum, item) => sum + parseInt(item.price.replace(/\D/g, '')) * item.quantity, 0),
    date: new Date().toLocaleString('ru-RU')
  };

  orders.push(order);
  localStorage.setItem('bromtOrders', JSON.stringify(orders));
  cart = [];
  updateCartUI();
}

function renderAdminPanel() {
  const list = document.getElementById('ordersList');
  if (!list) return;

  if (orders.length === 0) {
    list.innerHTML = '<p>Нет заказов</p>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 1.5rem;">';
  orders.forEach(order => {
    const itemsList = order.items.map(i => 
      `${escapeHtml(i.name)} (${i.quantity} шт.)`
    ).join('<br>');
    html += `
      <div style="background: var(--light); padding: 1.5rem; border-radius: 12px; box-shadow: var(--shadow-sm);">
        <h4 style="margin: 0 0 0.5rem; color: var(--primary);">${order.name} • ${order.phone}</h4>
        <p><strong>Время:</strong> ${order.time} | <strong>Гостей:</strong> ${order.guests}</p>
        <p><strong>Дата заказа:</strong> ${order.date}</p>
        ${order.notes ? `<p><strong>Пожелания:</strong> ${order.notes}</p>` : ''}
        <div style="margin-top: 1rem;">
          <strong>Заказ:</strong><br>
          ${itemsList}
        </div>
        <div style="margin-top: 1rem; font-weight: bold; color: var(--primary);">
          Итого: ${order.total.toLocaleString()} ₽
        </div>
      </div>
    `;
  });
  html += '</div>';
  list.innerHTML = html;
}

// === ИНИЦИАЛИЗАЦИЯ ===
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

  // Плавная прокрутка
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

// === НАВИГАЦИЯ ===
function initNavigation() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');

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

// === ПРОМОАКЦИИ ===
function initPromotions() {
  const promoGrid = document.getElementById('promoGrid');
  if (!promoGrid) return;

  promoGrid.innerHTML = '';
  promotions.forEach(promo => {
    const card = document.createElement('div');
    card.className = 'promo-card';
    card.innerHTML = `
      <div class="promo-img" style="background-image: url('${promo.image}')"></div>
      <div class="promo-content">
        <h3>${escapeHtml(promo.title)}</h3>
        <div class="promo-date">${escapeHtml(promo.date)}</div>
        <p>${escapeHtml(promo.description)}</p>
      </div>
    `;
    promoGrid.appendChild(card);
  });
}

// === МЕНЮ ===
function initMenu() {
  const menuGrid = document.getElementById('menuGrid');
  const categoryBtns = document.querySelectorAll('.category-btn');
  if (!menuGrid) return;

  function renderMenu(category = 'all') {
    menuGrid.innerHTML = '';
    const items = category === 'all' ? menuItems : menuItems.filter(item => item.category === category);
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'menu-item';
      el.innerHTML = `
        <div class="menu-item-img" style="background-image: url('${item.image}')"></div>
        <div class="menu-item-content">
          <div class="menu-item-header">
            <div class="menu-item-title">${escapeHtml(item.name)}</div>
            <div class="menu-item-price">${item.price}</div>
          </div>
          <div class="menu-item-description">${escapeHtml(item.description)}</div>
          <button class="btn btn-outline add-to-cart" data-id="${item.id}">
            В корзину
          </button>
        </div>
      `;
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

// === БРОНИРОВАНИЕ ===
function initBookingForm() {
  const form = document.getElementById('reservationForm');
  if (!form) return;

  const dateInput = document.getElementById('date');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.min = tomorrow.toISOString().split('T')[0];
  dateInput.value = dateInput.min;

  const phoneInput = document.getElementById('phone');
  const phoneError = document.getElementById('phone-error');

  function validatePhone() {
    if (!phoneInput || !phoneError) return true;
    const digits = phoneInput.value.replace(/\D/g, '');
    const isValid = digits.length >= 11 && digits.length <= 11;
    if (!isValid && digits.length > 0) {
      phoneError.textContent = 'Номер не дописан';
    } else {
      phoneError.textContent = '';
    }
    return isValid;
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      let value = this.value.replace(/\D/g, '');

      if (value.startsWith('8')) value = '7' + value.slice(1);
      if (value.length > 0 && !value.startsWith('7')) value = '7' + value;
      if (value.length > 11) value = value.slice(0, 11);

      let formatted = '';
      if (value.length === 0) formatted = '';
      else if (value.length <= 1) formatted = '+7';
      else if (value.length <= 4) formatted = '+7 (' + value.slice(1);
      else if (value.length <= 7) formatted = '+7 (' + value.slice(1, 4) + ') ' + value.slice(4);
      else if (value.length <= 9) formatted = '+7 (' + value.slice(1, 4) + ') ' + value.slice(4, 7) + '-' + value.slice(7);
      else formatted = '+7 (' + value.slice(1, 4) + ') ' + value.slice(4, 7) + '-' + value.slice(7, 9) + '-' + value.slice(9, 11);

      this.value = formatted;
      validatePhone();
    });

    phoneInput.addEventListener('blur', validatePhone);
    phoneInput.addEventListener('paste', () => setTimeout(() => phoneInput.dispatchEvent(new Event('input')), 10));
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value;
    const time = document.getElementById('time').value;
    const guests = document.getElementById('guests').value;
    const notes = document.getElementById('notes').value;
    const isPhoneValid = validatePhone();

    if (!name || !isPhoneValid || !time || !guests) {
      alert('Пожалуйста, заполните все обязательные поля. Телефон должен содержать минимум 10 цифр.');
      return;
    }

    saveOrder(name, phone, time, guests, notes);
    alert(`Спасибо, ${escapeHtml(name)}! Ваш столик на ${dateInput.value} в ${time} для ${guests} гостей забронирован.`);
    form.reset();
    dateInput.value = dateInput.min;
    if (phoneError) phoneError.textContent = '';
  });
}

// === КОРЗИНА ===
function initCart() {
  updateCartUI();

  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Корзина пуста!');
      return;
    }

    const name = prompt('Ваше имя:');
    const phone = prompt('Ваш телефон:');
    const time = prompt('Время бронирования (например, 19:00):');

    if (!name || !phone || !time) {
      alert('Заказ отменён');
      return;
    }

    saveOrder(name, phone, time, '—', '');
    alert('Спасибо за заказ!');
  });

  document.getElementById('clearCartBtn')?.addEventListener('click', () => {
    cart = [];
    updateCartUI();
  });

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart')) {
      const id = parseInt(e.target.dataset.id);
      const item = menuItems.find(i => i.id === id);
      if (!item) return;

      const existing = cart.find(i => i.id === id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ ...item, quantity: 1 });
      }

      updateCartUI();
      alert(`«${escapeHtml(item.name)}» добавлен в корзину!`);
    }
  });
}

// === ОТЗЫВЫ (СЛАЙДЕР) ===
function initReviewsSlider() {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.slider-dot');
  const prevBtn = document.querySelector('.slider-arrow.prev');
  const nextBtn = document.querySelector('.slider-arrow.next');
  let currentIndex = 0;

  function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    slides[index].classList.add('active');
    dots[index].classList.add('active');
    currentIndex = index;
  }

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      const newIndex = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(newIndex);
    });

    nextBtn.addEventListener('click', () => {
      const newIndex = (currentIndex + 1) % slides.length;
      showSlide(newIndex);
    });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      showSlide(parseInt(dot.dataset.index));
    });
  });
}

// === АДМИНКА ===
function initAdmin() {
  const adminBtn = document.getElementById('adminBtn');
  const logoutBtn = document.getElementById('logoutAdminBtn');
  const adminSection = document.getElementById('admin-section');

  if (!adminBtn || !logoutBtn || !adminSection) return;

  adminBtn.addEventListener('click', () => {
    const password = prompt('Введите пароль администратора:');
    if (password === 'bromt2026') {
      isAdmin = true;
      adminSection.style.display = 'block';
      renderAdminPanel();
    } else {
      alert('Неверный пароль');
    }
  });

  logoutBtn.addEventListener('click', () => {
    isAdmin = false;
    adminSection.style.display = 'none';
  });
}