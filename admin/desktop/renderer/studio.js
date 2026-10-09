const launcher = document.getElementById('launcher');
const studio = document.getElementById('studio');
const statusEl = document.getElementById('launchStatus');
const browseBtn = document.getElementById('browseBtn');
const projectPathInput = document.getElementById('projectPathInput');
const openPathBtn = document.getElementById('openPathBtn');
const recentProjectsEl = document.getElementById('recentProjects');
const clearRecentBtn = document.getElementById('clearRecentBtn');
const changeProjectBtn = document.getElementById('changeProjectBtn');
const projectPathEl = document.getElementById('projectPath');
const adminFrame = document.getElementById('adminFrame');
const previewFrame = document.getElementById('previewFrame');
const dock = document.querySelector('.dock');

let project = null;
const bridge = getBridge();
const diagnostics = getDiagnostics();

function getBridge() {
  if (window.studio) return window.studio;
  try {
    const { ipcRenderer } = require('electron');
    return {
      browseProject: () => ipcRenderer.invoke('project:browse'),
      openProjectPath: path => ipcRenderer.invoke('project:openPath', path),
      floatPanel: payload => ipcRenderer.invoke('panel:float', payload),
      getState: () => ipcRenderer.invoke('studio:state'),
      clearRecent: () => ipcRenderer.invoke('studio:clearRecent')
    };
  } catch (error) {
    console.error('bridge init failed', error);
    return null;
  }
}

function getDiagnostics() {
  try {
    const { ipcRenderer } = require('electron');
    return {
      log: payload => ipcRenderer.send('studio:log', payload),
      read: () => ipcRenderer.invoke('studio:diagnostics')
    };
  } catch (error) {
    return {
      log: payload => console.log('diagnostic', payload),
      read: async () => ({ error: String(error) })
    };
  }
}

function log(message, data) {
  diagnostics.log({ message, data });
}

async function chooseProject() {
  log('browse-click', { hasBridge: !!bridge, hasBrowse: !!bridge?.browseProject });
  statusEl.textContent = 'กำลังเปิดโฟลเดอร์...';
  try {
    if (!bridge?.browseProject) throw new Error('Desktop bridge ไม่พร้อมใช้งาน ลองปิดเปิดโปรแกรมใหม่');
    browseBtn.disabled = true;
    const result = await bridge.browseProject();
    if (!result) {
      statusEl.textContent = 'ยกเลิกการเลือกโฟลเดอร์';
      return;
    }
    project = result;
    openWorkspace();
    renderRecentProjects();
  } catch (error) {
    statusEl.textContent = error.message || 'เปิดโปรเจกต์ไม่สำเร็จ';
    alert(statusEl.textContent);
  } finally {
    browseBtn.disabled = false;
  }
}

async function openTypedProject() {
  log('open-path-click', { value: projectPathInput.value, hasBridge: !!bridge, hasOpen: !!bridge?.openProjectPath });
  const folderPath = projectPathInput.value.trim();
  if (!folderPath) {
    statusEl.textContent = 'ใส่ path โฟลเดอร์ก่อนนะคะ';
    return;
  }
  statusEl.textContent = 'กำลังเปิดโปรเจกต์จาก path...';
  try {
    if (!bridge?.openProjectPath) throw new Error('Desktop bridge ไม่พร้อมใช้งาน ลองปิดเปิดโปรแกรมใหม่');
    openPathBtn.disabled = true;
    project = await bridge.openProjectPath(folderPath);
    openWorkspace();
    renderRecentProjects();
  } catch (error) {
    statusEl.textContent = error.message || 'เปิดโปรเจกต์ไม่สำเร็จ';
    alert(statusEl.textContent);
  } finally {
    openPathBtn.disabled = false;
  }
}

function openWorkspace() {
  log('open-workspace', project);
  document.body.classList.remove('empty');
  launcher.hidden = true;
  studio.hidden = false;
  projectPathEl.textContent = project.root;
  adminFrame.src = project.adminUrl;
  previewFrame.src = project.previewUrl;
  applySavedLayout();
}

function reloadPreview() {
  if (!project) return;
  previewFrame.src = `${project.previewUrl}?t=${Date.now()}`;
}

