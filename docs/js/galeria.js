// Generowanie pełnej galerii pogrupowanej według kategorii
async function loadGallery() {
  const container = document.getElementById('gallery-all');
  if (!container) return;
  try {
    const res = await fetch('/api/gallery?mode=full');
    const images = await res.json();

    const groups = images.reduce((acc, img) => {
      const cat = img.category || 'inne';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(img);
      return acc;
    }, {});

    const categoryLabels = {
      kuchnia: 'Meble kuchenne',
      salon: 'Meble salonowe',
      sypialnia: 'Meble sypialniane',
      lazienka: 'Meble łazienkowe',
      inne: 'Meble na zamówienie'
    };

    const categoryOrder = ['kuchnia', 'salon', 'sypialnia', 'lazienka', 'inne'];
    const sortedCategories = [
      ...categoryOrder.filter(cat => groups[cat]),
      ...Object.keys(groups).filter(cat => !categoryOrder.includes(cat))
    ];

    container.innerHTML = '';

    sortedCategories.forEach(category => {
      const imgs = groups[category];
      if (!imgs || !imgs.length) return;

      const section = document.createElement('section');
      section.className = 'gallery-category';

      const title = document.createElement('h3');
      title.className = 'gallery-category__title';
      title.textContent = categoryLabels[category] || category
        .split(/[-_\s]+/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'gallery-category__grid';

      imgs.forEach(img => {
        const fig = document.createElement('figure');
        fig.className = 'gallery-category__item';
        const image = document.createElement('img');
        image.src = '/images/' + img.filename;
        image.alt = img.alt || '';
        fig.appendChild(image);
        grid.appendChild(fig);
      });

      section.appendChild(grid);
      container.appendChild(section);

      const lightboxItems = imgs.map(img => {
        const alt = img.alt || '';
        return {
          src: '/images/' + img.filename,
          alt,
          caption: alt
        };
      });
      registerGalleryLightbox(grid, lightboxItems);
    });
  } catch (err) {
    console.error('Błąd pobierania galerii', err);
  }
}

loadGallery();

document.getElementById('year').textContent = new Date().getFullYear();
