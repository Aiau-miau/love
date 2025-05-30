// ========== ИНИЦИАЛИЗАЦИЯ FAVORITES ==========
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// ========== HELPERS ==========
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function normalizeType(text) {
  const norm = text.toLowerCase();
  if (["сердце", "сердца", "сердец"].includes(norm)) return "сердце";
  return norm;
}

// ========== КОНФИГУРАЦИЯ ==========
const baseCSVUrl = 
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbtBsnRAE2vVA4sCdHNUnH_3Rao9DlTnzZxs_C9ate6mA2KA6_WeQsfZaxluCmjBv61Frn-eoIXyoL/pub?output=csv&sheet=Лист1';
let processedItems = [], fields = [], activeCategory = 'all';
let searchTerm = '';

const loader       = document.getElementById('loader');
const searchBtn    = document.getElementById('searchBtn');
const headerTitle  = document.getElementById('header-title');
const debouncedRender = debounce(renderCards, 200);

// ========== ПОИСК ==========
if (searchBtn && headerTitle) {
  searchBtn.addEventListener('click', e => {
    e.preventDefault();
    if (document.getElementById('searchInput')) return;

    const input = document.createElement('input');
    input.id = 'searchInput';
    input.type = 'text';
    input.placeholder = 'Поиск товаров...';
    input.style.width = '300px';
    input.style.padding = '10px';
    input.style.borderRadius = '20px';

    input.addEventListener('input', ev => {
      searchTerm = ev.target.value.trim().toLowerCase();
      debouncedRender();
    });
    input.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') {
        searchTerm = '';
        debouncedRender();
        input.replaceWith(headerTitle);
      }
    });

    headerTitle.replaceWith(input);
    input.focus();
  });
}

