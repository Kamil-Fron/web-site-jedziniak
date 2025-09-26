const navController = window.vikimebleNav || {};
const navElement = navController.navElement || document.querySelector('.nav');
const navLinks = Array.from(document.querySelectorAll('#primary-navigation a[href^="#"]'));
const navToggle = document.querySelector('.menu-toggle');

function closeNavMenu() {
  if (typeof navController.close === 'function') {
    navController.close();
    return;
  }
  if (navElement && navElement.classList.contains('open')) {
    navElement.classList.remove('open');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
    }
  }
}

function enhanceAnchorNavigation() {
  const sections = navLinks
    .map(link => {
      const id = link.hash.replace('#', '');
      const section = document.getElementById(id);
      return section ? { link, section, id } : null;
    })
    .filter(Boolean);

  if (sections.length > 0) {
    const initialId = sections[0].id;
    navLinks.forEach(link => {
      if (link.hash === `#${initialId}`) {
        link.classList.add('is-active');
      }
    });
  }

  navLinks.forEach(link => {
    const hash = link.hash;
    if (!hash) return;
    const target = document.querySelector(hash);
    if (!target) return;
    link.addEventListener('click', event => {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeNavMenu();
    });
  });

  if (!('IntersectionObserver' in window) || sections.length === 0) {
    return;
  }

  const setActiveLink = id => {
    navLinks.forEach(link => {
      if (link.hash === `#${id}`) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
  };

  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible.length) {
      setActiveLink(visible[0].target.id);
    }
  }, { threshold: 0.55 });

  sections.forEach(({ section }) => observer.observe(section));
}

enhanceAnchorNavigation();

if (typeof navController.update === 'function') {
  navController.update();
}

