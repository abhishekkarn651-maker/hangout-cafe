/* =====================================================
   HANGOUT CAFE – JavaScript
   Slider, Menu Tabs, Gallery Lightbox,
   Scroll Reveal, Nav, Contact Form
   ===================================================== */

(function () {
  'use strict';

  /* ── DOM HELPERS ── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ====================================================
     1. NAVIGATION – sticky + active link + hamburger
     ==================================================== */
  const navbar     = $('#navbar');
  const hamburger  = $('#hamburger');
  const navLinks   = $('#nav-links');
  const navAnchors = $$('.nav-link');
  const sections   = $$('section[id]');

  // Sticky nav
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    updateActiveLink();
    updateBackToTop();
  });

  // Active link on scroll
  function updateActiveLink() {
    const scrollPos = window.scrollY + 100;
    sections.forEach(sec => {
      const top    = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      const id     = sec.getAttribute('id');
      if (scrollPos >= top && scrollPos < bottom) {
        navAnchors.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
      }
    });
  }

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close nav on link click
  navAnchors.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close nav on outside click
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !hamburger.contains(e.target)) {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  /* ====================================================
     2. HERO SLIDER
     ==================================================== */
  const slides       = $$('.slide');
  const dots         = $$('.dot');
  const prevBtn      = $('#slider-prev');
  const nextBtn      = $('#slider-next');
  const heroEl       = $('.hero');

  let currentSlide   = 0;
  let autoSlideTimer = null;
  let touchStartX    = 0;
  let touchEndX      = 0;

  function goToSlide(index) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');

    currentSlide = (index + slides.length) % slides.length;

    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }

  function nextSlide() { goToSlide(currentSlide + 1); }
  function prevSlide() { goToSlide(currentSlide - 1); }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlideTimer = setInterval(nextSlide, 5000);
  }

  function stopAutoSlide() {
    if (autoSlideTimer) {
      clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  }

  nextBtn.addEventListener('click', () => { nextSlide(); startAutoSlide(); });
  prevBtn.addEventListener('click', () => { prevSlide(); startAutoSlide(); });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goToSlide(i); startAutoSlide(); });
  });

  // Pause on hover
  heroEl.addEventListener('mouseenter', stopAutoSlide);
  heroEl.addEventListener('mouseleave', startAutoSlide);

  // Touch/swipe support
  heroEl.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  heroEl.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextSlide() : prevSlide();
      startAutoSlide();
    }
  });

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (window.scrollY < window.innerHeight * 0.8) {
      if (e.key === 'ArrowRight') { nextSlide(); startAutoSlide(); }
      if (e.key === 'ArrowLeft')  { prevSlide(); startAutoSlide(); }
    }
  });

  startAutoSlide();

  /* ====================================================
     3. MENU TABS
     ==================================================== */
  const tabBtns   = $$('.tab-btn');
  const menuCards = $$('.menu-card');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;

      // Update active tab
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Filter cards
      menuCards.forEach(card => {
        if (card.dataset.category === category) {
          card.style.display = '';
          // Re-trigger scroll-reveal animation
          card.classList.remove('visible');
          setTimeout(() => card.classList.add('visible'), 50);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* ====================================================
     4. GALLERY LIGHTBOX
     ==================================================== */
  const lightbox     = $('#lightbox');
  const lightboxImg  = $('#lightbox-img');
  const lightboxClose = $('#lightbox-close');
  const lightboxPrev = $('#lightbox-prev');
  const lightboxNext = $('#lightbox-next');
  const galleryItems = $$('.gallery-item');

  let currentLightboxIndex = 0;
  const galleryImages = galleryItems.map(item => ({
    src: item.dataset.src,
    alt: item.querySelector('img').alt
  }));

  function openLightbox(index) {
    currentLightboxIndex = index;
    lightboxImg.src = galleryImages[index].src;
    lightboxImg.alt = galleryImages[index].alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  }

  function navigateLightbox(dir) {
    currentLightboxIndex = (currentLightboxIndex + dir + galleryImages.length) % galleryImages.length;
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = galleryImages[currentLightboxIndex].src;
      lightboxImg.alt = galleryImages[currentLightboxIndex].alt;
      lightboxImg.style.opacity = '1';
    }, 150);
  }

  lightboxImg.style.transition = 'opacity 0.2s ease';

  galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
  lightboxNext.addEventListener('click', () => navigateLightbox(1));

  // Close on backdrop click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard nav in lightbox
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowRight') navigateLightbox(1);
    if (e.key === 'ArrowLeft')  navigateLightbox(-1);
  });

  /* ====================================================
     5. SCROLL REVEAL
     ==================================================== */
  const revealEls = $$('.scroll-reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger children within same parent
          const siblings = $$('.scroll-reveal', entry.target.parentElement);
          const idx = siblings.indexOf(entry.target);
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, idx * 80);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach(el => revealObserver.observe(el));

  /* ====================================================
     6. BACK TO TOP
     ==================================================== */
  const backToTopBtn = $('#back-to-top');

  function updateBackToTop() {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ====================================================
     7. CONTACT FORM
     ==================================================== */
  const contactForm = $('#contact-form');
  const formSuccess = $('#form-success');

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name    = $('#form-name').value.trim();
    const message = $('#form-message').value.trim();

    if (!name || !message) {
      // Simple shake animation on required fields
      [name ? null : $('#form-name'), message ? null : $('#form-message')].forEach(el => {
        if (!el) return;
        el.style.borderColor = '#e05522';
        el.style.animation = 'none';
        requestAnimationFrame(() => {
          el.style.animation = 'shake 0.4s ease';
        });
        setTimeout(() => { el.style.borderColor = ''; el.style.animation = ''; }, 1000);
      });
      return;
    }

    const btn = $('#form-submit-btn');
    btn.textContent = 'Sending…';
    btn.disabled = true;

    // Simulate form submission
    setTimeout(() => {
      contactForm.reset();
      formSuccess.classList.add('show');
      btn.textContent = 'Send Message ✉️';
      btn.disabled = false;
      setTimeout(() => formSuccess.classList.remove('show'), 6000);
    }, 1200);
  });

  /* ====================================================
     8. SMOOTH SCROLL (for older browsers)
     ==================================================== */
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;
      e.preventDefault();
      const navHeight = navbar.offsetHeight;
      const top = targetEl.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ====================================================
     9. INJECT SHAKE KEYFRAME INTO HEAD
     ==================================================== */
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-5px); }
      80% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(shakeStyle);

  /* ====================================================
     10. INITIAL ACTIVE LINK CHECK
     ==================================================== */
  updateActiveLink();
  updateBackToTop();

})();

