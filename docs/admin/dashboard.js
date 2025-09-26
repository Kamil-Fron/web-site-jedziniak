const list = document.getElementById('gallery-list');
const form = document.getElementById('upload-form');
const fileInput = form.querySelector('input[type="file"]');
const preview = document.getElementById('preview');
const testimonialForm = document.getElementById('testimonial-form');
const testimonialsContainer = document.getElementById('testimonials-list');

let testimonialsData = [];

// Dynamiczny filtr kategorii
const filter = document.createElement('select');
filter.classList.add('admin-filter');
const allOption = document.createElement('option');
allOption.value = '';
allOption.textContent = 'Wszystkie kategorie';
filter.appendChild(allOption);
filter.setAttribute('aria-label', 'Filtruj listę galerii');

const toolbar = document.getElementById('gallery-toolbar');
if (toolbar) {
  toolbar.appendChild(filter);
} else {
  list.parentNode.insertBefore(filter, list);
}

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

async function loadGallery({ preserveFilter = true } = {}) {
  const previousValue = preserveFilter ? filter.value : '';
  const res = await fetchOrRedirect('/api/gallery?mode=full');
  if (!res) return;
  try {
    const images = await res.json();
    galleryData = images;
    updateFilterOptions(previousValue);
    renderGallery();
  } catch (error) {
    console.error('Nie udało się odczytać danych galerii', error);
    alert('Wystąpił błąd podczas ładowania galerii.');
  }
}

