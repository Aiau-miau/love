// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let processedItems = [],
  fields = [],
  activeCategory = "all",
  searchTerm = "";
let specialFilter = null;
let birthFilterWord = null;
let popularFilterWord = null;


// ========== ЭЛЕМЕНТЫ СТРАНИЦЫ ==========
const loader = document.getElementById("loader");
const searchBtn = document.getElementById("searchBtn");
const headerTitle = document.getElementById("header-title");
const modal = document.getElementById("modal");

// ========== ЛЕЙБЛЫ И КАРТЫ ==========
const labels = {
  all: "LOVE BALLOON",
  women: "Для Девушек",
  men: "Для Мужчин",
  boys: "Для Мальчиков",
  girls: "Для Девочек",
  baby_boy: "Выписка (мальчик)",
  baby_girl: "Выписка (девочка)",
  child: "Ребенку",
  man: "Мужчине",
  woman: "Девушке",
  birth:   "День Рождения",
  popular: "Популярные товары"
};

const specialMap = {
  child: ["boys", "girls", "baby_boy", "baby_girl"],
  man: ["men"],
  woman: ["women"],
};

// ========== УТИЛИТЫ ==========
function updateHeaderTitle(key) {
  
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// ========== ФИЛЬТРАЦИЯ И ПОИСК ==========
let debouncedRender = debounce(renderCards, 200);

searchBtn.addEventListener("click", e => {
  e.preventDefault();
  if (document.getElementById("searchInput")) return;
  const input = document.createElement("input");
  Object.assign(input, {
    id: "searchInput",
    type: "text",
    placeholder: "Поиск товаров...",
    style: "width:300px;padding:10px;border-radius:20px;"
  });
  input.addEventListener("input", ev => {
    searchTerm = ev.target.value.trim().toLowerCase();
    debouncedRender();
  });
  input.addEventListener("keydown", ev => {
    if (ev.key === "Escape") {
      searchTerm = "";
      debouncedRender();
      input.replaceWith(headerTitle);
    }
  });
  headerTitle.replaceWith(input);
  input.focus();
});

// ========== ОБРАБОТЧИКИ БОКОВОГО МЕНЮ ==========
document.querySelectorAll("#categoryList a[data-cat]").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    specialFilter = null;
    document.getElementById("categoryList").classList.remove("hide-category-list");

    activeCategory = a.dataset.cat;
    document.querySelectorAll("#categoryList a").forEach(x => x.classList.remove("active"));
    a.classList.add("active");
    closeMenu();
    debouncedRender();
  });

});

// ========== ОБРАБОТЧИКИ ЗАГОЛОВКОВ «РЕБЕНКУ»/«МУЖЧИНЕ»/«ДЕВУШКЕ» ==========
document.querySelectorAll(".category h3").forEach(h3 => {
  h3.addEventListener("click", () => {
    // сброс бокового меню
    document.querySelectorAll("#categoryList a").forEach(x => x.classList.remove("active"));
    activeCategory = "all";

    let key;
    const text = h3.textContent.trim();
    if (text === "РЕБЕНКУ") {
      specialFilter = specialMap.child;
      key = "child";
    } else if (text === "МУЖЧИНЕ") {
      specialFilter = specialMap.man;
      key = "man";
    } else if (text === "ДЕВУШКЕ") {
      specialFilter = specialMap.woman;
      key = "woman";
    } else {
      specialFilter = null;
      key = "all";
    }

    document.querySelectorAll(".category h3").forEach(x => x.classList.remove("active"));
    h3.classList.add("active");
    debouncedRender();
  });
});

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function normalizeType(text) {
  const norm = text.toLowerCase();
  return ["сердце", "сердца", "сердец"].includes(norm) ? "сердце" : norm;
}

