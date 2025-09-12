const list = document.getElementById('gallery-list');
const form = document.getElementById('upload-form');
const fileInput = form.querySelector('input[type="file"]');
const preview = document.getElementById('preview');

// Dynamiczny filtr kategorii
const filter = document.createElement('select');
const allOption = document.createElement('option');
allOption.value = '';
allOption.textContent = 'Wszystkie kategorie';
filter.appendChild(allOption);
list.parentNode.insertBefore(filter, list);

let galleryData = [];

filter.addEventListener('change', renderGallery);

fileInput.addEventListener('change', () => {
  preview.innerHTML = '';
  for (const file of fileInput.files) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.width = 100;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});


// Kopia funkcji renderPreview z głównego skryptu, aby można było
// odświeżać miniatury na stronie po stronie klienta.
function renderPreview(sectionId, images, link) {
  const container = document.getElementById(sectionId);
  if (!container) return;
  container.innerHTML = '';
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

// Pobiera dane miniatur dla wszystkich kategorii i aktualizuje sekcje
// na stronie. Funkcja może być uruchamiana po dodaniu obrazu lub
// periodycznie w celu odświeżania widoku.
function refreshPreviews() {
  fetch('/api/categories')
    .then(res => res.json())
    .then(data => {
      renderPreview('kuchnia-preview', data.kuchnia || [], 'kuchnia.html');
      renderPreview('salon-preview', data.salon || [], 'salon.html');
      renderPreview('lazienka-preview', data.lazienka || [], 'lazienka.html');
      renderPreview('inne-preview', data.inne || [], 'inne.html');
    });
}

function loadGallery() {
  fetch('/api/gallery?mode=full')
    .then(res => res.json())
    .then(images => {
      galleryData = images;
      updateFilterOptions();
      renderGallery();
    });
}

function updateFilterOptions() {
  const categories = Array.from(new Set(galleryData.map(img => img.category || 'Inne')));
  filter.querySelectorAll('option:not(:first-child)').forEach(opt => opt.remove());
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    filter.appendChild(option);
  });
}

function renderGallery() {
  list.innerHTML = '';
  const selected = filter.value;

  const groups = galleryData.reduce((acc, img) => {
    const cat = img.category || 'Inne';
    if (!selected || selected === cat) {
      (acc[cat] = acc[cat] || []).push(img);
    }
    return acc;
  }, {});

  Object.keys(groups).forEach(cat => {
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    heading.textContent = cat;
    section.appendChild(heading);

    const container = document.createElement('div');
    groups[cat].forEach(img => {
      const wrapper = document.createElement('div');
      const image = document.createElement('img');
      const src = img.src || `../images/${img.filename}`;
      image.src = src;
      image.width = 150;
      const btn = document.createElement('button');
      btn.textContent = 'Usuń';
      btn.onclick = () => {
        fetch(`/api/gallery/${img.id}`, { method: 'DELETE' })
          .then(loadGallery);
      };
      wrapper.appendChild(image);
      wrapper.appendChild(btn);
      container.appendChild(wrapper);
    });
    section.appendChild(container);
    list.appendChild(section);
  });
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const formData = new FormData(form);
  const data = new FormData();
  data.append('category', form.category.value);
  for (const file of formData.getAll('images')) {
    data.append('images', file);
  }
  fetch('/api/upload', { method: 'POST', body: data })
    .then(() => {
      form.reset();
      preview.innerHTML = '';
      loadGallery();
      refreshPreviews();

    });
});

loadGallery();
refreshPreviews();

// Okresowe odświeżanie miniatur, aby nowe zdjęcia pojawiały się
// bez konieczności przeładowywania strony głównej.
setInterval(refreshPreviews, 10000);
