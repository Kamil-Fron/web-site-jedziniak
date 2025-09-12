// Dropdown menu toggle for mobile
if (typeof document !== 'undefined') {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.menu-toggle');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      // Show or hide the navigation by toggling the `.open` class
      nav.classList.toggle('open');
    });
  }

  document.querySelectorAll('.dropdown > a').forEach(btn => {
    btn.addEventListener('click', e => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        btn.parentElement.classList.toggle('open');
      }
    });
  });
}