// ========== ЗАГРУЗКА + ИНИЦИАЛИЗАЦИЯ ==========
function loadAndInit() {
  const urlCat = getParam('cat');
  if (urlCat) {
    activeCategory = urlCat;
    document.querySelectorAll('#categoryList a[data-cat]')
      .forEach(a => a.classList.remove('active'));
    const sel = document.querySelector(`#categoryList a[data-cat="${urlCat}"]`);
    if (sel) {
      sel.classList.add('active');
      const labels = {
        all: 'Все Товары', women: 'Для Девушек', men: 'Для Мужчин',
        boys: 'Для Мальчиков', girls: 'Для Девочек',
        baby_boy: 'Выписка (мальчик)', baby_girl: 'Выписка (девочка)'
      };
      document.getElementById('currentCategoryLabel')
              .textContent = labels[urlCat] || 'Все Товары';
    }
  }

  if (loader) loader.style.display = 'block';

  Papa.parse(baseCSVUrl + '&cb=' + Date.now(), {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete(r) {
      fields = r.meta.fields;
      processedItems = r.data;

      initFilters();
      renderCards();

      if (loader) loader.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', loadAndInit);

// ========== РЕНДЕР КАРТОЧЕК ==========
function renderCards() {
  const prod = document.getElementById('products');
  prod.innerHTML = '';
  let cnt = 0;

  const activeTypes = [...document.querySelectorAll('.types .tag.active p')]
    .map(el => normalizeType(el.textContent.trim()));
  const activeColors = [...document.querySelectorAll('.colors .tag.active p')]
    .map(el => el.textContent.trim().toLowerCase());

  for (const item of processedItems) {
    const name     = item[fields[0]] || '';
    const img      = item[fields[1]] || '';
    const price    = item[fields[2]] || '';
    const desc     = item[fields[3]] || '';
    const category = (item[fields[4]] || '').toLowerCase();
    const colors   = (item[fields[5]] || '').split(',')
                       .map(s => s.trim().toLowerCase());

    if (activeCategory !== 'all' && category !== activeCategory) continue;

    const normalizedDesc = normalizeType(desc.toLowerCase());
    if (activeTypes.length && !activeTypes.every(t => normalizedDesc.includes(t))) continue;

    if (activeColors.length && !activeColors.every(c => colors.includes(c))) continue;
    if (searchTerm && !(name + ' ' + desc).toLowerCase().includes(searchTerm)) continue;

    cnt++;
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-img-wrap">
        <img class="all-products-img" src="${img}"
             onerror="this.src='https://via.placeholder.com/240x160'">
        <img
          class="heart-icon ${favorites.includes(name) ? 'favorited' : ''}"
          src="./images/${favorites.includes(name)
            ? 'heart_icon_after' : 'heart_icon_before'}.svg"
          alt="Избранное"
        />
      </div>
      <p>${name}</p>
      <p class="price">${price} ₸</p>
    `;
    card.addEventListener('click', () => openModal({ name, img, price, desc }));
    prod.appendChild(card);

    const heart = card.querySelector('.heart-icon');
    heart.addEventListener('click', e => {
      e.stopPropagation();
      if (favorites.includes(name)) {
        favorites = favorites.filter(n => n !== name);
        heart.src = './images/heart_icon_before.svg';
        heart.classList.remove('favorited');
      } else {
        favorites.push(name);
        heart.src = './images/heart_icon_after.svg';
        heart.classList.add('favorited');
      }
      saveFavorites();
    });
  }

  document.getElementById('matchesCount').textContent =
    cnt === 1 ? '1 совпадение' : `${cnt} совпадений`;
}

// ========== ИНИЦИАЛИЗАЦИЯ ФИЛЬТРОВ ==========
function initFilters() {
  const labels = {
    all: 'Все Товары', women: 'Для Девушек', men: 'Для Мужчин',
    boys: 'Для Мальчиков', girls: 'Для Девочек',
    baby_boy: 'Выписка (мальчик)', baby_girl: 'Выписка (девочка)'
  };

  document.querySelectorAll('#categoryList a[data-cat]').forEach(a => {
    a.onclick = e => {
      e.preventDefault();
      document.querySelectorAll('#categoryList a[data-cat]').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
      activeCategory = a.dataset.cat;
      document.getElementById('currentCategoryLabel').textContent =
        labels[activeCategory] || 'Все Товары';
      debouncedRender();
      closeMenu()
    };
  });

  const activeBox = document.querySelector('.active-tags');
  document.querySelectorAll('.tag').forEach(tag => {
    tag.onclick = e => {
      e.stopPropagation();
      const txt = tag.textContent.trim().toLowerCase();
      tag.classList.toggle('active');
      if (tag.classList.contains('active')) {
        if (!activeBox.querySelector(`[data-tag="${txt}"]`)) {
          const el = document.createElement('div');
          el.className = 'active-tag'; el.dataset.tag = txt;
          const col = tag.querySelector('.color');
          if (col) el.appendChild(col.cloneNode(true));
          const span = document.createElement('span'); span.textContent = txt;
          el.appendChild(span);
          const remove = document.createElement('span'); remove.className = 'remove-tag'; remove.textContent = '✕';
          el.appendChild(remove);
          activeBox.appendChild(el);
        }
      } else {
        const ex = activeBox.querySelector(`[data-tag="${txt}"]`);
        if (ex) ex.remove();
      }
      debouncedRender();
    };
  });

  activeBox.onclick = e => {
    if (e.target.classList.contains('remove-tag')) {
      const el = e.target.closest('.active-tag');
      const txt = el.dataset.tag;
      el.remove();
      document.querySelectorAll('.tag').forEach(t => {
        if (t.textContent.trim().toLowerCase() === txt) t.classList.remove('active');
      });
      debouncedRender();
    }
  };
}

// ========== МОДАЛКА + КОРЗИНА ==========
function openModal({ name, img, price, desc }) {
  const modal    = document.getElementById('modal');
  modal.querySelector('#modalImg').src = img;
  modal.querySelector('#modalTitle').textContent = name;
  modal.querySelector('#modalPrice').textContent = price + ' ₸';
  modal.querySelector('#modalDesc').textContent = desc;
  modal.style.display = 'flex';

  modal.querySelector('#addToCartBtn').onclick = () => {
    const cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    cart.push({ name, img, price });
    localStorage.setItem('cartItems', JSON.stringify(cart));
    modal.style.display = 'none';
  };

  modal.querySelector('#orderSingleBtn').onclick = () => {
    const message = encodeURIComponent(
      `Здравствуйте! Хочу заказать:\n\n${name} — ${price} ₸\n\nОписание: ${desc}`
    );
    window.open(`https://api.whatsapp.com/send?phone=+77023971888&text=${message}`, '_blank');
    modal.style.display = 'none';
  };

  modal.querySelector('#closeModal').onclick =
  modal.querySelector('#modalOverlay').onclick = () => {
    modal.style.display = 'none';
  };
}

// ========== BURGER MENU ==========
const overlayEl = document.getElementById('overlay');
document.querySelectorAll('.icon-button[onclick="openMenu()"]')
  .forEach(btn => btn.addEventListener('click', openMenu));
document.querySelectorAll('.close-icon, #overlay')
  .forEach(el => el.addEventListener('click', closeMenu));

function openMenu() {
  document.getElementById('burger_menu').classList.add('open');
  overlayEl.classList.add('active');
}
function closeMenu() {
  document.getElementById('burger_menu').classList.remove('open');
  overlayEl.classList.remove('active');
}

// ========== FILTER OVERLAY ==========
const filterMenu    = document.getElementById('filter-menu');
const filterOverlay = document.getElementById('filter-overlay');
const openBtn       = document.getElementById('filter-open-btn');
const closeBtn      = document.getElementById('filter-close-btn');

openBtn?.addEventListener('click', e => {
  e.stopPropagation();
  filterMenu.classList.add('open', 'visible');
  filterOverlay.classList.add('active');
});
closeBtn?.addEventListener('click', e => {
  e.stopPropagation();
  filterMenu.classList.remove('visible');
  filterOverlay.classList.remove('active');
  filterMenu.addEventListener('transitionend', function h(ev) {
    if (ev.propertyName === 'opacity') {
      filterMenu.classList.remove('open');
      filterMenu.removeEventListener('transitionend', h);
    }
  });
});
filterOverlay?.addEventListener('click', () => closeBtn?.click());
filterMenu?.addEventListener('click', e => e.stopPropagation());
document.addEventListener('click', e => {
  if (
    filterMenu?.classList.contains('open') &&
    !filterMenu.contains(e.target) &&
    e.target !== openBtn
  ) {
    closeBtn?.click();
  }
});

// ========== КНОПКА “НАВЕРХ” ==========
const scrollBtn = document.getElementById('scrollToTopBtn');


// Плавный скролл наверх
scrollBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

