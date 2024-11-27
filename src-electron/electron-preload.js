const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  startAuth: async () => ipcRenderer.invoke("start-auth"),
  getCookie: async (name) => ipcRenderer.invoke("get-cookie", name)
});
