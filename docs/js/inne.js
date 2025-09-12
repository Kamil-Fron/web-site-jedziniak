// Generowanie galerii obrazów dla innych mebli
const images = [
  { src: 'https://picsum.photos/id/40/800/600', alt: 'Szafa na zamówienie' },
  { src: 'https://picsum.photos/id/41/800/600', alt: 'Biurko z drewna' },
  { src: 'https://picsum.photos/id/42/800/600', alt: 'Łóżko drewniane' },
  { src: 'https://picsum.photos/id/43/800/600', alt: 'Regał na książki' }
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
