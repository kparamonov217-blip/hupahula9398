// WebExcel Desktop — Electron main process
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// All web files are packaged in resources/app (win-unpacked\resources\app)
const WEB_ROOT = path.join(process.resourcesPath || __dirname, 'app');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'WebExcel',
    icon: path.join(WEB_ROOT, 'paint_32px.ico'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(WEB_ROOT, 'index.html'));
}

const { ipcMain } = require('electron');
const AUTOSAVE = path.join(app.getPath('documents'), 'WebExcel');

ipcMain.handle('autosave', (e, txt) => {
  try { fs.mkdirSync(AUTOSAVE, { recursive: true }); fs.writeFileSync(path.join(AUTOSAVE, 'autosave.json'), txt); } catch (err) {}
  return 'ok';
});
ipcMain.handle('autosave-load', () => {
  try { return fs.readFileSync(path.join(AUTOSAVE, 'autosave.json'), 'utf-8'); } catch (err) { return null; }
});
ipcMain.handle('quit', () => { app.quit(); return 'ok'; });

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
