/* =====================================================
   HANGOUT CAFE – JavaScript (Dynamic Supabase Integration)
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
     2. HERO SLIDER INITIALIZATION
     ==================================================== */
  let currentSlide   = 0;
  let autoSlideTimer = null;
  let touchStartX    = 0;
  let touchEndX      = 0;

  function initHeroSlider() {
    const slides = $$('.slide');
    const dots   = $$('.dot');
    const prevBtn = $('#slider-prev');
    const nextBtn = $('#slider-next');
    const heroEl  = $('.hero');

    if (slides.length === 0) return;

    function goToSlide(index) {
      if (slides[currentSlide]) {
        slides[currentSlide].classList.remove('active');
      }
      if (dots[currentSlide]) {
        dots[currentSlide].classList.remove('active');
      }

      currentSlide = (index + slides.length) % slides.length;

      if (slides[currentSlide]) {
        slides[currentSlide].classList.add('active');
      }
      if (dots[currentSlide]) {
        dots[currentSlide].classList.add('active');
      }
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

    if (nextBtn) {
      nextBtn.onclick = () => { nextSlide(); startAutoSlide(); };
    }
    if (prevBtn) {
      prevBtn.onclick = () => { prevSlide(); startAutoSlide(); };
    }

    dots.forEach((dot, i) => {
      dot.onclick = () => { goToSlide(i); startAutoSlide(); };
    });

    // Pause on hover
    if (heroEl) {
      heroEl.onmouseenter = stopAutoSlide;
      heroEl.onmouseleave = startAutoSlide;

      // Touch/swipe support
      heroEl.ontouchstart = (e) => {
        touchStartX = e.changedTouches[0].screenX;
      };

      heroEl.ontouchend = (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          diff > 0 ? nextSlide() : prevSlide();
          startAutoSlide();
        }
      };
    }

    // Keyboard support
    document.onkeydown = (e) => {
      if (window.scrollY < window.innerHeight * 0.8) {
        if (e.key === 'ArrowRight') { nextSlide(); startAutoSlide(); }
        if (e.key === 'ArrowLeft')  { prevSlide(); startAutoSlide(); }
      }
    };

    goToSlide(0);
    startAutoSlide();
  }


  /* ====================================================
     3. MENU TABS INITIALIZATION
     ==================================================== */
  function initMenuTabs() {
    const tabBtns   = $$('.tab-btn');
    const menuCards = $$('.menu-card');

    tabBtns.forEach(btn => {
      btn.onclick = () => {
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
            card.classList.remove('visible');
            setTimeout(() => card.classList.add('visible'), 50);
          } else {
            card.style.display = 'none';
          }
        });
      };
    });

    // Click active tab on load to run initial filter
    const activeTab = $('.tab-btn.active');
    if (activeTab) activeTab.click();
  }


  /* ====================================================
     4. GALLERY LIGHTBOX INITIALIZATION
     ==================================================== */
  let currentLightboxIndex = 0;
  let galleryImages = [];

  function initGalleryLightbox() {
    const lightbox     = $('#lightbox');
    const lightboxImg  = $('#lightbox-img');
    const lightboxClose = $('#lightbox-close');
    const lightboxPrev = $('#lightbox-prev');
    const lightboxNext = $('#lightbox-next');
    const galleryItems = $$('.gallery-item');

    galleryImages = galleryItems.map(item => ({
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

    if (lightboxImg) {
      lightboxImg.style.transition = 'opacity 0.2s ease';
    }

    galleryItems.forEach((item, i) => {
      item.onclick = () => openLightbox(i);
      item.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
      };
    });

    if (lightboxClose) lightboxClose.onclick = closeLightbox;
    if (lightboxPrev) lightboxPrev.onclick = () => navigateLightbox(-1);
    if (lightboxNext) lightboxNext.onclick = () => navigateLightbox(1);

    // Close on backdrop click
    if (lightbox) {
      lightbox.onclick = (e) => {
        if (e.target === lightbox) closeLightbox();
      };
    }

    // Keyboard nav in lightbox
    document.addEventListener('keydown', (e) => {
      if (!lightbox || !lightbox.classList.contains('open')) return;
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowRight') navigateLightbox(1);
      if (e.key === 'ArrowLeft')  navigateLightbox(-1);
    });
  }


  /* ====================================================
     5. SCROLL REVEAL INITIALIZATION
     ==================================================== */
  function initScrollReveal() {
    const revealEls = $$('.scroll-reveal');
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
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
  }


  /* ====================================================
     6. BACK TO TOP
     ==================================================== */
  const backToTopBtn = $('#back-to-top');

  function updateBackToTop() {
    if (!backToTopBtn) return;
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* ====================================================
     7. CONTACT FORM (Client-side validation)
     ==================================================== */
  const contactForm = $('#contact-form');
  const formSuccess = $('#form-success');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name    = $('#form-name').value.trim();
      const message = $('#form-message').value.trim();

      if (!name || !message) {
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
  }


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
     10. SUPABASE DATABASE ENDPOINT SYNC (DYNAMIC CONTENT)
     ==================================================== */
  const syncDynamicContent = async () => {
    const API_BASE_URL = "https://hangout-cafe-backend.onrender.com";
      ? 'http://localhost:5000'
      : '';

    try {
      // 10.1 Load Banners / Hero
      const resBanners = await fetch(`${API_BASE_URL}/api/banner`);
      if (resBanners.ok) {
        const data = await resBanners.json();
        const banners = data.data;
        if (banners && banners.length > 0) {
          const sliderContainer = $('#slider-container');
          const dotsContainer = $('#slider-dots');

          if (sliderContainer && dotsContainer) {
            sliderContainer.innerHTML = '';
            dotsContainer.innerHTML = '';

            banners.forEach((b, idx) => {
              // Slide
              const slide = document.createElement('div');
              slide.className = `slide ${idx === 0 ? 'active' : ''}`;
              slide.id = `slide-${idx + 1}`;
              slide.innerHTML = `
                <div class="slide-bg" style="background-image: url('${b.image}')"></div>
                <div class="slide-overlay"></div>
                <div class="slide-content">
                  <span class="slide-badge reveal-up">${idx === 0 ? 'Welcome' : idx === 1 ? 'Handcrafted' : 'Good Vibes'}</span>
                  <h1 class="slide-title reveal-up">${b.title || ''}</h1>
                  <p class="slide-subtitle reveal-up">${b.subtitle || ''}</p>
                  <a href="${b.ctaLink || '#menu'}" class="btn btn-primary reveal-up">${b.ctaText || 'View Menu'}</a>
                </div>
              `;
              sliderContainer.appendChild(slide);

              // Dot
              const dot = document.createElement('button');
              dot.className = `dot ${idx === 0 ? 'active' : ''}`;
              dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
              dot.setAttribute('role', 'tab');
              dot.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
              dotsContainer.appendChild(dot);
            });
          }
        }
      }

      // 10.2 Load About Section
      const resAbout = await fetch(`${API_BASE_URL}/api/about`);
      if (resAbout.ok) {
        const data = await resAbout.json();
        const about = data.data;
        if (about) {
          const imgEl = $('#about-image');
          if (imgEl) imgEl.src = about.image;

          const contentEl = $('.about-content');
          if (contentEl) {
            // Delete existing text elements
            $$('.about-text', contentEl).forEach(el => el.remove());
            
            // Build new paragraphs
            const pTags = about.description.split('\n\n').map(desc => `<p class="about-text scroll-reveal">${desc}</p>`).join('');
            const statsEl = $('.about-stats', contentEl);
            if (statsEl) {
              statsEl.insertAdjacentHTML('beforebegin', pTags);
            }
          }
        }
      }

      // 10.3 Load Menu Items
      const resMenu = await fetch(`${API_BASE_URL}/api/menu`);
      if (resMenu.ok) {
        const data = await resMenu.json();
        const menuItems = data.data;
        if (menuItems && menuItems.length > 0) {
          const grid = $('#menu-grid');
          if (grid) {
            grid.innerHTML = '';
            menuItems.forEach(item => {
              if (!item.isAvailable) return; // skip unavailable items
              const card = document.createElement('div');
              card.className = 'menu-card scroll-reveal';
              card.dataset.category = item.category;
              card.innerHTML = `
                <div class="menu-card-img-wrap">
                  <img src="${item.image}" alt="${item.itemName}" class="menu-card-img" />
                  ${item.isFeatured ? '<span class="menu-tag">Bestseller</span>' : ''}
                </div>
                <div class="menu-card-body">
                  <h3 class="menu-item-name">${item.itemName}</h3>
                  <p class="menu-item-desc">${item.description || ''}</p>
                  <div class="menu-card-footer">
                    <span class="menu-price">₹${item.price}</span>
                  </div>
                </div>
              `;
              grid.appendChild(card);
            });
          }
        }
      }

      // 10.4 Load Gallery Images
      const resGallery = await fetch(`${API_BASE_URL}/api/gallery`);
      if (resGallery.ok) {
        const data = await resGallery.json();
        const gallery = data.data;
        if (gallery && gallery.length > 0) {
          const grid = $('.gallery-grid');
          if (grid) {
            grid.innerHTML = '';
            gallery.forEach((item, idx) => {
              const div = document.createElement('div');
              div.className = `gallery-item scroll-reveal ${idx === 0 ? 'large' : ''}`;
              div.id = `gal-${idx + 1}`;
              div.tabIndex = 0;
              div.setAttribute('role', 'button');
              div.setAttribute('aria-label', item.caption || 'Café interior photo');
              div.dataset.src = item.image;
              div.innerHTML = `
                <img src="${item.image}" alt="${item.caption || 'Café interior photo'}" />
                <div class="gallery-overlay"><span class="gallery-zoom">🔍</span></div>
              `;
              grid.appendChild(div);
            });
          }
        }
      }

      // 10.5 Load Offers
      const resOffers = await fetch(`${API_BASE_URL}/api/offers?activeOnly=true`);
      if (resOffers.ok) {
        const data = await resOffers.json();
        const offers = data.data;
        if (offers && offers.length > 0) {
          const grid = $('.offers-grid');
          if (grid) {
            grid.innerHTML = '';
            offers.forEach((o, idx) => {
              const card = document.createElement('div');
              card.className = `offer-card scroll-reveal ${idx === 1 ? 'featured' : ''}`;
              card.id = `offer-${idx + 1}`;
              
              const badgeClass = idx === 1 ? 'weekend' : 'student';
              const badgeLabel = idx === 0 ? '🔥 Hot Deal' : idx === 1 ? '🎉 Weekend Special' : '🎓 Student Love';

              card.innerHTML = `
                <div class="offer-img-wrap">
                  <img src="${o.image}" alt="${o.title}" class="offer-img" />
                </div>
                <div class="offer-body">
                  <div class="offer-badge ${badgeClass}">${badgeLabel}</div>
                  <h3 class="offer-title">${o.title}</h3>
                  <p class="offer-desc">${o.description || ''}</p>
                  ${o.expiryDate ? `<div class="offer-savings">Valid until ${new Date(o.expiryDate).toLocaleDateString()}</div>` : ''}
                </div>
              `;
              grid.appendChild(card);
            });
          }
        }
      }

      // 10.6 Load Contact Details
      const resContact = await fetch(`${API_BASE_URL}/api/contact`);
      if (resContact.ok) {
        const data = await resContact.json();
        const contact = data.data;
        if (contact) {
          // Addresses info cards
          const addrCard = $('#contact-address p');
          if (addrCard) addrCard.innerHTML = contact.address.replace(', ', ',<br/>');
          
          const phoneCard = $('#contact-phone p');
          if (phoneCard) phoneCard.innerHTML = contact.phone.replace(', ', ',<br/>');
          
          const hoursCard = $('#contact-hours p');
          if (hoursCard) hoursCard.innerHTML = contact.openingHours.replace(', ', ',<br/>');

          // Embedded Google Map Iframe
          const mapWrap = $('#map-placeholder');
          if (mapWrap && contact.googleMapsLink) {
            mapWrap.innerHTML = `
              <iframe src="${contact.googleMapsLink}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            `;
            mapWrap.style.padding = '0';
          }

          // Footer contact list
          const footerContact = $('.footer-contact-list');
          if (footerContact) {
            footerContact.innerHTML = `
              <li>📍 ${contact.address}</li>
              <li>📞 ${contact.phone}</li>
              <li>🕐 ${contact.openingHours}</li>
            `;
          }

          // Social links
          const insta = $('#social-instagram');
          if (insta && contact.instagram) insta.href = contact.instagram;
          
          const fb = $('#social-facebook');
          if (fb && contact.facebook) fb.href = contact.facebook;
          
          const wa = $('#social-whatsapp');
          if (wa && contact.whatsapp) wa.href = contact.whatsapp.includes('wa.me') ? contact.whatsapp : `https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`;
        }
      }

    } catch (err) {
      console.warn('Backend API connection offline. Falling back to default static fallback content.', err);
    } finally {
      // Re-initialize all JS widgets now that the dynamic content is loaded into the DOM
      initHeroSlider();
      initMenuTabs();
      initGalleryLightbox();
      initScrollReveal();
      updateActiveLink();
      updateBackToTop();
    }
  };

  // Launch sync sequence on page load
  syncDynamicContent();

})();
