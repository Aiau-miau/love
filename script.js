  // ========== ИНИЦИАЛИЗАЦИЯ FAVORITES ==========
  let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify(favorites));
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
    return ["сердце", "сердца", "сердец"].includes(norm) ? "сердце" : norm;
  }

  // ========== КОНФИГУРАЦИЯ ==========
  const baseCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTbtBsnRAE2vVA4sCdHNUnH_3Rao9DlTnzZxs_C9ate6mA2KA6_WeQsfZaxluCmjBv61Frn-eoIXyoL/pub?output=csv&sheet=Лист1";
  let processedItems = [], fields = [], activeCategory = "all", searchTerm = "";
  const loader = document.getElementById("loader");
  const searchBtn = document.getElementById("searchBtn");
  const headerTitle = document.getElementById("header-title");
  const debouncedRender = debounce(renderCards, 200);
  const modal = document.getElementById("modal");

  // ========== ГЛОБАЛЬНЫЕ Функции for МОДАЛКИ ==========
  function openWhatsAppOrder(name, price, desc) {
    const message = encodeURIComponent(
      `Здравствуйте! Хочу заказать:\n\n${name} — ${price} ₸\n\nОписание: ${desc}`
    );
    window.open(`https://api.whatsapp.com/send?phone=+77023971888&text=${message}`, "_blank");
    modal.style.display = "none";
  }
  function openModal({ name, img, price, desc }) {
    modal.querySelector("#modalImg").src = img;
    modal.querySelector("#modalTitle").textContent = name;
    modal.querySelector("#modalPrice").textContent = price + " ₸";
    modal.querySelector("#modalDesc").textContent = desc;
    modal.style.display = "flex";

    modal.querySelector("#addToCartBtn").onclick = () => {
      const cart = JSON.parse(localStorage.getItem("cartItems") || "[]");
      cart.push({ name, img, price });
      localStorage.setItem("cartItems", JSON.stringify(cart));
      modal.style.display = "none";
    };

    modal.querySelector("#orderSingleBtn").onclick = () => {
      openWhatsAppOrder(name, price, desc);
    };

    modal.querySelectorAll("#closeModal, #modalOverlay").forEach(el => {
      el.onclick = () => modal.style.display = "none";
    });
  }

  // ========== РЕНДЕР КАРТОЧЕК ==========
  function renderCards() {
    const prod = document.getElementById("products");
    prod.innerHTML = "";
    let cnt = 0;

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

      // фильтры
      if (activeCategory !== "all" && category !== activeCategory) continue;
      if (activeTypes.length && !activeTypes.every(t => normalizeType(desc.toLowerCase()).includes(t))) continue;
      if (activeColors.length && !activeColors.every(c => colors.includes(c))) continue;
      if (searchTerm && !(name + " " + desc).toLowerCase().includes(searchTerm)) continue;

      cnt++;
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-img-wrap">
          <img class="all-products-img" src="${img}"
               onerror="this.src='https://via.placeholder.com/240x160'">
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

      // кнопка Заказать
      card.querySelector(".order-now").onclick = () => openWhatsAppOrder(name, price, desc);

      // клик по карточке — открыть модалку
      card.addEventListener("click", () => openModal({ name, img, price, desc }));
      prod.appendChild(card);

      // избранное
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
    const labels = {
      all: "Все Товары", women: "Для Девушек", men: "Для Мужчин",
      boys: "Для Мальчиков", girls: "Для Девочек",
      baby_boy: "Выписка (мальчик)", baby_girl: "Выписка (девочка)",
    };

    document.querySelectorAll("#categoryList a[data-cat]").forEach(a => {
      a.onclick = e => {
        e.preventDefault();
        document.querySelectorAll("#categoryList a[data-cat]").forEach(x => x.classList.remove("active"));
        a.classList.add("active");
        activeCategory = a.dataset.cat;
        document.getElementById("currentCategoryLabel").textContent = labels[activeCategory] || "Все Товары";
        debouncedRender();
        closeMenu();
      };
    });

    const activeBox = document.querySelector(".active-tags");
    document.querySelectorAll(".tag").forEach(tag => {
      tag.onclick = e => {
        e.stopPropagation();
        const txt = tag.textContent.trim().toLowerCase();
        tag.classList.toggle("active");
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

    activeBox.onclick = e => {
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

  // ========== ЗАГРУЗКА + СТАРТ ==========
  function loadAndInit() {
    const urlCat = getParam("cat");
    if (urlCat) {
      activeCategory = urlCat;
      document.querySelectorAll("#categoryList a[data-cat]").forEach(a => a.classList.remove("active"));
      const sel = document.querySelector(`#categoryList a[data-cat="${urlCat}"]`);
      if (sel) {
        sel.classList.add("active");
        const labels = {
          all: "Все Товары", women: "Для Девушек", men: "Для Мужчин",
          boys: "Для Мальчиков", girls: "Для Девочек",
          baby_boy: "Выписка (мальчик)", baby_girl: "Выписка (девочка)",
        };
        document.getElementById("currentCategoryLabel").textContent = labels[urlCat] || "Все Товары";
      }
    }
    loader && (loader.style.display = "block");
    Papa.parse(baseCSVUrl + "&cb=" + Date.now(), {
      download: true, header: true, skipEmptyLines: true,
      complete(r) {
        fields = r.meta.fields;
        processedItems = r.data;
        initFilters();
        renderCards();
        loader && (loader.style.display = "none");
      },
    });
  }
  document.addEventListener("DOMContentLoaded", loadAndInit);

  // ========== BURGER & FILTER MENU & SCROLL TOP (без изменений) ==========
  const overlayEl = document.getElementById("overlay");
  document.querySelectorAll('.icon-button[onclick="openMenu()"]').forEach(btn => btn.addEventListener("click", openMenu));
  document.querySelectorAll(".close-icon, #overlay").forEach(el => el.addEventListener("click", closeMenu));
  function openMenu() { document.getElementById("burger_menu").classList.add("open"); overlayEl.classList.add("active"); }
  function closeMenu() { document.getElementById("burger_menu").classList.remove("open"); overlayEl.classList.remove("active"); }

  const filterMenu = document.getElementById("filter-menu");
  const filterOverlay = document.getElementById("filter-overlay");
  document.getElementById("filter-open-btn")?.addEventListener("click", e => { e.stopPropagation(); filterMenu.classList.add("open","visible"); filterOverlay.classList.add("active"); });
  document.getElementById("filter-close-btn")?.addEventListener("click", e => { e.stopPropagation(); filterMenu.classList.remove("visible"); filterOverlay.classList.remove("active"); filterMenu.addEventListener("transitionend", function h(ev){ if(ev.propertyName==="opacity"){ filterMenu.classList.remove("open"); filterMenu.removeEventListener("transitionend", h); } }); });
  filterOverlay?.addEventListener("click", () => document.getElementById("filter-close-btn")?.click());
  filterMenu?.addEventListener("click", e => e.stopPropagation());
  document.addEventListener("click", e => {
    if(filterMenu?.classList.contains("open") && !filterMenu.contains(e.target) && e.target.id!=="filter-open-btn"){
      document.getElementById("filter-close-btn")?.click();
    }
  });

  document.getElementById("scrollToTopBtn")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // ========== ПОИСК ==========
  if (searchBtn && headerTitle) {
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
      input.addEventListener("input", ev => { searchTerm = ev.target.value.trim().toLowerCase(); debouncedRender(); });
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
  }
