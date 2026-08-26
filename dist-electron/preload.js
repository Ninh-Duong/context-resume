import { contextBridge as e, ipcRenderer as t } from "electron";
//#region electron/preload.ts
e.exposeInMainWorld("electronAPI", {
	minimizeWindow: () => t.send("window:minimize"),
	maximizeWindow: () => t.send("window:maximize"),
	closeWindow: () => t.send("window:close"),
	hideWindow: () => t.send("window:hide"),
	setAlwaysOnTop: (e) => t.send("window:set-always-on-top", e),
	setOpacity: (e) => t.send("window:set-opacity", e),
	setIgnoreMouseEvents: (e, n) => t.send("window:set-ignore-mouse-events", e, n),
	openQuickCapture: () => t.send("window:open-quick-capture"),
	openWorkspace: () => t.send("window:open-workspace"),
	openDock: () => t.send("window:open-dock"),
	resizeWindow: (e, n) => t.send("window:resize", e, n),
	saveLocalData: (e, n) => t.invoke("storage:save", e, n),
	loadLocalData: (e) => t.invoke("storage:load", e),
	onGlobalHotkeyTriggered: (e) => {
		let n = (t, n) => e(n);
		return t.on("hotkey:triggered", n), () => t.removeListener("hotkey:triggered", n);
	},
	onDataSync: (e) => {
		let n = (t, n) => e(n);
		return t.on("data:sync", n), () => t.removeListener("data:sync", n);
	},
	broadcastDataSync: (e) => t.send("data:broadcast-sync", e)
});
//#endregion
export {};
