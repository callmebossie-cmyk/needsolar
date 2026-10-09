const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const { listen } = require('../server');

let mainWindow;
let serverInfo;
let logFile;
let stateFile;

function getStateFile() {
  if (!stateFile) stateFile = path.join(app.getPath('userData'), 'studio-state.json');
  return stateFile;
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(getStateFile(), 'utf8'));
  } catch (_) {
    return { recentProjects: [] };
  }
}

function writeState(state) {
  fs.mkdirSync(path.dirname(getStateFile()), { recursive: true });
  fs.writeFileSync(getStateFile(), JSON.stringify(state, null, 2), 'utf8');
}

function rememberProject(folderPath) {
  const state = readState();
  const resolved = path.resolve(folderPath);
  const recentProjects = [
    { path: resolved, name: path.basename(resolved), openedAt: new Date().toISOString() },
    ...(state.recentProjects || []).filter(item => path.resolve(item.path) !== resolved)
  ].slice(0, 8);
  writeState({ ...state, recentProjects });
}

function log(message, data) {
  const line = `[${new Date().toISOString()}] ${message}${data ? ` ${JSON.stringify(data)}` : ''}\n`;
  try {
    if (!logFile) {
      const dir = app.isReady() ? app.getPath('userData') : __dirname;
      logFile = path.join(dir, 'studio-debug.log');
    }
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.appendFileSync(logFile, line, 'utf8');
  } catch (_) {}
  console.log(line.trim());
}

function createWindow() {
  log('createWindow');
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    title: 'Need Solar Studio',
    backgroundColor: '#101114',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.webContents.on('did-fail-load', (_event, code, desc) => {
    log('did-fail-load', { code, desc });
    dialog.showErrorBox('Need Solar Studio load failed', `${code}: ${desc}`);
  });
  mainWindow.webContents.on('did-finish-load', () => log('did-finish-load'));
  mainWindow.webContents.on('render-process-gone', (_event, details) => log('render-process-gone', details));
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    log('renderer-console', { level, message, line, sourceId });
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

async function openProject(folderPath) {
  log('openProject:start', { folderPath });
  if (serverInfo?.server) {
    await new Promise(resolve => serverInfo.server.close(resolve));
  }
  serverInfo = await listen({ rootDir: folderPath, port: 0 });
  rememberProject(serverInfo.rootDir);
  log('openProject:ready', { port: serverInfo.port, root: serverInfo.rootDir });
  return {
    root: serverInfo.rootDir,
    adminUrl: `http://127.0.0.1:${serverInfo.port}/admin`,
    previewUrl: `http://127.0.0.1:${serverInfo.port}/preview/index.html`
  };
}

ipcMain.handle('project:browse', async () => {
  log('ipc project:browse');
  mainWindow?.focus();
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'เลือกโฟลเดอร์โปรเจกต์',
    defaultPath: app.getPath('documents'),
    properties: ['openDirectory']
  });
  log('dialog result', { canceled: result.canceled, filePaths: result.filePaths });
  if (result.canceled || !result.filePaths[0]) return null;
  return openProject(result.filePaths[0]);
});

ipcMain.handle('project:openPath', async (_event, folderPath) => {
  log('ipc project:openPath', { folderPath });
  return openProject(folderPath);
});

ipcMain.handle('studio:diagnostics', async () => ({
  logFile,
  versions: process.versions,
  cwd: process.cwd(),
  appPath: app.getAppPath()
}));

ipcMain.handle('studio:state', async () => readState());

ipcMain.handle('studio:clearRecent', async () => {
  const state = readState();
  writeState({ ...state, recentProjects: [] });
  return readState();
});

ipcMain.on('studio:log', (_event, payload) => log('renderer-log', payload));

ipcMain.handle('panel:float', async (_event, payload) => {
  if (!serverInfo) return null;
  const win = new BrowserWindow({
    width: payload?.width || 520,
    height: payload?.height || 720,
    title: payload?.title || 'Panel',
    backgroundColor: '#101114',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false
    }
  });
  await win.loadFile(path.join(__dirname, 'renderer', 'floating.html'), {
    query: {
      title: payload?.title || 'Panel',
      src: payload?.src || `http://127.0.0.1:${serverInfo.port}/admin`
    }
  });
  return true;
});

app.whenReady().then(() => {
  logFile = path.join(app.getPath('userData'), 'studio-debug.log');
  log('app-ready', { appPath: app.getAppPath(), userData: app.getPath('userData') });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  log('before-quit');
  if (serverInfo?.server) serverInfo.server.close();
});
