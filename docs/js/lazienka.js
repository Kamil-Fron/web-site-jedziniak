// Generowanie galerii obrazów dla łazienki
const images = [
  { src: 'https://picsum.photos/id/30/800/600', alt: 'Minimalistyczna łazienka' },
  { src: 'https://picsum.photos/id/31/800/600', alt: 'Umywalka z szafką' },
  { src: 'https://picsum.photos/id/32/800/600', alt: 'Wanna wolnostojąca' },
  { src: 'https://picsum.photos/id/33/800/600', alt: 'Szafka na ręczniki' }
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