function renderPreview(sectionId, images, link) {
  const container = document.getElementById(sectionId);
  if (!container) return;
  container.innerHTML = '';
  const limited = Array.isArray(images) ? images.slice(0, 3) : [];

  if (typeof link === 'string') {
    const wrapperLink = container.closest('a');
    if (wrapperLink) {
      wrapperLink.href = link;
    }
  }

  limited.forEach(image => {
    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.alt || 'Realizacja Vikimeble';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 480;
    img.height = 360;
    container.appendChild(img);
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
      const res = await fetch(`/api/gallery?category=${encodeURIComponent(category)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const images = await res.json();
      renderPreview(sectionId, images, link);
    } catch (error) {
      console.error('Błąd pobierania galerii', error);
    }
  }
}

loadPreviews();

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    alert('Dziękujemy za wiadomość!');
    contactForm.reset();
  });
}

const testimonialsState = {
  items: [],
  currentIndex: 0,
  perView: 1,
  cardWidth: 0,
  gap: 0
};

const testimonialsTrack = document.querySelector('.testimonials-track');
const testimonialsViewport = document.querySelector('.testimonials-viewport');
const prevButton = document.querySelector('.testimonials-control--prev');
const nextButton = document.querySelector('.testimonials-control--next');
const testimonialsEmpty = document.querySelector('.testimonials-empty');
let resizeTimer = null;

function determinePerView() {
  const width = window.innerWidth;
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

function syncPerView() {
  const next = determinePerView();
  if (next !== testimonialsState.perView) {
    testimonialsState.perView = next;
    const maxIndex = Math.max(0, testimonialsState.items.length - next);
    testimonialsState.currentIndex = Math.min(testimonialsState.currentIndex, maxIndex);
  }
}

function syncTrackDimensions() {
  if (!testimonialsTrack || !testimonialsViewport) return;
  const styles = getComputedStyle(testimonialsTrack);
  const gapValue = parseFloat(styles.columnGap || styles.gap || '0');
  const targetColumns = Math.max(1, testimonialsState.perView);
  const visibleColumns = testimonialsState.items.length
    ? Math.min(targetColumns, testimonialsState.items.length)
    : targetColumns;
  const viewportWidth = testimonialsViewport.clientWidth;
  const baseColumns = Math.max(1, visibleColumns);
  const cardWidth = Math.max(0, (viewportWidth - gapValue * (baseColumns - 1)) / baseColumns);
  testimonialsState.cardWidth = cardWidth;
  testimonialsState.gap = gapValue;
  testimonialsTrack.querySelectorAll('.testimonial-card').forEach(card => {
    card.style.width = `${cardWidth}px`;
    card.style.maxWidth = `${cardWidth}px`;
    card.style.minWidth = `${cardWidth}px`;
  });
}

function updateCarouselControls() {
  const maxIndex = Math.max(0, testimonialsState.items.length - testimonialsState.perView);
  if (prevButton) {
    prevButton.disabled = testimonialsState.currentIndex <= 0;
  }
  if (nextButton) {
    nextButton.disabled = testimonialsState.currentIndex >= maxIndex;
  }
}

function updateCarouselPosition() {
  if (!testimonialsTrack) return;
  const offset = testimonialsState.currentIndex * (testimonialsState.cardWidth + testimonialsState.gap);
  testimonialsTrack.style.transform = `translateX(-${offset}px)`;
  updateCarouselControls();
}

function createTestimonialCard(testimonial) {
  const card = document.createElement('article');
  card.className = 'testimonial-card';

  if (testimonial.rating) {
    const ratingWrapper = document.createElement('div');
    ratingWrapper.className = 'testimonial-rating';
    const stars = document.createElement('span');
    const starCount = Math.max(1, Math.min(5, Math.round(Number(testimonial.rating)) || 0));
    stars.textContent = '★'.repeat(starCount);
    stars.setAttribute('aria-hidden', 'true');
    const sr = document.createElement('span');
    sr.className = 'visually-hidden';
    sr.textContent = `Ocena: ${starCount} na 5`;
    ratingWrapper.append(stars, sr);
    card.appendChild(ratingWrapper);
  }

  const quote = document.createElement('p');
  quote.className = 'testimonial-quote';
  const content = (testimonial.quote || '').trim();
  quote.textContent = content ? `„${content}”` : '';
  card.appendChild(quote);

  const author = document.createElement('p');
  author.className = 'testimonial-author';
  author.textContent = testimonial.author || 'Klient Vikimeble';
  card.appendChild(author);

  return card;
}

function renderTestimonials(items) {
  if (!testimonialsTrack) return;
  testimonialsTrack.innerHTML = '';

  const validItems = Array.isArray(items) ? items : [];
  testimonialsState.items = validItems;
  testimonialsState.currentIndex = 0;

  if (validItems.length === 0) {
    if (testimonialsEmpty) testimonialsEmpty.hidden = false;
    updateCarouselControls();
    return;
  }

  if (testimonialsEmpty) testimonialsEmpty.hidden = true;

  const fragment = document.createDocumentFragment();
  validItems.forEach(item => fragment.appendChild(createTestimonialCard(item)));
  testimonialsTrack.appendChild(fragment);

  syncPerView();
  syncTrackDimensions();
  updateCarouselPosition();
}

function handleResize() {
  syncPerView();
  syncTrackDimensions();
  updateCarouselPosition();
}

if (prevButton) {
  prevButton.addEventListener('click', () => {
    testimonialsState.currentIndex = Math.max(0, testimonialsState.currentIndex - testimonialsState.perView);
    updateCarouselPosition();
  });
}

if (nextButton) {
  nextButton.addEventListener('click', () => {
    const maxIndex = Math.max(0, testimonialsState.items.length - testimonialsState.perView);
    testimonialsState.currentIndex = Math.min(maxIndex, testimonialsState.currentIndex + testimonialsState.perView);
    updateCarouselPosition();
  });
}

window.addEventListener('resize', () => {
  if (resizeTimer) window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(handleResize, 150);
});

function injectReviewSchema(testimonials) {
  const existing = document.getElementById('reviews-schema');
  if (existing) existing.remove();
  if (!Array.isArray(testimonials) || testimonials.length === 0) return;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemReviewed: {
      '@type': 'Organization',
      name: 'Vikimeble'
    },
    itemListElement: testimonials.map((testimonial, index) => {
      const review = {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: testimonial.author || 'Klient Vikimeble'
        },
        reviewBody: testimonial.quote || ''
      };
      if (testimonial.rating) {
        review.reviewRating = {
          '@type': 'Rating',
          ratingValue: Number(testimonial.rating),
          bestRating: 5,
          worstRating: 1
        };
      }
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: review
      };
    })
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'reviews-schema';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

async function loadTestimonials() {
  if (!testimonialsTrack) return;
  try {
    const res = await fetch('/api/testimonials', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const testimonials = await res.json();
    renderTestimonials(testimonials);
    injectReviewSchema(testimonials);
  } catch (error) {
    console.error('Nie udało się pobrać opinii', error);
    renderTestimonials([]);
  }
}

loadTestimonials();

const yearPlaceholder = document.getElementById('year');
if (yearPlaceholder) {
  yearPlaceholder.textContent = new Date().getFullYear();
}
