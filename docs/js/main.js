// Pobranie listy zdjęć z backendu i wstawienie do galerii
fetch('/api/gallery')
  .then(res => res.json())
  .then(images => {
    const gallery = document.getElementById('gallery');
    images.forEach(img => {
      const el = document.createElement('img');
      el.src = `images/${img.filename}`;
      el.alt = img.alt || 'Zdjęcie mebla';
      gallery.appendChild(el);
    });
  })
  .catch(err => console.error('Błąd pobierania galerii', err));
