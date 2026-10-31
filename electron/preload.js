const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('weDesktop', {
  save: (txt) => ipcRenderer.invoke('autosave', txt),
  load: () => ipcRenderer.invoke('autosave-load'),
  quit: () => ipcRenderer.invoke('quit')
});
