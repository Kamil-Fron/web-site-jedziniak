// Generowanie galerii obrazów dla salonu
const images = [
  { src: 'https://picsum.photos/id/20/800/600', alt: 'Stylowy salon' },
  { src: 'https://picsum.photos/id/21/800/600', alt: 'Kanapa w salonie' },
  { src: 'https://picsum.photos/id/22/800/600', alt: 'Stolik kawowy' },
  { src: 'https://picsum.photos/id/23/800/600', alt: 'Półka na książki' }
];

const grid = document.getElementById('gallery-grid');
images.forEach(({ src, alt }) => {
  const fig = document.createElement('figure');
  fig.className = 'item';
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  fig.appendChild(img);
  grid.appendChild(fig);
});

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
