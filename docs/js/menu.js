if (typeof document !== 'undefined') {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.menu-toggle');
  const dropdownTriggers = Array.from(document.querySelectorAll('.dropdown > a'));
  let lastWindowWidth = window.innerWidth;

  const closeDropdowns = () => {
    dropdownTriggers.forEach(trigger => {
      const parent = trigger.parentElement;
      if (parent) {
        parent.classList.remove('open');
      }
      trigger.setAttribute('aria-expanded', 'false');
    });
  };

  const closeNav = () => {
    if (!nav) return;
    if (nav.classList.contains('open')) {
      nav.classList.remove('open');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
      }
      closeDropdowns();
    }
  };

  const openNav = () => {
    if (!nav) return;
    nav.classList.add('open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
    }
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      if (nav.classList.contains('open')) {
        closeNav();
      } else {
        openNav();
      }
    });
  }

  dropdownTriggers.forEach(trigger => {
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', event => {
      if (window.innerWidth <= 768) {
        event.preventDefault();
        const parent = trigger.parentElement;
        if (!parent) return;
        const isOpen = parent.classList.toggle('open');
        trigger.setAttribute('aria-expanded', String(isOpen));
      }
    });

    trigger.addEventListener('mouseenter', () => {
      if (window.innerWidth > 768) {
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    trigger.addEventListener('mouseleave', () => {
      if (window.innerWidth > 768) {
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    trigger.addEventListener('focus', () => {
      if (window.innerWidth > 768) {
        trigger.setAttribute('aria-expanded', 'true');
      }
    });

    trigger.addEventListener('blur', () => {
      if (window.innerWidth > 768) {
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  if (nav) {
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          closeNav();
        }
      });
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeNav();
    }
  });

  function updateNavAppearance() {
    if (!nav || nav.classList.contains('nav--static')) return;
    const hero = document.querySelector('.hero');
    const threshold = hero ? Math.max(hero.offsetHeight * 0.45, 120) : 120;
    if (window.scrollY > threshold) {
      nav.classList.add('nav--solid');
    } else {
      nav.classList.remove('nav--solid');
    }
  }

  updateNavAppearance();
  window.addEventListener('scroll', updateNavAppearance, { passive: true });
  window.addEventListener('resize', () => {
    if (window.innerWidth !== lastWindowWidth) {
      if (window.innerWidth > 768) {
        closeNav();
      }
      lastWindowWidth = window.innerWidth;
    }
    updateNavAppearance();
  });

  window.vikimebleNav = {
    close: closeNav,
    navElement: nav,
    update: updateNavAppearance
  };
}
