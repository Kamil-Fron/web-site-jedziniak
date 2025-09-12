// Generowanie pełnej galerii pogrupowanej według kategorii
async function loadGallery() {
  const container = document.getElementById('gallery-all');
  try {
    const res = await fetch('/api/gallery?mode=full');
    const images = await res.json();

    const groups = images.reduce((acc, img) => {
      const cat = img.category || 'inne';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(img);
      return acc;
    }, {});

    Object.entries(groups).forEach(([category, imgs]) => {
      const header = document.createElement('h3');
      header.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      container.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'grid';

      imgs.forEach(img => {
        const fig = document.createElement('figure');
        fig.className = 'item';
        const image = document.createElement('img');
        image.src = '/images/' + img.filename;
        image.alt = img.alt || '';
        fig.appendChild(image);
        grid.appendChild(fig);
      });

      container.appendChild(grid);
    });
  } catch (err) {
    console.error('Błąd pobierania galerii', err);
  }
}

loadGallery();

document.getElementById('year').textContent = new Date().getFullYear();
