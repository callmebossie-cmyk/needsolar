// NEED SOLAR — main.js

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 50);
  document.querySelector('.btt')?.classList.toggle('show', window.scrollY > 400);
});

// Mobile nav toggle
document.querySelector('.nav-toggle')?.addEventListener('click', () => {
  document.querySelector('.nav-links')?.classList.toggle('open');
});

// Back to top
document.querySelector('.btt')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Active nav link
const page = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  if (a.getAttribute('href') === page) a.classList.add('active');
});

// Project filter
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    document.querySelectorAll('.proj-card').forEach(card => {
      card.style.display = (f === 'all' || card.dataset.type === f) ? '' : 'none';
    });
  });
});

// Counter animation
function countUp(el, target, dur = 1400) {
  const suffix = el.dataset.suffix || '';
  const start = performance.now();
  const fmt = n => n >= 1000000
    ? (n / 1000000).toFixed(1) + 'M'
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
    const payback     = (cost / (savings * 12)).toFixed(1);
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
