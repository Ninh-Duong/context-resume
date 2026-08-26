import { contextBridge, ipcRenderer } from "electron";
//#region electron/preload.ts
contextBridge.exposeInMainWorld("electronAPI", {
	minimizeWindow: () => ipcRenderer.send("window:minimize"),
	maximizeWindow: () => ipcRenderer.send("window:maximize"),
	closeWindow: () => ipcRenderer.send("window:close"),
	hideWindow: () => ipcRenderer.send("window:hide"),
	setAlwaysOnTop: (flag) => ipcRenderer.send("window:set-always-on-top", flag),
	setOpacity: (opacity) => ipcRenderer.send("window:set-opacity", opacity),
	setIgnoreMouseEvents: (ignore, forward) => ipcRenderer.send("window:set-ignore-mouse-events", ignore, forward),
	openQuickCapture: () => ipcRenderer.send("window:open-quick-capture"),
	closeQuickCapture: () => ipcRenderer.send("window:close-quick-capture"),
	resizeQuickCapture: (width, height) => ipcRenderer.send("window:resize-quick-capture", width, height),
	openWorkspace: () => ipcRenderer.send("window:open-workspace"),
	hideWorkspace: () => ipcRenderer.send("window:hide-workspace"),
	toggleWorkspace: () => ipcRenderer.send("window:toggle-workspace"),
	openDock: () => ipcRenderer.send("window:open-dock"),
	hideDock: () => ipcRenderer.send("window:hide-dock"),
	resizeDock: (width, height) => ipcRenderer.send("window:resize-dock", width, height),
	saveLocalData: (key, data) => ipcRenderer.invoke("storage:save", key, data),
	loadLocalData: (key) => ipcRenderer.invoke("storage:load", key),
	onGlobalHotkeyTriggered: (callback) => {
		const handler = (_event, action) => callback(action);
		ipcRenderer.on("hotkey:triggered", handler);
		return () => ipcRenderer.removeListener("hotkey:triggered", handler);
	},
	onDataSync: (callback) => {
		const handler = (_event, data) => callback(data);
		ipcRenderer.on("data:sync", handler);
		return () => ipcRenderer.removeListener("data:sync", handler);
	},
	broadcastDataSync: (data) => ipcRenderer.send("data:broadcast-sync", data)
});
//#endregion
export {};
