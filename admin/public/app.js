let model = null;
let values = {};
let activeGroup = '';
let dirty = false;

const groupsEl = document.getElementById('groups');
const editorEl = document.getElementById('editor');
const statusEl = document.getElementById('status');
const previewEl = document.getElementById('preview');

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? 'var(--danger)' : '';
}

function markDirty() {
  dirty = true;
  document.body.classList.add('dirty');
}

function clearDirty() {
  dirty = false;
  document.body.classList.remove('dirty');
}

function htmlToText(value) {
  return String(value ?? '');
}

function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `/preview/${encodeURI(path).replace(/%2F/g, '/')}`;
}

function parsePosition(value) {
  const text = String(value || '50% 50%').trim().toLowerCase();
  const parts = text.split(/\s+/);
  const map = { left: 0, center: 50, right: 100, top: 0, bottom: 100 };
  const toPercent = (part, fallback) => {
    if (part in map) return map[part];
    const num = parseFloat(part);
    return Number.isFinite(num) ? Math.max(0, Math.min(100, num)) : fallback;
  };
  return {
    x: toPercent(parts[0], 50),
    y: toPercent(parts[1], 50)
  };
}

function formatPosition(x, y) {
  return `${Math.round(x)}% ${Math.round(y)}%`;
}

function groupedFields() {
  const map = new Map();
  for (const field of model.fields) {
    if (!map.has(field.group)) map.set(field.group, []);
    map.get(field.group).push(field);
  }
  return map;
}

function renderGroups() {
  const groups = [...groupedFields().keys()];
  activeGroup = activeGroup || groups[0] || '';
  groupsEl.innerHTML = groups.map(group =>
    `<button class="group-btn${group === activeGroup ? ' active' : ''}" data-group="${escapeAttr(group)}">${escapeHtml(group)}</button>`
  ).join('');
  groupsEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      activeGroup = btn.dataset.group;
      renderGroups();
      renderEditor();
    });
  });
}

function renderEditor() {
  const fields = groupedFields().get(activeGroup) || [];
  if (!fields.length) {
    editorEl.innerHTML = '<div class="empty">ยังไม่มี field ให้แก้</div>';
    return;
  }
  editorEl.innerHTML = `<h2 class="section-title">${escapeHtml(activeGroup)}</h2>`;
  for (const field of fields) editorEl.appendChild(renderField(field));
}

function renderField(field) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const label = document.createElement('label');
  label.textContent = field.label;
  wrap.appendChild(label);

  if (field.type === 'textarea') {
    const input = document.createElement('textarea');
    input.value = htmlToText(values[field.id]);
    input.addEventListener('input', () => {
      values[field.id] = input.value;
      markDirty();
    });
    wrap.appendChild(input);
    if (field.html) wrap.insertAdjacentHTML('beforeend', '<span class="hint">รองรับ HTML เช่น &lt;br&gt; และ &lt;span&gt;</span>');
    return wrap;
  }

  if (field.type === 'image') {
    const row = document.createElement('div');
    row.className = 'image-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = htmlToText(values[field.id]);
    input.addEventListener('input', () => {
      values[field.id] = input.value;
      markDirty();
      renderEditor();
    });

    const upload = document.createElement('button');
    upload.className = 'upload';
    upload.textContent = 'อัปโหลด';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.addEventListener('change', async () => {
      if (!file.files[0]) return;
      setStatus('กำลังอัปโหลด...');
      const data = new FormData();
      data.append('file', file.files[0]);
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      values[field.id] = json.path;
      markDirty();
      setStatus('อัปโหลดแล้ว ยังต้องกดบันทึก');
      renderEditor();
    });
    upload.appendChild(file);
    row.append(input, upload);
    wrap.appendChild(row);
    return wrap;
  }

  if (field.type === 'position') {
    const imageField = findNearbyImage(field);
    const editor = document.getElementById('imageEditorTemplate').content.cloneNode(true);
    const frame = editor.querySelector('.image-frame');
    const img = editor.querySelector('img');
    const cross = editor.querySelector('.crosshair');
    const xRange = editor.querySelector('[data-axis="x"]');
    const yRange = editor.querySelector('[data-axis="y"]');
    let pos = parsePosition(values[field.id]);
    img.src = assetUrl(values[imageField?.id] || '');

    const sync = () => {
      const value = formatPosition(pos.x, pos.y);
      values[field.id] = value;
      img.style.objectPosition = value;
      cross.style.left = `${pos.x}%`;
      cross.style.top = `${pos.y}%`;
      xRange.value = pos.x;
      yRange.value = pos.y;
    };

    const setFromPointer = event => {
      const rect = frame.getBoundingClientRect();
      pos = {
        x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
        y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
      };
      sync();
      markDirty();
    };

    frame.addEventListener('pointerdown', event => {
      frame.setPointerCapture(event.pointerId);
      setFromPointer(event);
    });
    frame.addEventListener('pointermove', event => {
      if (event.buttons) setFromPointer(event);
    });
    xRange.addEventListener('input', () => {
      pos.x = Number(xRange.value);
      sync();
      markDirty();
    });
    yRange.addEventListener('input', () => {
      pos.y = Number(yRange.value);
      sync();
      markDirty();
    });
    sync();
    wrap.appendChild(editor);
    return wrap;
  }

  const input = document.createElement('input');
  input.type = 'text';
  input.value = htmlToText(values[field.id]);
  input.addEventListener('input', () => {
    values[field.id] = input.value;
    markDirty();
  });
  wrap.appendChild(input);
  if (field.html) wrap.insertAdjacentHTML('beforeend', '<span class="hint">รองรับ HTML</span>');
  return wrap;
}

function findNearbyImage(field) {
  const prefix = field.id.replace(/\.position$/, '');
  return model.fields.find(item => item.id === `${prefix}.image`);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function escapeAttr(text) {
  return escapeHtml(text);
}

async function load() {
  setStatus('กำลังโหลด...');
  const res = await fetch('/api/project');
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Load failed');
  model = json;
  values = { ...json.values };
  document.getElementById('rootPath').textContent = json.root;
  renderGroups();
  renderEditor();
  clearDirty();
  setStatus('พร้อมใช้งาน');
}

async function save() {
  setStatus('กำลังบันทึก...');
  const res = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Save failed');
  clearDirty();
  setStatus(`บันทึกแล้ว: ${json.files.join(', ')}`);
  previewEl.src = `${previewEl.src.split('?')[0]}?t=${Date.now()}`;
  window.parent?.postMessage({ type: 'studio:reload-preview' }, '*');
}

document.getElementById('saveBtn').addEventListener('click', () => save().catch(err => setStatus(err.message, true)));
document.getElementById('reloadBtn').addEventListener('click', () => load().catch(err => setStatus(err.message, true)));
document.getElementById('previewPage').addEventListener('change', event => {
  previewEl.src = event.target.value;
});

window.addEventListener('beforeunload', event => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = '';
});

load().catch(err => setStatus(err.message, true));
