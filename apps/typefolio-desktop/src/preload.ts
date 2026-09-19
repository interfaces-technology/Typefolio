import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("typefolio", {
  signIn: () => ipcRenderer.invoke("sign-in"),
  signOut: () => ipcRenderer.invoke("sign-out"),
  getUser: () => ipcRenderer.invoke("get-user"),
  getLibrary: () => ipcRenderer.invoke("get-library"),
  uploadFonts: () => ipcRenderer.invoke("upload-fonts"),
  deleteFont: (fontId: string) => ipcRenderer.invoke("delete-font", fontId),
  downloadAll: () => ipcRenderer.invoke("download-all"),
  getSyncStatus: () => ipcRenderer.invoke("get-sync-status"),
  onAuthComplete: (cb: (email: string) => void) =>
    ipcRenderer.on("auth-complete", (_e, email) => cb(email)),
  onSyncUpdate: (cb: (status: string) => void) =>
    ipcRenderer.on("sync-update", (_e, status) => cb(status)),
});
