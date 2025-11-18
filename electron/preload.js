const { contextBridge, ipcRenderer } = require('electron');
// Expose des APIs protégées à Angular si nécessaire
contextBridge.exposeInMainWorld('electron', {
});
