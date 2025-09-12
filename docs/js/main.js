// Podglądy sekcji będą pobierane dynamicznie z API

function renderPreview(sectionId, images, link) {
  const container = document.getElementById(sectionId);
  if (!container) return;
  images.forEach(image => {
    const a = document.createElement('a');
    a.href = link;
    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.alt || '';
    a.appendChild(img);
    container.appendChild(a);
  });
}

async function loadPreviews() {
  const sections = [
    { category: 'kuchnia', sectionId: 'kuchnia-preview', link: 'kuchnia.html' },
    { category: 'salon', sectionId: 'salon-preview', link: 'salon.html' },
    { category: 'lazienka', sectionId: 'lazienka-preview', link: 'lazienka.html' },
    { category: 'sypialnia', sectionId: 'sypialnia-preview', link: 'sypialnia.html' },
    { category: 'inne', sectionId: 'inne-preview', link: 'inne.html' }
  ];

  for (const { category, sectionId, link } of sections) {
    try {
      const res = await fetch(`/api/gallery?category=${category}`);
      const images = await res.json();
      renderPreview(sectionId, images, link);
    } catch (err) {
      console.error('Błąd pobierania galerii', err);
    }
  }
}

loadPreviews();

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