function updateFilterOptions(selectedValue = '') {
  const categories = Array.from(new Set(galleryData.map(img => img.category || 'Inne')));
  filter.querySelectorAll('option:not(:first-child)').forEach(opt => opt.remove());
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    filter.appendChild(option);
  });
  const hasSelected = selectedValue && categories.includes(selectedValue);
  filter.value = hasSelected ? selectedValue : '';
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

  const categories = Object.keys(groups);

  if (categories.length === 0) {
    const empty = document.createElement('p');
    empty.classList.add('admin-empty');
    empty.textContent = 'Brak zdjęć w wybranej kategorii.';
    list.appendChild(empty);
    return;
  }

  categories.forEach(cat => {
    const section = document.createElement('section');
    section.classList.add('admin-gallery-group');

    const header = document.createElement('div');
    header.classList.add('admin-gallery-group__header');
    const heading = document.createElement('h3');
    heading.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    header.appendChild(heading);
    section.appendChild(header);

    const container = document.createElement('div');
    container.classList.add('scroll-gallery', 'admin-gallery');
    groups[cat].forEach(img => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('admin-gallery__item');
      const image = document.createElement('img');
      const src = img.src || `../images/${img.filename}`;
      image.src = src;
      image.width = 150;
      image.height = 100;
      image.loading = 'lazy';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.classList.add('admin-delete-btn');
      btn.textContent = 'Usuń';
      btn.onclick = async () => {
        btn.disabled = true;
        try {
          const res = await fetchOrRedirect(`/api/gallery/${img.id}`, { method: 'DELETE' });
          if (!res) return;
          if (res.ok) {
            await loadGallery();
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

function getTestimonialPayload(formElement) {
  const authorInput = formElement.querySelector('[name="author"]');
  const ratingInput = formElement.querySelector('[name="rating"]');
  const quoteInput = formElement.querySelector('[name="quote"]');
  const orderInput = formElement.querySelector('[name="order"]');
  const publishedInput = formElement.querySelector('[name="published"]');

  const orderValue = orderInput && orderInput.value !== '' ? Number(orderInput.value) : undefined;

  return {
    author: authorInput ? authorInput.value.trim() : '',
    rating: ratingInput ? Number(ratingInput.value) : undefined,
    quote: quoteInput ? quoteInput.value.trim() : '',
    order: Number.isFinite(orderValue) ? orderValue : undefined,
    published: publishedInput ? Boolean(publishedInput.checked) : false
  };
}

function renderTestimonialsAdmin() {
  if (!testimonialsContainer) return;
  testimonialsContainer.innerHTML = '';

  if (!Array.isArray(testimonialsData) || testimonialsData.length === 0) {
    const empty = document.createElement('p');
    empty.classList.add('admin-empty', 'admin-empty--testimonials');
    empty.textContent = 'Brak dodanych opinii.';
    testimonialsContainer.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  testimonialsData.forEach(testimonial => {
    fragment.appendChild(createTestimonialItem(testimonial));
  });
  testimonialsContainer.appendChild(fragment);
}

function createTestimonialItem(testimonial) {
  const formElement = document.createElement('form');
  formElement.classList.add('admin-testimonial-item');
  formElement.dataset.id = String(testimonial.id);

  const grid = document.createElement('div');
  grid.classList.add('admin-form__grid', 'admin-form__grid--testimonial');

  const authorField = document.createElement('label');
  authorField.className = 'admin-field';
  authorField.innerHTML = '<span>Autor</span>';
  const authorInput = document.createElement('input');
  authorInput.type = 'text';
  authorInput.name = 'author';
  authorInput.required = true;
  authorInput.maxLength = 120;
  authorInput.value = testimonial.author || '';
  authorField.appendChild(authorInput);

  const ratingField = document.createElement('label');
  ratingField.className = 'admin-field';
  ratingField.innerHTML = '<span>Ocena</span>';
  const ratingSelect = document.createElement('select');
  ratingSelect.name = 'rating';
  ratingSelect.required = true;
  ['5', '4', '3', '2', '1'].forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    if (Number(value) === Number(testimonial.rating)) {
      option.selected = true;
    }
    ratingSelect.appendChild(option);
  });
  ratingField.appendChild(ratingSelect);

  const orderField = document.createElement('label');
  orderField.className = 'admin-field admin-field--order';
  orderField.innerHTML = '<span>Kolejność</span>';
  const orderInput = document.createElement('input');
  orderInput.type = 'number';
  orderInput.name = 'order';
  orderInput.min = '1';
  orderInput.step = '1';
  orderInput.value = testimonial.order ? String(testimonial.order) : '';
  orderField.appendChild(orderInput);

  grid.append(authorField, ratingField, orderField);
  formElement.appendChild(grid);

  const quoteField = document.createElement('label');
  quoteField.className = 'admin-field admin-field--textarea';
  quoteField.innerHTML = '<span>Treść opinii</span>';
  const quoteTextarea = document.createElement('textarea');
  quoteTextarea.name = 'quote';
  quoteTextarea.rows = 3;
  quoteTextarea.required = true;
  quoteTextarea.value = testimonial.quote || '';
  quoteField.appendChild(quoteTextarea);
  formElement.appendChild(quoteField);

  const checkboxLabel = document.createElement('label');
  checkboxLabel.className = 'admin-checkbox';
  const publishedInput = document.createElement('input');
  publishedInput.type = 'checkbox';
  publishedInput.name = 'published';
  publishedInput.checked = Boolean(testimonial.published);
  checkboxLabel.appendChild(publishedInput);
  const checkboxText = document.createElement('span');
  checkboxText.textContent = 'Opublikowana na stronie';
  checkboxLabel.appendChild(checkboxText);
  formElement.appendChild(checkboxLabel);

  const actions = document.createElement('div');
  actions.className = 'admin-testimonial-actions';
  const saveButton = document.createElement('button');
  saveButton.type = 'submit';
  saveButton.className = 'btn btn--small';
  saveButton.textContent = 'Zapisz zmiany';
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'admin-delete-btn admin-delete-btn--inline';
  deleteButton.textContent = 'Usuń';
  actions.append(saveButton, deleteButton);
  formElement.appendChild(actions);

  formElement.addEventListener('submit', async event => {
    event.preventDefault();
    saveButton.disabled = true;
    deleteButton.disabled = true;
    try {
      const payload = getTestimonialPayload(formElement);
      const res = await fetchOrRedirect(`/api/admin/testimonials/${testimonial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res) return;
      if (!res.ok) {
        let message = 'Nie udało się zaktualizować opinii.';
        try {
          const data = await res.json();
          if (data && Array.isArray(data.errors)) {
            message = data.errors.join('\n');
          }
        } catch (error) {
          console.error('Nie udało się odczytać odpowiedzi serwera', error);
        }
        alert(message);
        return;
      }
      await loadTestimonialsAdmin();
    } catch (error) {
      console.error('Aktualizacja opinii nie powiodła się', error);
      alert('Nie udało się zapisać zmian.');
    } finally {
      saveButton.disabled = false;
      deleteButton.disabled = false;
    }
  });

  deleteButton.addEventListener('click', async () => {
    const confirmed = window.confirm('Czy na pewno chcesz usunąć tę opinię?');
    if (!confirmed) return;
    deleteButton.disabled = true;
    saveButton.disabled = true;
    try {
      const res = await fetchOrRedirect(`/api/admin/testimonials/${testimonial.id}`, { method: 'DELETE' });
      if (!res) return;
      if (!res.ok) {
        alert('Nie udało się usunąć opinii.');
        return;
      }
      await loadTestimonialsAdmin();
    } catch (error) {
      console.error('Usuwanie opinii nie powiodło się', error);
      alert('Nie udało się usunąć opinii.');
    } finally {
      if (document.contains(formElement)) {
        deleteButton.disabled = false;
        saveButton.disabled = false;
      }
    }
  });

  return formElement;
}

async function loadTestimonialsAdmin() {
  if (!testimonialsContainer) return;
  const res = await fetchOrRedirect('/api/admin/testimonials');
  if (!res) return;
  if (!res.ok) {
    console.error('Nie udało się pobrać opinii. Status:', res.status);
    alert('Nie udało się pobrać listy opinii.');
    return;
  }
  try {
    testimonialsData = await res.json();
  } catch (error) {
    console.error('Nie udało się odczytać danych opinii', error);
    testimonialsData = [];
  }
  renderTestimonialsAdmin();
}

if (testimonialForm) {
  const createButton = testimonialForm.querySelector('button[type="submit"]');
  testimonialForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (createButton) createButton.disabled = true;
    try {
      const payload = getTestimonialPayload(testimonialForm);
      const res = await fetchOrRedirect('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res) return;
      if (!res.ok) {
        let message = 'Nie udało się dodać opinii.';
        try {
          const data = await res.json();
          if (data && Array.isArray(data.errors)) {
            message = data.errors.join('\n');
          }
        } catch (error) {
          console.error('Nie udało się odczytać odpowiedzi serwera', error);
        }
        alert(message);
        return;
      }
      testimonialForm.reset();
      const publishedCheckbox = testimonialForm.querySelector('[name="published"]');
      if (publishedCheckbox) {
        publishedCheckbox.checked = true;
      }
      await loadTestimonialsAdmin();
    } catch (error) {
      console.error('Nie udało się dodać opinii', error);
      alert('Nie udało się dodać opinii. Spróbuj ponownie.');
    } finally {
      if (createButton) createButton.disabled = false;
    }
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
    await loadGallery();
    await refreshPreviews();
  } catch (err) {
    console.error(err);
    alert('Wystąpił błąd podczas przesyłania plików.');
  } finally {
    submitBtn.disabled = false;
  }
});

loadGallery();
refreshPreviews();
loadTestimonialsAdmin();

// Okresowe odświeżanie miniatur, aby nowe zdjęcia pojawiały się
// bez konieczności przeładowywania strony głównej.
setInterval(refreshPreviews, 10000);

// Utrzymuj ważność sesji, wykonując okresowe pingowanie serwera.
setInterval(() => {
  fetchOrRedirect('/api/session/keep-alive', { silent: true, cache: 'no-store' });
}, 2 * 60 * 1000);
