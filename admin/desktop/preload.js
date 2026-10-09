const { contextBridge, ipcRenderer } = require('electron');

const api = {
  browseProject: () => ipcRenderer.invoke('project:browse'),
  openProjectPath: path => ipcRenderer.invoke('project:openPath', path),
  floatPanel: payload => ipcRenderer.invoke('panel:float', payload),
  getState: () => ipcRenderer.invoke('studio:state'),
  clearRecent: () => ipcRenderer.invoke('studio:clearRecent')
};

try {
  contextBridge.exposeInMainWorld('studio', api);
} catch (_) {
  window.studio = api;
}
