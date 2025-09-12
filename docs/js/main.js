// Generowanie galerii obrazów
const images = [
  {
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    alt: 'Nowoczesny stół dębowy'
  },
  {
    src: 'https://images.unsplash.com/photo-1616627984317-e17e3675b4f7?auto=format&fit=crop&w=800&q=80',
    alt: 'Elegancka sofa skórzana'
  },
  {
    src: 'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=800&q=80',
    alt: 'Minimalistyczne krzesło'
  },
  {
    src: 'https://images.unsplash.com/photo-1615873968403-89a0fe14e25f?auto=format&fit=crop&w=800&q=80',
    alt: 'Szafka nocna z drewna'
  },
  {
    src: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    alt: 'Komoda w stylu skandynawskim'
  },
  {
    src: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&w=800&q=80',
    alt: 'Zestaw mebli kuchennych'
  }
];

const grid = document.getElementById('gallery-grid');
if (grid) {
  images.forEach(({ src, alt }) => {
    const fig = document.createElement('figure');
    fig.className = 'item';
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    fig.appendChild(img);
    grid.appendChild(fig);
  });
}

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
form.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Dziękujemy za wiadomość!');
  form.reset();
});
