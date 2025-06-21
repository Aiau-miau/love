

DG.then(function () {
      const map = DG.map('map', {
        center: [43.235785, 76.858342], // ваши координаты
        zoom: 16
      });
      DG.marker([43.235785, 76.858342])
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

// 1) Your desktop Gmail compose URL
const gmailComposeUrl =
  'https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=loveballoon.kz@gmail.com';

// 2) Fallback mailto: for mobile
const mailtoUrl = 'mailto:loveballoon.kz@gmail.com';

// 3) Detect mobile browsers
const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);

const link = document.getElementById('contactLink');
link.href = isMobile ? mailtoUrl : gmailComposeUrl;
