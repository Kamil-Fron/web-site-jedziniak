// Dropdown menu toggle for mobile
if (typeof document !== 'undefined') {
  document.querySelectorAll('.dropdown > a').forEach(btn => {
    btn.addEventListener('click', e => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        btn.parentElement.classList.toggle('open');
      }
    });
  });
}
