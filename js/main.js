// NEED SOLAR — main.js

// Restore saved theme before first paint
(function(){
  const t = localStorage.getItem('ns-theme');
  if (t) document.documentElement.setAttribute('data-theme', t);
})();

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 50);
  document.querySelector('.btt')?.classList.toggle('show', window.scrollY > 400);
}, { passive: true });

// Mobile nav toggle
document.querySelector('.nav-toggle')?.addEventListener('click', (e) => {
  e.currentTarget.classList.toggle('active');
  document.querySelector('.nav-links')?.classList.toggle('open');
});

// Toggle dropdown on mobile click
document.querySelectorAll('.nav-has-dropdown').forEach(el => {
  el.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (e.target.classList.contains('nav-dropdown-label') || e.target.closest('.nav-dropdown-label')) {
        e.preventDefault();
        el.classList.toggle('open');
      }
    }
  });
});

// Back to top
document.querySelector('.btt')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Active nav link
const page = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  if (a.getAttribute('href') === page) {
    a.classList.add('active');
    // Highlight parent dropdown label if inside dropdown
    const dropdown = a.closest('.nav-has-dropdown');
    if (dropdown) {
      dropdown.querySelector('.nav-dropdown-label')?.classList.add('active');
    }
  }
});

// Project gallery data will be loaded from a secure server-side endpoint.
// No Facebook access token or local project feed is shipped to the browser.

// Counter animation
function countUp(el, target, dur = 1400) {
  const suffix = el.dataset.suffix || '';
  const start = performance.now();
  const fmt = n => n >= 1000000
    ? (n / 1000000 % 1 === 0 ? (n / 1000000) : (n / 1000000).toFixed(1)) + 'M'
    : n >= 1000 ? n.toLocaleString() : n;
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(Math.floor(ease * target)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const el = e.target;
      countUp(el, +el.dataset.count);
      el.dataset.counted = '1';
      io.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => io.observe(el));

// Solar Calculator
const calcForm = document.getElementById('calcForm');
if (calcForm) {
  const UNIT_PRICE   = 4.20;
  const SUN_HOURS    = 4.5;
  const EFFICIENCY   = 0.80;
  const COST_PER_KW  = 45000;

  calcForm.addEventListener('submit', e => {
    e.preventDefault();

    const bill = parseFloat(document.getElementById('electricBill')?.value) || 0;
    const area  = parseFloat(document.getElementById('roofArea')?.value)  || 0;

    const monthly_units = bill / UNIT_PRICE;
    const kw_by_bill    = (monthly_units / 30 / SUN_HOURS / EFFICIENCY);
    const kw_by_area    = area > 0 ? area / 8 : Infinity;
    const kw            = Math.min(kw_by_bill, kw_by_area).toFixed(1);

    const production  = (kw * SUN_HOURS * 30 * EFFICIENCY).toFixed(0);
    const savings     = (production * UNIT_PRICE).toFixed(0);
    const cost        = kw * COST_PER_KW;
    const payback     = savings > 0 ? (cost / (savings * 12)).toFixed(1) : '—';
    const co2         = (production * 0.4713 / 1000).toFixed(2);

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('resKW',       (+kw).toLocaleString(undefined, { minimumFractionDigits: 1 }));
    set('resProduction', (+production).toLocaleString());
    set('resSavings',    (+savings).toLocaleString());
    set('resPayback',   payback);
    set('resCO2',       co2);

    const resCard = document.getElementById('calcResults');
    if (resCard) {
      resCard.style.borderTopColor = 'var(--orange)';
      resCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

// Theme toggle button
(function() {
  const SUN  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'สลับโหมดสี');

  const getTheme = () => document.documentElement.getAttribute('data-theme') || 'dark';
  const sync = () => { btn.innerHTML = getTheme() === 'light' ? MOON : SUN; };
  sync();

  btn.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ns-theme', next);
    sync();
  });

  const navInner = document.querySelector('.nav-inner');
  const toggle   = document.querySelector('.nav-toggle');
  if (navInner) navInner.insertBefore(btn, toggle || null);
})();

// About section image slideshow
(function(){
  const slides = document.querySelectorAll('.about-slide');
  if (slides.length < 2) return;
  let cur = 0;
  setInterval(function(){
    slides[cur].classList.remove('active');
    cur = (cur + 1) % slides.length;
    slides[cur].classList.add('active');
  }, 4000);
})();
