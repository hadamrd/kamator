const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  startAuth: async () => {
    return await ipcRenderer.invoke("start-auth");
  },
});
