// Generowanie galerii obrazów dla sypialni
const images = [
  { src: 'https://picsum.photos/id/50/800/600', alt: 'Przytulna sypialnia' },
  { src: 'https://picsum.photos/id/51/800/600', alt: 'Łóżko drewniane w sypialni' },
  { src: 'https://picsum.photos/id/52/800/600', alt: 'Szafa w sypialni' },
  { src: 'https://picsum.photos/id/53/800/600', alt: 'Stolik nocny' }
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
