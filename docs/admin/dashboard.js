const list = document.getElementById('gallery-list');
const form = document.getElementById('upload-form');

// Dynamiczny filtr kategorii
const filter = document.createElement('select');
const allOption = document.createElement('option');
allOption.value = '';
allOption.textContent = 'Wszystkie kategorie';
filter.appendChild(allOption);
list.parentNode.insertBefore(filter, list);

let galleryData = [];

filter.addEventListener('change', renderGallery);

function loadGallery() {
  fetch('/api/gallery')
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
      image.src = `../images/${img.filename}`;
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
  const data = new FormData(form);
  data.append('category', form.category.value);
  fetch('/api/upload', { method: 'POST', body: data })
    .then(() => {
      form.reset();
      loadGallery();
    });
});

loadGallery();