function setupSplitters() {
  let drag = null;
  document.querySelectorAll('.splitter').forEach(splitter => {
    splitter.addEventListener('pointerdown', event => {
      const cols = getComputedStyle(dock).gridTemplateColumns.split(' ').map(parseFloat);
      drag = {
        type: splitter.dataset.split,
        startX: event.clientX,
        cols
      };
      splitter.classList.add('dragging');
      splitter.setPointerCapture(event.pointerId);
    });
    splitter.addEventListener('pointermove', event => {
      if (!drag) return;
      const dx = event.clientX - drag.startX;
      const cols = [...drag.cols];
      if (drag.type === 'left') {
        cols[0] = clamp(cols[0] + dx, 160, 420);
        cols[2] = Math.max(360, cols[2] - dx);
      } else {
        cols[4] = clamp(cols[4] - dx, 300, 760);
        cols[2] = Math.max(360, cols[2] + dx);
      }
      setLayout(cols[0], cols[4]);
    });
    splitter.addEventListener('pointerup', () => {
      drag = null;
      splitter.classList.remove('dragging');
    });
  });
}

function setLayout(leftWidth, rightWidth) {
  dock.style.gridTemplateColumns = `${leftWidth}px 6px minmax(360px, 1fr) 6px ${rightWidth}px`;
  localStorage.setItem('studio-layout', JSON.stringify({ leftWidth, rightWidth }));
}

function applySavedLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem('studio-layout') || '{}');
    if (saved.leftWidth && saved.rightWidth) setLayout(saved.leftWidth, saved.rightWidth);
  } catch (_) {}
}

function resetLayout() {
  localStorage.removeItem('studio-layout');
  dock.style.gridTemplateColumns = '220px 6px minmax(420px, 1fr) 6px 440px';
}

async function renderRecentProjects() {
  if (!bridge?.getState) {
    recentProjectsEl.innerHTML = '<div class="recent-empty">Recent projects unavailable</div>';
    return;
  }
  try {
    const state = await bridge.getState();
    const recent = state.recentProjects || [];
    if (!recent.length) {
      recentProjectsEl.innerHTML = '<div class="recent-empty">ยังไม่มีโปรเจกต์ล่าสุด</div>';
      return;
    }
    recentProjectsEl.innerHTML = recent.map(item => `
      <button class="recent-item" data-path="${escapeAttr(item.path)}">
        <strong>${escapeHtml(item.name || item.path)}</strong>
        <span>${escapeHtml(item.path)}</span>
      </button>
    `).join('');
    recentProjectsEl.querySelectorAll('.recent-item').forEach(button => {
      button.addEventListener('click', async () => {
        projectPathInput.value = button.dataset.path;
        await openTypedProject();
      });
    });
  } catch (error) {
    recentProjectsEl.innerHTML = `<div class="recent-empty">${escapeHtml(error.message || 'โหลด recent ไม่ได้')}</div>`;
  }
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function escapeAttr(text) {
  return escapeHtml(text);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

browseBtn.addEventListener('click', chooseProject);
openPathBtn.addEventListener('click', openTypedProject);
projectPathInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') openTypedProject();
});
changeProjectBtn.addEventListener('click', chooseProject);
document.getElementById('reloadPreview').addEventListener('click', reloadPreview);
document.getElementById('resetLayout').addEventListener('click', resetLayout);
clearRecentBtn.addEventListener('click', async () => {
  if (bridge?.clearRecent) await bridge.clearRecent();
  renderRecentProjects();
});
document.getElementById('floatPreview').addEventListener('click', () => {
  if (project) bridge?.floatPanel({ title: 'Preview', src: project.previewUrl, width: 960, height: 760 });
});
document.getElementById('floatInspector').addEventListener('click', () => {
  if (project) bridge?.floatPanel({ title: 'Inspector', src: project.adminUrl, width: 560, height: 760 });
});

document.querySelectorAll('.tool').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tool').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    if (!project) return;
    if (button.dataset.src === 'admin') adminFrame.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
    if (button.dataset.src === 'preview') previewFrame.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });
});

setupSplitters();
renderRecentProjects();

if (!bridge) {
  statusEl.textContent = 'Desktop bridge ไม่โหลด: กรุณาเปิดผ่านไฟล์ .exe หรือ npm run studio';
} else {
  statusEl.textContent = 'Desktop bridge พร้อมใช้งาน';
  log('bridge-ready');
}

try {
  if (typeof process !== 'undefined' && process.env.STUDIO_AUTO_OPEN_PROJECT) {
    projectPathInput.value = process.env.STUDIO_AUTO_OPEN_PROJECT;
    setTimeout(openTypedProject, 300);
  }
} catch (_) {}

window.addEventListener('message', event => {
  if (event.data?.type === 'studio:reload-preview') reloadPreview();
});