// ========== РЕНДЕР КАРТОЧЕК ==========
function renderCards() {
  const prod = document.getElementById("products");
  prod.innerHTML = "";
  let cnt = 0;

  const isBirthMode = Boolean(birthFilterWord);

  

  const activeTypes = [...document.querySelectorAll(".types .tag.active p")]
    .map(el => normalizeType(el.textContent.trim()));
  const activeColors = [...document.querySelectorAll(".colors .tag.active p")]
    .map(el => el.textContent.trim().toLowerCase());

  for (const item of processedItems) {
    
    const name = item[fields[0]] || "";
    const img = item[fields[1]] || "";
    const price = item[fields[2]] || "";
    const desc = item[fields[3]] || "";
    const category = (item[fields[4]] || "").toLowerCase();
    const colors = (item[fields[5]] || "").split(",").map(s => s.trim().toLowerCase());
    const extraBirth = (item[fields[6]] || "").toLowerCase();
    const extraPopular = (item[fields[7]] || "").toLowerCase();

    

    // фильтрация по категории
     // 1) режим baby
    if (specialFilter) {
      if (!specialFilter.includes(category)) continue;
    }
    // 2) режим birth
    else if (birthFilterWord) {
      if (!extraBirth.includes(birthFilterWord)) continue;
    }
    // 3) режим popular
    else if (popularFilterWord) {
      if (!extraPopular.includes(popularFilterWord)) continue;
    }
    // 4) обычная категория
    else if (activeCategory !== "all") {
      if (category !== activeCategory) continue;
    }

    // фильтрация по типам
    if (activeTypes.length && !activeTypes.every(t => normalizeType(desc.toLowerCase()).includes(t))) continue;
    // фильтрация по цветам
    if (activeColors.length && !activeColors.every(c => colors.includes(c))) continue;
    // поиск по тексту
    if (searchTerm && !(name + " " + desc).toLowerCase().includes(searchTerm)) continue;

    cnt++;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-img-wrap">
        <img class="all-products-img" src="${img}" onerror="this.src='https://via.placeholder.com/240x160'">
        <img class="heart-icon ${favorites.includes(name) ? "favorited" : ""}"
             src="./images/${favorites.includes(name) ? "heart_icon_after" : "heart_icon_before"}.svg"
             alt="Избранное">
      </div>
      <div class="card-title">
        <p>${name}</p>
        <p class="price">${price} ₸</p>
        <button class="order-now">Заказать</button>
      </div>
    `;
    // события
    card.querySelector(".order-now").onclick = () => {
  // name, price, desc, img all come from your item
  const kaspiUrl = "https://pay.kaspi.kz/pay/pizgc94e";
  openWhatsAppOrder(name, price, desc, img, kaspiUrl);
};



    card.addEventListener("click", () => openModal({ name, img, price, desc }));
    prod.appendChild(card);

    const heart = card.querySelector(".heart-icon");
    heart.addEventListener("click", e => {
      e.stopPropagation();
      if (favorites.includes(name)) {
        favorites = favorites.filter(n => n !== name);
        heart.src = "./images/heart_icon_before.svg";
        heart.classList.remove("favorited");
      } else {
        favorites.push(name);
        heart.src = "./images/heart_icon_after.svg";
        heart.classList.add("favorited");
      }
      saveFavorites();
    });
  }

  document.getElementById("matchesCount").textContent =
    cnt === 1 ? "1 совпадение" : `${cnt} совпадений`;
}


// ========== ИНИЦИАЛИЗАЦИЯ ФИЛЬТРОВ ==========
function initFilters() {
  document.querySelectorAll(".tag").forEach(tag => {
    tag.onclick = e => {
      e.stopPropagation();
      const txt = tag.textContent.trim().toLowerCase();
      tag.classList.toggle("active");
      const activeBox = document.querySelector(".active-tags");
      if (tag.classList.contains("active")) {
        if (!activeBox.querySelector(`[data-tag="${txt}"]`)) {
          const el = document.createElement("div");
          el.className = "active-tag";
          el.dataset.tag = txt;
          const col = tag.querySelector(".color");
          if (col) el.appendChild(col.cloneNode(true));
          el.appendChild(Object.assign(document.createElement("span"), { textContent: txt }));
          el.appendChild(Object.assign(document.createElement("span"), { className: "remove-tag", textContent: "✕" }));
          activeBox.appendChild(el);
        }
      } else {
        activeBox.querySelector(`[data-tag="${txt}"]`)?.remove();
      }
      debouncedRender();
    };
  });

  document.querySelector(".active-tags").onclick = e => {
    if (e.target.classList.contains("remove-tag")) {
      const el = e.target.closest(".active-tag");
      const txt = el.dataset.tag;
      el.remove();
      document.querySelectorAll(".tag").forEach(t => {
        if (t.textContent.trim().toLowerCase() === txt) t.classList.remove("active");
      });
      debouncedRender();
    }
  };
}

// ========== ЗАГРУЗКА И СТАРТ ==========
function loadAndInit() {
  const urlCat = new URLSearchParams(window.location.search).get("cat");
  const urlSpecial = new URLSearchParams(window.location.search).get("special");
  

  if (urlCat) {
    activeCategory = urlCat;
    document.querySelectorAll("#categoryList a[data-cat]").forEach(x => x.classList.remove("active"));
    const sel = document.querySelector(`#categoryList a[data-cat="${urlCat}"]`);
    if (sel) sel.classList.add("active");
    updateHeaderTitle(activeCategory);
  }

if (urlSpecial === "baby") {
  specialFilter = ["baby_boy", "baby_girl"];
  updateHeaderTitle("baby");  
  document.getElementById("categoryList").classList.add("hide-category-list");   // если вы заводили в labels ключ "baby":"Выписка"
}else if (urlSpecial === "birth") {
  activeCategory   = "all";
  specialFilter    = null;
  birthFilterWord  = "birth";      // <- вот здесь
  updateHeaderTitle("birth");
    document.getElementById("categoryList").classList.add("hide-category-list");
}else if (urlSpecial === "popular") {
  activeCategory     = "all";
  specialFilter      = null;
  birthFilterWord    = null;
  popularFilterWord  = "yes";      // ищем yes в 7-м столбце
  updateHeaderTitle("popular");
    document.getElementById("categoryList").classList.add("hide-category-list");
}



  loader && (loader.style.display = "block");

  Papa.parse(
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTbtBsnRAE2vVA4sCdHNUnH_3Rao9DlTnzZxs_C9ate6mA2KA6_WeQsfZaxluCmjBv61Frn-eoIXyoL/pub?output=csv&sheet=Лист1&cb=" + Date.now(),
    {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete(r) {
        fields = r.meta.fields;
        processedItems = r.data;
        initFilters();
        renderCards();
        loader && (loader.style.display = "none");
      }
    }
  );
}


