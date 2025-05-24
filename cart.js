// ========= BURGER MENU =========
const closeIcon = document.querySelector('.close-icon');
if (closeIcon) closeIcon.addEventListener('click', closeMenu);
const overlayEl = document.getElementById('overlay');
if (overlayEl) overlayEl.addEventListener('click', closeMenu);

function openMenu() {
  document.getElementById('burger_menu').classList.add('open');
  overlayEl.classList.add('active');
}
function closeMenu() {
  document.getElementById('burger_menu').classList.remove('open');
  overlayEl.classList.remove('active');
}

// ========= ЭЛЕМЕНТЫ =========
const loader       = document.getElementById('loader');
const cartList     = document.getElementById('cartList');
const emptyWarning = document.getElementById('emptyWarning');
const sumEl        = document.getElementById('sum');
const orderBtn     = document.getElementById('orderBtn');

let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');

// ========= РЕНДЕР КОРЗИНЫ =========
function renderCart() {
  // Показываем спиннер, если есть что рендерить
  if (cartItems.length) {
    loader.style.display = 'block';
  }

  cartList.innerHTML = '';

  // Если корзина пуста
  if (!cartItems.length) {
    emptyWarning.style.display = 'block';
    sumEl.textContent = 'Итог: 0 ₸';
    loader.style.display = 'none';
    return;
  }
  emptyWarning.style.display = 'none';

  // Рендерим каждый товар
  cartItems.forEach((item, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <img src="${item.img}" alt="${item.name}" class="cart-product-img">
      <div class="cart-product-text">
        <p class="cart-product-name">${item.name}</p>
        <p class="cart-price">${item.price} ₸</p>
        <button data-i="${i}" class="trash-btn">
          <img src="./images/trash_icon.svg" alt="Удалить">
        </button>
      </div>
    `;
    cartList.appendChild(li);
  });

  // Удаление товаров
  cartList.querySelectorAll('.trash-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = +btn.dataset.i;
      cartItems.splice(idx, 1);
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      renderCart();
    };
  });

  // Считаем сумму
  const total = cartItems
    .map(item => Number(item.price.replace(/\./g, '')))
    .reduce((acc, v) => acc + v, 0);
  sumEl.textContent = 'Итог: ' + total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₸';

  // Скрываем спиннер после завершения рендера
  loader.style.display = 'none';
}

// ========= ЗАКАЗ ЧЕРЕЗ WHATSAPP =========
orderBtn.addEventListener('click', () => {
  if (!cartItems.length) {
    alert('Корзина пуста!');
    return;
  }

  const lines = cartItems.map(item =>
    `${item.name} — ${item.price} ₸\n${item.img}`
  ).join('\n\n');

  const total = cartItems
    .map(item => Number(item.price.replace(/\./g, '')))
    .reduce((acc, v) => acc + v, 0);
  const totalFormatted = total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const message = encodeURIComponent(
    `Здравствуйте! Хочу заказать:\n\n${lines}\n\nИтого: ${totalFormatted} ₸`
  );
  const phone = '+77023971888';
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${message}`, '_blank');
});

// ========= ИНИЦИАЛИЗАЦИЯ =========
document.addEventListener('DOMContentLoaded', renderCart);
