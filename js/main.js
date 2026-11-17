'use strict';

document.documentElement.classList.add('js');

const nav = document.getElementById('nav');
const toTop = document.getElementById('toTop');
const menuButton = document.querySelector('.menu-btn');
const ctaButton = nav.querySelector('.cta');
const navigation = document.getElementById('primary-navigation');
const navigationLinks = [...navigation.querySelectorAll('[data-link]')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileViewport = window.matchMedia('(max-width: 960px)');

function setMenu(open, returnFocus = false) {
  nav.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  if (returnFocus) menuButton.focus();
}

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});
if (ctaButton) {
  ctaButton.addEventListener('click', () => setMenu(false));
}
navigationLinks.forEach(link => link.addEventListener('click', () => {
  setMenu(false);
  if (mobileViewport.matches) {
    const target = document.querySelector(link.getAttribute('href'));
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('menu-open')) setMenu(false, true);
});
document.addEventListener('click', event => {
  if (!nav.contains(event.target)) setMenu(false);
});
nav.addEventListener('focusout', event => {
  if (event.relatedTarget && !nav.contains(event.relatedTarget)) setMenu(false);
});
mobileViewport.addEventListener('change', () => setMenu(false));

let scrollQueued = false;
function updateScroll() {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 24);
  toTop.classList.toggle('show', y > 600);
  toTop.tabIndex = y > 600 ? 0 : -1;
  let current = null;
  for (const link of navigationLinks) {
    const section = document.querySelector(link.getAttribute('href'));
    const rect = section.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.4 && rect.bottom > window.innerHeight * 0.4) {
      current = section.id;
    }
  }
  navigationLinks.forEach(link => {
    const active = link.getAttribute('href') === '#' + current;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) {
    scrollQueued = true;
    requestAnimationFrame(updateScroll);
  }
}, { passive: true });
window.addEventListener('resize', updateScroll);
updateScroll();
toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  document.querySelector('.logo').focus({ preventScroll: true });
});

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealElements.forEach(element => observer.observe(element));
} else {
  revealElements.forEach(element => element.classList.add('in'));
}

const filterButtons = [...document.querySelectorAll('.filters button')];
const projects = [...document.querySelectorAll('#projects .project')];
const filterStatus = document.getElementById('filter-status');
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    let count = 0;
    projects.forEach(project => {
      const visible = filter === 'all' || project.dataset.cat.split(/\s+/).includes(filter);
      project.hidden = !visible;
      if (visible) {
        project.classList.add('in');
        count += 1;
      }
    });
    filterStatus.textContent = filter === 'all'
      ? `Showing all ${count} case studies`
      : `Showing ${count} case ${count === 1 ? 'study' : 'studies'} — ${button.textContent.trim()}`;
  });
});

// Preserve a readable fallback if a locally served image becomes unavailable.
// This also catches failures that occurred before the deferred script ran.
document.querySelectorAll('img[data-asset]').forEach(image => {
  const frame = image.closest('[data-asset-frame]');
  const showFallback = () => {
    image.hidden = true;
    frame.classList.add('is-failed');
  };
  image.addEventListener('error', showFallback);
  image.addEventListener('load', () => {
    image.hidden = false;
    frame.classList.remove('is-failed');
  });
  if (image.complete && image.naturalWidth === 0) showFallback();
});

// Native viewer shared by original project images and owner-provided documents.
// Anchors retain their destinations without JavaScript or native dialog support.
const lightbox = document.getElementById('image-lightbox');
if (lightbox && typeof lightbox.showModal === 'function') {
  const media = lightbox.querySelector('[data-lightbox-media]');
  const caption = document.getElementById('lightbox-caption');
  const original = lightbox.querySelector('[data-lightbox-original]');
  const status = lightbox.querySelector('[data-lightbox-status]');
  const closeButton = lightbox.querySelector('[data-lightbox-close]');
  const zoomIn = lightbox.querySelector('[data-zoom-in]');
  const zoomOut = lightbox.querySelector('[data-zoom-out]');
  const zoomReset = lightbox.querySelector('[data-zoom-reset]');
  const zoomLevel = lightbox.querySelector('[data-zoom-level]');
  let trigger = null;
  let activeImage = null;
  let baseWidth = 0;
  let zoom = 1;

  function updateZoom() {
    if (activeImage && baseWidth) activeImage.style.width = `${Math.round(baseWidth * zoom)}px`;
    zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    zoomOut.disabled = zoom <= 1;
    zoomIn.disabled = zoom >= 4;
  }
  function fitImage() {
    if (!activeImage || !activeImage.naturalWidth) return;
    const ratio = activeImage.naturalWidth / activeImage.naturalHeight;
    const availableWidth = Math.max(1, media.clientWidth - 16);
    const availableHeight = Math.max(1, media.clientHeight - 16);
    baseWidth = Math.min(activeImage.naturalWidth, availableWidth, availableHeight * ratio);
    zoom = 1;
    media.scrollTop = 0;
    media.scrollLeft = 0;
    updateZoom();
  }
  function changeZoom(delta) {
    zoom = Math.min(4, Math.max(1, zoom + delta));
    updateZoom();
  }
  zoomIn.addEventListener('click', () => changeZoom(0.5));
  zoomOut.addEventListener('click', () => changeZoom(-0.5));
  zoomReset.addEventListener('click', fitImage);
  lightbox.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === '+' || event.key === '=') { event.preventDefault(); changeZoom(0.5); }
    if (event.key === '-') { event.preventDefault(); changeZoom(-0.5); }
    if (event.key === '0') { event.preventDefault(); fitImage(); }
  });
  window.addEventListener('resize', () => { if (lightbox.open) fitImage(); });

  document.querySelectorAll('a[data-lightbox]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      const thumbnail = link.querySelector('img');
      const image = document.createElement('img');
      image.alt = link.dataset.imageAlt || (thumbnail ? thumbnail.alt : link.textContent.trim());
      image.decoding = 'async';
      status.hidden = true;
      activeImage = image;
      baseWidth = 0;
      zoom = 1;
      updateZoom();
      image.addEventListener('load', fitImage);
      image.addEventListener('error', () => {
        image.hidden = true;
        status.hidden = false;
      });
      const figure = link.closest('figure');
      const sourceCaption = figure ? figure.querySelector('figcaption') : null;
      caption.textContent = link.dataset.imageTitle || (sourceCaption ? sourceCaption.textContent : image.alt);
      original.setAttribute('href', link.getAttribute('href'));
      lightbox.classList.toggle('document-viewer', 'document' in link.dataset);
      media.replaceChildren(image);
      image.src = link.getAttribute('href');
      lightbox.showModal();
      document.documentElement.classList.add('lightbox-open');
      if (image.complete && image.naturalWidth) fitImage();
      closeButton.focus();
    });
  });
  closeButton.addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('close', () => {
    document.documentElement.classList.remove('lightbox-open');
    media.replaceChildren();
    activeImage = null;
    baseWidth = 0;
    if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
  });
}
