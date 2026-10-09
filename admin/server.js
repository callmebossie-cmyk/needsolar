const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const publicDir = path.join(__dirname, 'public');
const backupDir = path.join(__dirname, 'backups');
const port = Number(process.env.ADMIN_PORT || process.env.PORT || 4173);
let rootDir = path.resolve(process.env.PROJECT_ROOT || path.join(__dirname, '..'));
let uploadDir = path.join(rootDir, 'assets', 'images', 'uploads');

const html = String.raw;

function field(id, file, group, label, type, regex, occurrence, options = {}) {
  return { id, file, group, label, type, source: regex.source, flags: regex.flags, occurrence, ...options };
}

const fields = [
  ...Array.from({ length: 4 }, (_, i) => {
    const slide = i + 1;
    return [
      field(`home.hero.${i}.tag`, 'index.html', `หน้าแรก / Hero Slide ${slide}`, 'ป้ายกำกับ', 'text', /(<div class="hs-tag">)([\s\S]*?)(<\/div>)/g, i),
      field(`home.hero.${i}.title`, 'index.html', `หน้าแรก / Hero Slide ${slide}`, 'หัวข้อ', 'textarea', /(<h1 class="hs-title">)([\s\S]*?)(<\/h1>)/g, i, { html: true }),
      field(`home.hero.${i}.subtitle`, 'index.html', `หน้าแรก / Hero Slide ${slide}`, 'คำอธิบาย', 'textarea', /(<p class="hs-sub">)([\s\S]*?)(<\/p>)/g, i, { html: true }),
      field(`home.hero.${i}.primaryText`, 'index.html', `หน้าแรก / Hero Slide ${slide}`, 'ปุ่มหลัก - ข้อความ', 'text', /(<a href="[^"]*" class="btn btn-primary">)([\s\S]*?)(<\/a>)/g, i, { html: true }),
      field(`home.hero.${i}.primaryHref`, 'index.html', `หน้าแรก / Hero Slide ${slide}`, 'ปุ่มหลัก - ลิงก์', 'text', /(<a href=")([^"]*)(" class="btn btn-primary">[\s\S]*?<\/a>)/g, i),
      field(`home.hero.${i}.secondaryText`, 'index.html', `หน้าแรก / Hero Slide ${slide}`, 'ปุ่มรอง - ข้อความ', 'text', /(<a href="[^"]*" class="btn btn-ghost">)([\s\S]*?)(<\/a>)/g, i, { html: true }),
      field(`home.hero.${i}.secondaryHref`, 'index.html', `หน้าแรก / Hero Slide ${slide}`, 'ปุ่มรอง - ลิงก์', 'text', /(<a href=")([^"]*)(" class="btn btn-ghost">[\s\S]*?<\/a>)/g, i),
      field(`home.hero.${i}.image`, 'index.html', `หน้าแรก / Hero Slide ${slide}`, 'รูปภาพ', 'image', /(<img class="hs-img" src=")([^"]*)("[^>]*>)/g, i),
      field(`home.hero.${i}.position`, 'index.html', `หน้าแรก / Hero Slide ${slide}`, 'ตำแหน่งรูป', 'position', /<img class="hs-img"[^>]*>/g, i, { defaultPosition: i === 0 ? '3% center' : 'center right' })
    ];
  }).flat(),
  ...Array.from({ length: 4 }, (_, i) => [
    field(`home.stats.${i}.value`, 'index.html', 'หน้าแรก / แถบสถิติ', `สถิติ ${i + 1} - ตัวเลข`, 'text', /(<div class="h-stat-val"[^>]*>)([\s\S]*?)(<\/div>)/g, i, { html: true }),
    field(`home.stats.${i}.label`, 'index.html', 'หน้าแรก / แถบสถิติ', `สถิติ ${i + 1} - คำอธิบาย`, 'text', /(<div class="h-stat-lbl">)([\s\S]*?)(<\/div>)/g, i)
  ]).flat(),
  field('home.about.label', 'index.html', 'หน้าแรก / เกี่ยวกับ NEED SOLAR', 'ป้ายกำกับ', 'text', /(<span class="sec-label">)([\s\S]*?)(<\/span>)/g, 0),
  field('home.about.title', 'index.html', 'หน้าแรก / เกี่ยวกับ NEED SOLAR', 'หัวข้อ', 'textarea', /(<h2 class="sec-title">)([\s\S]*?)(<\/h2>)/g, 0, { html: true }),
  field('home.about.desc', 'index.html', 'หน้าแรก / เกี่ยวกับ NEED SOLAR', 'คำอธิบาย', 'textarea', /(<p class="sec-desc">)([\s\S]*?)(<\/p>)/g, 0, { html: true }),
  field('home.about.badgeValue', 'index.html', 'หน้าแรก / เกี่ยวกับ NEED SOLAR', 'Badge - ตัวเลข', 'text', /(<div class="ab-val">)([\s\S]*?)(<\/div>)/g, 0),
  field('home.about.badgeLabel', 'index.html', 'หน้าแรก / เกี่ยวกับ NEED SOLAR', 'Badge - คำอธิบาย', 'text', /(<div class="ab-lbl">)([\s\S]*?)(<\/div>)/g, 0),

  field('about.hero.title', 'about.html', 'เกี่ยวกับเรา / Hero', 'หัวข้อ', 'textarea', /(<h1 class="page-title">)([\s\S]*?)(<\/h1>)/g, 0, { html: true }),
  field('about.hero.desc', 'about.html', 'เกี่ยวกับเรา / Hero', 'คำอธิบาย', 'textarea', /(<p class="page-desc">)([\s\S]*?)(<\/p>)/g, 0, { html: true }),
  field('about.hero.image', 'about.html', 'เกี่ยวกับเรา / Hero', 'รูปภาพ', 'image', /(<img src=")([^"]*)("[^>]*class="about-hero-img"[^>]*>)/g, 0),
  field('about.hero.position', 'about.html', 'เกี่ยวกับเรา / Hero', 'ตำแหน่งรูป', 'position', /<img src="[^"]*"[^>]*class="about-hero-img"[^>]*>/g, 0, { defaultPosition: 'center 15%' }),
  field('about.intro.label', 'about.html', 'เกี่ยวกับเรา / เราคือใคร', 'ป้ายกำกับ', 'text', /(<span class="sec-label">)([\s\S]*?)(<\/span>)/g, 0),
  field('about.intro.title', 'about.html', 'เกี่ยวกับเรา / เราคือใคร', 'หัวข้อ', 'textarea', /(<h2 class="sec-title">)([\s\S]*?)(<\/h2>)/g, 0, { html: true }),
  ...Array.from({ length: 3 }, (_, i) =>
    field(`about.intro.p${i + 1}`, 'about.html', 'เกี่ยวกับเรา / เราคือใคร', `ย่อหน้า ${i + 1}`, 'textarea', /(<p>)([\s\S]*?)(<\/p>)/g, i, { html: true })
  ),
  ...Array.from({ length: 4 }, (_, i) => [
    field(`about.stats.${i}.value`, 'about.html', 'เกี่ยวกับเรา / สถิติ', `สถิติ ${i + 1} - ตัวเลข`, 'text', /(<div class="ab-stat-val">)([\s\S]*?)(<\/div>)/g, i, { html: true }),
    field(`about.stats.${i}.label`, 'about.html', 'เกี่ยวกับเรา / สถิติ', `สถิติ ${i + 1} - คำอธิบาย`, 'text', /(<div class="ab-stat-lbl">)([\s\S]*?)(<\/div>)/g, i)
  ]).flat()
];

function send(res, code, body, type = 'application/json; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}

function safeRootPath(relativePath) {
  const resolved = path.resolve(rootDir, relativePath);
  if (!resolved.startsWith(rootDir + path.sep) && resolved !== rootDir) {
    throw new Error('Path escapes project root');
  }
  return resolved;
}

function setProjectRoot(nextRoot) {
  const resolved = path.resolve(nextRoot);
  if (!fs.existsSync(path.join(resolved, 'index.html'))) {
    throw new Error('โฟลเดอร์นี้ไม่มี index.html');
  }
  rootDir = resolved;
  uploadDir = path.join(rootDir, 'assets', 'images', 'uploads');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function makeRegex(def) {
  return new RegExp(def.source, def.flags.includes('g') ? def.flags : def.flags + 'g');
}

function matchNth(content, def) {
  const regex = makeRegex(def);
  let match;
  let index = 0;
  while ((match = regex.exec(content))) {
    if (index === def.occurrence) return match;
    index++;
  }
  return null;
}

function getFieldValue(content, def) {
  const match = matchNth(content, def);
  if (!match) return '';
  if (def.type === 'position') return extractObjectPosition(match[0]) || def.defaultPosition || 'center center';
  return match[2] || '';
}

function replaceNth(content, def, nextValue) {
  const regex = makeRegex(def);
  let index = 0;
  let replaced = false;
  const next = content.replace(regex, (...args) => {
    const match = args[0];
    if (index++ !== def.occurrence) return match;
    replaced = true;
    if (def.type === 'position') return setObjectPosition(match, nextValue || def.defaultPosition || 'center center');
    return `${args[1]}${nextValue}${args[3]}`;
  });
  if (!replaced) throw new Error(`Field not found: ${def.id}`);
  return next;
}

function extractObjectPosition(tag) {
  const style = tag.match(/\sstyle="([^"]*)"/i)?.[1] || '';
  return style.match(/object-position\s*:\s*([^;]+)\s*;?/i)?.[1]?.trim() || '';
}

function setObjectPosition(tag, value) {
  const clean = String(value).trim() || 'center center';
  if (/\sstyle="/i.test(tag)) {
    return tag.replace(/\sstyle="([^"]*)"/i, (_, style) => {
      const nextStyle = /object-position\s*:/i.test(style)
        ? style.replace(/object-position\s*:\s*[^;]+;?/i, `object-position: ${clean};`)
        : `${style.trim()}${style.trim().endsWith(';') || !style.trim() ? '' : ';'} object-position: ${clean};`;
      return ` style="${nextStyle.trim()}"`;
    });
  }
  return tag.replace(/\s*\/?>$/, end => ` style="object-position: ${clean};"${end}`);
}

function loadProject() {
  const cache = new Map();
  const values = {};
  for (const def of fields) {
    if (!cache.has(def.file)) cache.set(def.file, fs.readFileSync(safeRootPath(def.file), 'utf8'));
    values[def.id] = getFieldValue(cache.get(def.file), def);
  }
  return {
    root: rootDir,
    previewUrl: '/preview/index.html',
    fields: fields.map(({ source, flags, occurrence, ...safe }) => safe),
    values
  };
}

function backupFile(file, content) {
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `${path.basename(file)}.${stamp}.bak`;
  fs.writeFileSync(path.join(backupDir, backupName), content, 'utf8');
}

function saveProject(values) {
  const touched = new Set();
  const byFile = new Map();
  for (const def of fields) {
    if (Object.prototype.hasOwnProperty.call(values, def.id)) {
      if (!byFile.has(def.file)) byFile.set(def.file, []);
      byFile.get(def.file).push(def);
    }
  }
  for (const [file, defs] of byFile) {
    const full = safeRootPath(file);
    let content = fs.readFileSync(full, 'utf8');
    backupFile(file, content);
    for (const def of defs) content = replaceNth(content, def, values[def.id]);
    fs.writeFileSync(full, content, 'utf8');
    touched.add(file);
  }
  return [...touched];
}

function serveFile(res, filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

function parseMultipart(buffer, contentType) {
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.[1] || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.[2];
  if (!boundary) throw new Error('Missing multipart boundary');
  const raw = buffer.toString('binary');
  const parts = raw.split(`--${boundary}`).slice(1, -1);
  for (const part of parts) {
    const [head, ...bodyParts] = part.split('\r\n\r\n');
    if (!head.includes('name="file"')) continue;
    const filename = head.match(/filename="([^"]+)"/)?.[1] || 'upload.bin';
    let body = bodyParts.join('\r\n\r\n');
    if (body.endsWith('\r\n')) body = body.slice(0, -2);
    return { filename, data: Buffer.from(body, 'binary') };
  }
  throw new Error('File part not found');
}

function cleanFileName(name) {
  const ext = path.extname(name).toLowerCase().replace(/[^a-z0-9.]/g, '') || '.jpg';
  const base = path.basename(name, path.extname(name)).replace(/[^\w\u0E00-\u0E7F-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'image';
  return `${base}-${crypto.randomBytes(4).toString('hex')}${ext}`;
}

async function handleUpload(req, res) {
  const buffer = await readBody(req);
  const file = parseMultipart(buffer, req.headers['content-type'] || '');
  fs.mkdirSync(uploadDir, { recursive: true });
  const name = cleanFileName(file.filename);
  const full = path.join(uploadDir, name);
  fs.writeFileSync(full, file.data);
  send(res, 200, { path: `assets/images/uploads/${name}` });
}

function createAdminServer() {
  return http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/' || url.pathname === '/admin') return serveFile(res, path.join(publicDir, 'index.html'));
    if (url.pathname.startsWith('/admin/')) return serveFile(res, path.join(publicDir, url.pathname.replace('/admin/', '')));
    if (url.pathname === '/api/project' && req.method === 'GET') return send(res, 200, loadProject());
    if (url.pathname === '/api/save' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
      return send(res, 200, { ok: true, files: saveProject(body.values || {}) });
    }
    if (url.pathname === '/api/upload' && req.method === 'POST') return handleUpload(req, res);
    if (url.pathname.startsWith('/preview/')) return serveFile(res, safeRootPath(decodeURIComponent(url.pathname.replace('/preview/', '')) || 'index.html'));
    return serveFile(res, path.join(publicDir, url.pathname.slice(1)));
  } catch (err) {
    send(res, 500, { error: err.message });
  }
  });
}

function listen(options = {}) {
  if (options.rootDir) setProjectRoot(options.rootDir);
  const listenPort = Number(options.port ?? port);
  const server = createAdminServer();
  return new Promise(resolve => {
    server.listen(listenPort, '127.0.0.1', () => {
      const actualPort = server.address().port;
      console.log(`Need Solar admin: http://localhost:${actualPort}/admin`);
      console.log(`Preview: http://localhost:${actualPort}/preview/index.html`);
      resolve({ server, port: actualPort, rootDir });
    });
  });
}

if (require.main === module) {
  listen();
}

module.exports = { listen, setProjectRoot, loadProject };
