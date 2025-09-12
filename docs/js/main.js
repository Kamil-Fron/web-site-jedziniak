const kuchniaPreview = [
  { src: 'https://picsum.photos/id/10/250/160', alt: 'Nowoczesna kuchnia z drewnem' },
  { src: 'https://picsum.photos/id/11/250/160', alt: 'Szafki kuchenne' },
  { src: 'https://picsum.photos/id/12/250/160', alt: 'Wyspa kuchenna' },
  { src: 'https://picsum.photos/id/13/250/160', alt: 'Blat z naturalnego drewna' }
];
const salonPreview = [
  { src: 'https://picsum.photos/id/20/250/160', alt: 'Stylowy salon' },
  { src: 'https://picsum.photos/id/21/250/160', alt: 'Kanapa w salonie' },
  { src: 'https://picsum.photos/id/22/250/160', alt: 'Stolik kawowy' },
  { src: 'https://picsum.photos/id/23/250/160', alt: 'Półka na książki' }
];
const lazienkaPreview = [
  { src: 'https://picsum.photos/id/30/250/160', alt: 'Minimalistyczna łazienka' },
  { src: 'https://picsum.photos/id/31/250/160', alt: 'Umywalka z szafką' },
  { src: 'https://picsum.photos/id/32/250/160', alt: 'Wanna wolnostojąca' },
  { src: 'https://picsum.photos/id/33/250/160', alt: 'Szafka na ręczniki' }
];
const innePreview = [
  { src: 'https://picsum.photos/id/40/250/160', alt: 'Szafa na zamówienie' },
  { src: 'https://picsum.photos/id/41/250/160', alt: 'Biurko z drewna' },
  { src: 'https://picsum.photos/id/42/250/160', alt: 'Łóżko drewniane' },
  { src: 'https://picsum.photos/id/43/250/160', alt: 'Regał na książki' }
];

function renderPreview(sectionId, images, link) {
  const container = document.getElementById(sectionId);
  if (!container) return;
  images.forEach(({ src, alt }) => {
    const a = document.createElement('a');
    a.href = link;
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    a.appendChild(img);
    container.appendChild(a);
  });
}

renderPreview('kuchnia-preview', kuchniaPreview, 'kuchnia.html');
renderPreview('salon-preview', salonPreview, 'salon.html');
renderPreview('lazienka-preview', lazienkaPreview, 'lazienka.html');
renderPreview('inne-preview', innePreview, 'inne.html');

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

document.getElementById('year').textContent = new Date().getFullYear();

