const list = document.getElementById('gallery-list');
const form = document.getElementById('upload-form');

function loadGallery() {
  fetch('/api/gallery')
    .then(res => res.json())
    .then(images => {
      list.innerHTML = '';
      images.forEach(img => {
        const container = document.createElement('div');
        const image = document.createElement('img');
        image.src = `../images/${img.filename}`;
        image.width = 150;
        const btn = document.createElement('button');
        btn.textContent = 'Usuń';
        btn.onclick = () => {
          fetch(`/api/gallery/${img.id}`, { method: 'DELETE' })
            .then(loadGallery);
        };
        container.appendChild(image);
        container.appendChild(btn);
        list.appendChild(container);
      });
    });
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(form);
  fetch('/api/upload', { method: 'POST', body: data })
    .then(() => {
      form.reset();
      loadGallery();
    });
});

loadGallery();
