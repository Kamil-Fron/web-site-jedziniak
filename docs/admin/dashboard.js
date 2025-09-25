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

async function fetchOrRedirect(url, options = {}) {
  const { silent, ...fetchOptions } = options;
  const config = { ...fetchOptions, credentials: 'include' };
  try {
    const res = await fetch(url, config);
    if (res.status === 401) {
      window.location.href = '/login';
      return null;
    }
    return res;
  } catch (error) {
    console.error('Błąd połączenia z serwerem', error);
    if (!silent) {
      alert('Wystąpił problem z połączeniem z serwerem.');
    }
    return null;
  }
}

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
async function refreshPreviews() {
  const res = await fetchOrRedirect('/api/categories', { silent: true });
  if (!res) return;
  try {
    const data = await res.json();
    renderPreview('kuchnia-preview', data.kuchnia || [], 'kuchnia.html');
    renderPreview('salon-preview', data.salon || [], 'salon.html');
    renderPreview('lazienka-preview', data.lazienka || [], 'lazienka.html');
    renderPreview('inne-preview', data.inne || [], 'inne.html');
  } catch (error) {
    console.error('Nie udało się odczytać danych kategorii', error);
  }
}

async function loadGallery() {
  const res = await fetchOrRedirect('/api/gallery?mode=full');
  if (!res) return;
  try {
    const images = await res.json();
    galleryData = images;
    updateFilterOptions();
    renderGallery();
  } catch (error) {
    console.error('Nie udało się odczytać danych galerii', error);
    alert('Wystąpił błąd podczas ładowania galerii.');
  }
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
    container.classList.add('scroll-gallery', 'admin-gallery');
    groups[cat].forEach(img => {
      const wrapper = document.createElement('div');
      const image = document.createElement('img');
      const src = img.src || `../images/${img.filename}`;
      image.src = src;
      image.width = 150;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Usuń';
      btn.onclick = async () => {
        btn.disabled = true;
        try {
          const res = await fetchOrRedirect(`/api/gallery/${img.id}`, { method: 'DELETE' });
          if (!res) return;
          if (res.ok) {
            loadGallery();
          } else {
            console.error('Delete failed with status', res.status);
            alert('Nie udało się usunąć zdjęcia. Status: ' + res.status);
          }
        } catch (err) {
          console.error(err);
          alert('Wystąpił błąd podczas usuwania zdjęcia.');
        } finally {
          btn.disabled = false;
        }
      };
      wrapper.appendChild(image);
      wrapper.appendChild(btn);
      container.appendChild(wrapper);
    });
    section.appendChild(container);
    list.appendChild(section);
  });
}

const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async e => {
  e.preventDefault();
  submitBtn.disabled = true;
  try {
    const formData = new FormData(form);
    const data = new FormData();
    data.append('category', form.category.value);
    for (const file of formData.getAll('images')) {
      data.append('images', file);
    }
    const uploadRes = await fetchOrRedirect('/api/upload', { method: 'POST', body: data });
    if (!uploadRes) return;
    if (!uploadRes.ok) {
      console.error('Upload failed with status', uploadRes.status);
      throw new Error('Upload failed');
    }
    const refreshRes = await fetchOrRedirect('/api/refresh-categories');
    if (!refreshRes) return;
    if (!refreshRes.ok) {
      console.error('Refresh failed with status', refreshRes.status);
      throw new Error('Refresh failed');
    }
    form.reset();
    preview.innerHTML = '';
    fileInput.value = '';
    loadGallery();
    refreshPreviews();
  } catch (err) {
    console.error(err);
    alert('Wystąpił błąd podczas przesyłania plików.');
  } finally {
    submitBtn.disabled = false;
  }
});

loadGallery();
refreshPreviews();

// Okresowe odświeżanie miniatur, aby nowe zdjęcia pojawiały się
// bez konieczności przeładowywania strony głównej.
setInterval(refreshPreviews, 10000);
