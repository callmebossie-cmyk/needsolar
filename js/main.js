// NEED SOLAR — main.js

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

// Project gallery — filter + pagination
const PROJ_DATA = [
  {type:'video',url:'https://www.facebook.com/share/r/18ee5ZYeJx/',name:'โรงงาน ศรีราชา ชลบุรี',img:'img/projects/thumb-001.jpg'},
  {type:'video',url:'https://www.facebook.com/share/r/1Gn4yTGoSQ/',name:'บ้านพัก ระยอง',img:'img/projects/thumb-002.jpg'},
  {type:'video',url:'https://www.facebook.com/share/r/18z3sZcEKp/',name:'อาคาร พัทยา ชลบุรี',img:'img/projects/thumb-003.jpg'},
  {type:'video',url:'https://www.facebook.com/share/r/1EPmo2ZkXY/',name:'โรงงาน อมตะนคร ชลบุรี',img:'img/projects/thumb-004.jpg'},
  {type:'video',url:'https://www.facebook.com/share/r/14ejqPnxhhX/',name:'บ้านพัก บางพระ ชลบุรี',img:'img/projects/thumb-005.jpg'},
  {type:'video',url:'https://www.facebook.com/share/r/1E57sjqsT8/',name:'สำนักงาน ชลบุรี',img:'img/projects/thumb-006.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/18gTYZi1Ws/',name:'บ้านพักอาศัย ศรีราชา',img:'img/projects/thumb-007.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/18jkBuNsev/',name:'โรงงาน อมตะซิตี้ ชลบุรี',img:'img/projects/thumb-008.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1JHfMfokcE/',name:'อาคารพาณิชย์ บ้านบึง',img:'img/projects/thumb-009.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/18cHF9nXnG/',name:'บ้านพัก พัทยาเหนือ',img:'img/projects/thumb-010.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/18qYS9716K/',name:'โรงแรม จอมเทียน',img:'img/projects/thumb-011.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1UX3UUA7La/',name:'โรงงาน มาบตาพุด ระยอง',img:'img/projects/thumb-012.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1AoeMfejje/',name:'บ้านพัก บ้านฉาง ระยอง',img:'img/projects/thumb-013.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1BcVTX913o/',name:'สำนักงาน ระยอง',img:'img/projects/thumb-014.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1D3Q3ufP7N/',name:'โรงงาน ปลวกแดง ระยอง',img:'img/projects/thumb-015.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1DBfTZnG4g/',name:'บ้านพัก แกลง ระยอง',img:'img/projects/thumb-016.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1CxDHhU4Gp/',name:'บ้านพัก ลาดกระบัง กทม.',img:'img/projects/thumb-017.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1Dy2TmDr9o/',name:'อาคาร มีนบุรี กทม.',img:'img/projects/thumb-018.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1MzQdjnsdF/',name:'บ้านพัก บางนา กทม.',img:'img/projects/thumb-019.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1YxMBd2XE8/',name:'โกดัง สมุทรปราการ',img:'img/projects/thumb-020.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1BLE3goZbX/',name:'บ้านพัก ปากน้ำ สมุทรปราการ',img:'img/projects/thumb-021.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1HNTE4uzpQ/',name:'บ้านพัก แปดริ้ว ฉะเชิงเทรา',img:'img/projects/thumb-022.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1DAzvm4tx4/',name:'โรงงาน พนมสารคาม',img:'img/projects/thumb-023.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/18hCtsJgTL/',name:'บ้านพัก กบินทร์บุรี',img:'img/projects/thumb-024.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1C2bJa5Azf/',name:'สำนักงาน สระแก้ว',img:'img/projects/thumb-025.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/18c9tbCHLn/',name:'บ้านพัก ปราจีนบุรี',img:'img/projects/thumb-026.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1E9K7jN492/',name:'โรงงาน โคราช',img:'img/projects/thumb-027.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/18qKo4w2Lj/',name:'บ้านพัก ปากช่อง',img:'img/projects/thumb-028.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1GPKpdcba1/',name:'อาคาร ขอนแก่น',img:'img/projects/thumb-029.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1DyJEQvfc5/',name:'บ้านพัก อุดรธานี',img:'img/projects/thumb-030.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/17vks1xZ5y/',name:'โรงงาน นครราชสีมา',img:'img/projects/thumb-031.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/18oigaPboA/',name:'บ้านพัก เชียงใหม่',img:'img/projects/thumb-032.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1CYFEV5pZg/',name:'อาคาร สันกำแพง เชียงใหม่',img:'img/projects/thumb-033.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/191HLQZMKf/',name:'โรงงาน ลำพูน',img:'img/projects/thumb-034.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1EktQAnwKW/',name:'บ้านพัก เชียงราย',img:'img/projects/thumb-035.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1EE5hFgNxs/',name:'รีสอร์ท แม่ริม เชียงใหม่',img:'img/projects/thumb-036.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1CeqTtsg6J/',name:'รีสอร์ท ภูเก็ต',img:'img/projects/thumb-037.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1JFKbF8CAt/',name:'โรงแรม กะตะ ภูเก็ต',img:'img/projects/thumb-038.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/14ghmEwwvRy/',name:'บ้านพัก สมุย สุราษฎร์ธานี',img:'img/projects/thumb-039.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1EGUsSyWQF/',name:'อาคาร หาดใหญ่ สงขลา',img:'img/projects/thumb-040.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/1LTbPMkZEy/',name:'บ้านพัก กระบี่',img:'img/projects/thumb-041.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/18d3Ypcgae/',name:'บ้านพัก กาญจนบุรี',img:'img/projects/thumb-042.jpg'},
  {type:'photo',url:'https://www.facebook.com/share/p/17cWwsPx5D/',name:'โรงงาน ราชบุรี',img:'img/projects/thumb-043.jpg'},
];

