// Generowanie galerii obrazów dla innych mebli
async function loadGallery() {
  const grid = document.getElementById('gallery-grid');
  try {
    const res = await fetch('/api/gallery?category=inne');
    const images = await res.json();
    images.forEach(({ src, alt }) => {
      const fig = document.createElement('figure');
      fig.className = 'item';
      const img = document.createElement('img');
      img.src = src;
      img.alt = alt;
      fig.appendChild(img);
      grid.appendChild(fig);
    });
  } catch (err) {
    console.error('Błąd pobierania galerii', err);
  }
}

loadGallery();

// Animacja pojawiania się sekcji
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Obsługa formularza kontaktowego
const form = document.querySelector('.contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Dziękujemy za wiadomość!');
    form.reset();
  });
}

document.getElementById('year').textContent = new Date().getFullYear();