document.addEventListener("DOMContentLoaded", loadAndInit);

// ========== МЕНЮ, МОДАЛКИ И КНОПКИ ==========
function openMenu() { document.getElementById("burger_menu").classList.add("open"); document.getElementById("overlay").classList.add("active"); }
function closeMenu() { document.getElementById("burger_menu").classList.remove("open"); document.getElementById("overlay").classList.remove("active"); }

document.querySelectorAll('.icon-button[onclick="openMenu()"]').forEach(btn => btn.addEventListener("click", openMenu));
document.querySelectorAll(".close-icon, #overlay").forEach(el => el.addEventListener("click", closeMenu));

const filterMenu = document.getElementById("filter-menu");
const filterOverlay = document.getElementById("filter-overlay");

document.getElementById("filter-open-btn")?.addEventListener("click", e => {
  e.stopPropagation();
  filterMenu.classList.add("open", "visible");
  filterOverlay.classList.add("active");
});
document.getElementById("filter-close-btn")?.addEventListener("click", e => {
  e.stopPropagation();
  filterMenu.classList.remove("visible");
  filterOverlay.classList.remove("active");
  filterMenu.addEventListener("transitionend", function h(ev) {
    if (ev.propertyName === "opacity") {
      filterMenu.classList.remove("open");
      filterMenu.removeEventListener("transitionend", h);
    }
  });
});
filterOverlay?.addEventListener("click", () => document.getElementById("filter-close-btn")?.click());
filterMenu?.addEventListener("click", e => e.stopPropagation());