const CARDS_PER_PAGE = 9;
let projPage = 1;
let projFilter = 'all';

function renderProjGrid() {
  const grid = document.getElementById('projGrid');
  const pager = document.getElementById('pagination');
  if (!grid) return;
  const filtered = projFilter === 'all' ? PROJ_DATA : PROJ_DATA.filter(d => d.type === projFilter);
  const total = Math.ceil(filtered.length / CARDS_PER_PAGE);
  if (projPage > total) projPage = 1;
  const slice = filtered.slice((projPage - 1) * CARDS_PER_PAGE, projPage * CARDS_PER_PAGE);
  grid.innerHTML = slice.map(item => {
    const isVid = item.type === 'video';
    const thumbStyle = item.img ? ' style="background-image:url(\'' + item.img + '\');background-size:cover;background-position:center;"' : '';
    const thumbIcon = item.img ? '' : '<div class="fb-circle ' + (isVid ? 'fb-circle-v">&#9654;' : 'fb-circle-p">&#9724;') + '</div>';
    return '<div class="proj-card fb-card" data-type="' + item.type + '" onclick="window.open(\'' + item.url + '\',\'_blank\')">' +
      '<div class="fb-thumb ' + (isVid ? 'fb-thumb-video' : 'fb-thumb-photo') + '"' + thumbStyle + '>' +
      thumbIcon +
      '</div>' +
      '<div class="proj-overlay">' +
      '<div class="proj-type ' + (isVid ? 'fb-type-video">วิดีโอ' : 'fb-type-photo">รูปภาพ') + '</div>' +
      '<div class="proj-name">' + item.name + '</div>' +
      '<div class="proj-detail">ดูบน Facebook &#8594;</div>' +
      '</div></div>';
  }).join('');
  if (!pager) return;
  if (total <= 1) { pager.innerHTML = ''; return; }
  let h = '<button class="page-btn" onclick="changeProjPage(' + (projPage - 1) + ')"' + (projPage === 1 ? ' disabled' : '') + '>&#8249; ก่อนหน้า</button>';
  for (let i = 1; i <= total; i++) h += '<button class="page-btn' + (i === projPage ? ' active' : '') + '" onclick="changeProjPage(' + i + ')">' + i + '</button>';
  h += '<button class="page-btn" onclick="changeProjPage(' + (projPage + 1) + ')"' + (projPage === total ? ' disabled' : '') + '>ถัดไป &#8250;</button>';
  pager.innerHTML = h;
}

function changeProjPage(p) {
  const filtered = projFilter === 'all' ? PROJ_DATA : PROJ_DATA.filter(d => d.type === projFilter);
  const total = Math.ceil(filtered.length / CARDS_PER_PAGE);
  if (p < 1 || p > total) return;
  projPage = p;
  renderProjGrid();
  document.querySelector('.proj-sec')?.scrollIntoView({behavior:'smooth', block:'start'});
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    projFilter = btn.dataset.filter;
    projPage = 1;
    renderProjGrid();
  });
});

renderProjGrid();

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
