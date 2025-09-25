(function () {
  if (window.registerGalleryLightbox) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('tabindex', '-1');
  overlay.innerHTML = `
    <button class="lightbox__close" type="button" aria-label="Zamknij podgląd">&times;</button>
    <button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Poprzednie zdjęcie">&#10094;</button>
    <figure class="lightbox__figure">
      <img class="lightbox__image" src="" alt="" />
      <figcaption class="lightbox__caption"></figcaption>
    </figure>
    <button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Następne zdjęcie">&#10095;</button>
  `;
  document.body.appendChild(overlay);

  const imageEl = overlay.querySelector('.lightbox__image');
  const captionEl = overlay.querySelector('.lightbox__caption');
  const closeBtn = overlay.querySelector('.lightbox__close');
  const prevBtn = overlay.querySelector('.lightbox__nav--prev');
  const nextBtn = overlay.querySelector('.lightbox__nav--next');

  const state = {
    open: false,
    items: [],
    index: 0
  };

  function render() {
    if (!state.items.length) {
      return;
    }

    const current = state.items[state.index];
    imageEl.src = current.src;
    imageEl.alt = current.alt || '';
    captionEl.textContent = current.caption || current.alt || '';

    const toggleNav = state.items.length > 1;
    prevBtn.disabled = !toggleNav;
    nextBtn.disabled = !toggleNav;
  }

  function open(items, index) {
    if (!items || !items.length) {
      return;
    }

    state.items = items;
    state.index = index;
    state.open = true;
    overlay.classList.add('lightbox--open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    render();
    requestAnimationFrame(() => overlay.focus());
  }

  function close() {
    state.open = false;
    overlay.classList.remove('lightbox--open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
  }

  function step(delta) {
    if (!state.open || state.items.length < 2) {
      return;
    }
    state.index = (state.index + delta + state.items.length) % state.items.length;
    render();
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      close();
    }
  });

  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));

  document.addEventListener('keydown', (event) => {
    if (!state.open) {
      return;
    }

    if (event.key === 'Escape') {
      close();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    }
  });

  let touchStartX = null;
  overlay.addEventListener('touchstart', (event) => {
    if (!state.open || event.touches.length !== 1) {
      return;
    }
    touchStartX = event.touches[0].clientX;
  }, { passive: true });

  overlay.addEventListener('touchend', (event) => {
    if (!state.open || touchStartX === null) {
      return;
    }

    const diffX = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diffX) > 50) {
      step(diffX < 0 ? 1 : -1);
    }
    touchStartX = null;
  });

  function normaliseItems(figures, rawItems) {
    if (Array.isArray(rawItems) && rawItems.length === figures.length) {
      return rawItems.map((item, index) => {
        const figureImg = figures[index].querySelector('img');
        const source = item.full || item.src || figureImg?.dataset?.full || figureImg?.src || '';
        const alt = item.alt || figureImg?.alt || '';
        const caption = item.caption || figureImg?.alt || '';
        return { src: source, alt, caption };
      });
    }

    return figures.map((figure) => {
      const img = figure.querySelector('img');
      const source = img?.dataset?.full || img?.src || '';
      const alt = img?.alt || '';
      return {
        src: source,
        alt,
        caption: alt
      };
    });
  }

  window.registerGalleryLightbox = function registerGalleryLightbox(grid, rawItems) {
    if (!grid) {
      return;
    }

    const figures = Array.from(grid.querySelectorAll('figure'));
    if (!figures.length) {
      return;
    }

    const items = normaliseItems(figures, rawItems);

    figures.forEach((figure, index) => {
      if (figure.dataset.lightboxBound === 'true') {
        return;
      }

      figure.dataset.lightboxBound = 'true';
      figure.classList.add('lightbox-thumb');
      figure.setAttribute('tabindex', '0');
      figure.setAttribute('role', 'button');
      const thumbAlt = items[index]?.alt || '';
      if (thumbAlt) {
        figure.setAttribute('aria-label', `Otwórz zdjęcie: ${thumbAlt}`);
      }

      figure.addEventListener('click', (event) => {
        event.preventDefault();
        open(items, index);
      });

      figure.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(items, index);
        }
      });
    });
  };
})();