document.getElementById("scrollToTopBtn")?.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" })
);

// ========== ИЗБРАННОЕ ==========
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

// ========== МОДАЛЬНОЕ ОКНО ==========
function openWhatsAppOrder(name, price, desc, imgUrl, kaspiUrl) {
  // Build the text of the message, including the image URL and Kaspi link
  const text = 
    `Здравствуйте! Хочу заказать:\n\n` +
    `${name} — ${price} ₸\n` +
    `Описание: ${desc}\n\n` +
    `Фото товара: ${imgUrl}\n\n` +
    `💳 Оплата: ${kaspiUrl}`;

  const encoded = encodeURIComponent(text);
  const whatsappLink = `https://api.whatsapp.com/send?phone=+77023971888&text=${encoded}`;

  // First try window.open (new tab). If popup is blocked, fall back:
  const newWin = window.open(whatsappLink, "_blank");
  if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
    // popup blocked → redirect current page instead
    window.location.href = whatsappLink;
  }

  // close modal if you’re using one:
  if (modal) modal.style.display = "none";
}




function openModal({ name, img, price, desc }) {
  // Populate modal fields
  modal.querySelector("#modalImg").src = img;
  modal.querySelector("#modalTitle").textContent = name;
  modal.querySelector("#modalPrice").textContent = price + " ₸";
  modal.querySelector("#modalDesc").textContent = desc;
  modal.style.display = "flex";

  // Add to cart
  modal.querySelector("#addToCartBtn").onclick = () => {
    const cart = JSON.parse(localStorage.getItem("cartItems") || "[]");
    cart.push({ name, img, price });
    localStorage.setItem("cartItems", JSON.stringify(cart));
    modal.style.display = "none";
  };

  // Order single item via WhatsApp
  modal.querySelector("#orderSingleBtn").onclick = () => {
    const kaspiUrl = "https://pay.kaspi.kz/pay/pizgc94e";
    // Use the parameters passed into openModal
    openWhatsAppOrder(name, price, desc, img, kaspiUrl);
  };
}

document.querySelectorAll(".category h3").forEach(h3 => {
  h3.addEventListener("click", () => {
    document.querySelectorAll(".category h3").forEach(x => x.classList.remove("active"));
    h3.classList.add("active");
  });
});
const urlParams = new URLSearchParams(window.location.search);

// JS: добавляем перетаскивание мышью/пальцем
const slider = document.getElementById('categoryList');
let isDown = false, startX, scrollLeft;

slider.addEventListener('mousedown', e => {
  isDown = true;
  slider.classList.add('dragging');
  startX = e.pageX - slider.offsetLeft;
  scrollLeft = slider.scrollLeft;
});
slider.addEventListener('mouseleave', () => {
  isDown = false;
  slider.classList.remove('dragging');
});
slider.addEventListener('mouseup', () => {
  isDown = false;
  slider.classList.remove('dragging');
});
slider.addEventListener('mousemove', e => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - slider.offsetLeft;
  const walk = (x - startX) * 1.5; // чувствительность
  slider.scrollLeft = scrollLeft - walk;
});

// Для тача (мобильных)
slider.addEventListener('touchstart', e => {
  startX = e.touches[0].pageX - slider.offsetLeft;
  scrollLeft = slider.scrollLeft;
});
slider.addEventListener('touchmove', e => {
  const x = e.touches[0].pageX - slider.offsetLeft;
  const walk = (x - startX) * 1.5;
  slider.scrollLeft = scrollLeft - walk;
});

// Фильтрация при клике (как у вас)
slider.querySelectorAll('a[data-cat]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    // удаляем .active и ставим на кликнутый
    slider.querySelectorAll('a').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    // ваш существующий код:
    activeCategory = a.dataset.cat;
    specialFilter = null;
    debouncedRender();
  });
});




  