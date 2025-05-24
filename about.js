
DG.then(function () {
      const map = DG.map('map', {
        center: [43.236168, 76.858341], // ваши координаты
        zoom: 16
      });
      DG.marker([43.236168, 76.858341])
        .addTo(map)
        .bindPopup('Здесь наш адрес!');
    });


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