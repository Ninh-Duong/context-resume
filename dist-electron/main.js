import { BrowserWindow, Menu, Tray, app, globalShortcut, ipcMain, nativeImage, screen } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
//#region electron/main.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
var dockWindow = null;
var captureWindow = null;
var workspaceWindow = null;
var tray = null;
var isQuitting = false;
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
var DATA_FILE_PATH = path.join(app.getPath("userData"), "context-resume-storage.json");
function readStorageFile() {
	try {
		if (fs.existsSync(DATA_FILE_PATH)) {
			const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8");
			const parsed = JSON.parse(raw);
			return parsed && typeof parsed === "object" ? parsed : {};
		}
	} catch (err) {
		console.error("Failed to read storage file:", err);
	}
	return {};
}
function writeStorageFile(data) {
	try {
		fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
		return true;
	} catch (err) {
		console.error("Failed to write storage file:", err);
		return false;
	}
}
function getDockPosition(width, height) {
	const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
	const saved = readStorageFile().dockPosition;
	const hasSavedPosition = saved && Number.isFinite(saved.x) && Number.isFinite(saved.y);
	const maxX = area.x + Math.max(0, area.width - width - 12);
	const maxY = area.y + Math.max(0, area.height - height - 12);
	return {
		x: Math.max(area.x + 12, Math.min(hasSavedPosition ? saved.x : maxX, maxX)),
		y: Math.max(area.y + 12, Math.min(hasSavedPosition ? saved.y : maxY, maxY))
	};
}
function keepWindowOnScreen(win) {
	if (win.isDestroyed()) return;
	const bounds = win.getBounds();
	const area = screen.getDisplayMatching(bounds).workArea;
	const maxX = area.x + Math.max(0, area.width - bounds.width);
	const maxY = area.y + Math.max(0, area.height - bounds.height);
	const x = Math.max(area.x, Math.min(bounds.x, maxX));
	const y = Math.max(area.y, Math.min(bounds.y, maxY));
	if (x !== bounds.x || y !== bounds.y) win.setPosition(x, y);
}
function saveDockPosition() {
	if (!dockWindow || dockWindow.isDestroyed()) return;
	const [x, y] = dockWindow.getPosition();
	const current = readStorageFile();
	current.dockPosition = {
		x,
		y
	};
	writeStorageFile(current);
}
function createDockWindow() {
	if (dockWindow && !dockWindow.isDestroyed()) {
		dockWindow.show();
		dockWindow.focus();
		return;
	}
	const dockWidth = 330;
	const dockHeight = 105;
	const { x, y } = getDockPosition(dockWidth, dockHeight);
	dockWindow = new BrowserWindow({
		width: dockWidth,
		height: dockHeight,
		x,
		y,
		frame: false,
		transparent: true,
		alwaysOnTop: true,
		skipTaskbar: true,
		resizable: false,
		hasShadow: true,
		backgroundColor: "#00000000",
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true
		}
	});
	dockWindow.setMenuBarVisibility(false);
	dockWindow.setAlwaysOnTop(true, "screen-saver");
	const url = VITE_DEV_SERVER_URL ? `${VITE_DEV_SERVER_URL}#dock` : `file://${path.join(process.env.DIST, "index.html")}#dock`;
	dockWindow.loadURL(url);
	dockWindow.on("closed", () => {
		dockWindow = null;
	});
	dockWindow.on("moved", saveDockPosition);
}
function createQuickCaptureWindow(mode = "quick-capture") {
	if (captureWindow && !captureWindow.isDestroyed()) {
		captureWindow.show();
		captureWindow.focus();
		captureWindow.webContents.send("hotkey:triggered", mode);
		return;
	}
	const { width: screenWidth, height: screenHeight, x: displayX, y: displayY } = screen.getPrimaryDisplay().workArea;
	const captureWidth = 440;
	const captureHeight = mode === "pause-checkpoint" ? 220 : 180;
	const x = displayX + Math.round((screenWidth - captureWidth) / 2);
	const y = displayY + Math.round(screenHeight * .24);
	captureWindow = new BrowserWindow({
		width: captureWidth,
		height: captureHeight,
		x,
		y,
		frame: false,
		transparent: true,
		alwaysOnTop: true,
		skipTaskbar: true,
		resizable: false,
		hasShadow: true,
		backgroundColor: "#00000000",
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true
		}
	});
	captureWindow.setMenuBarVisibility(false);
	captureWindow.setAlwaysOnTop(true, "screen-saver");
	const url = VITE_DEV_SERVER_URL ? `${VITE_DEV_SERVER_URL}#capture` : `file://${path.join(process.env.DIST, "index.html")}#capture`;
	captureWindow.loadURL(url);
	captureWindow.webContents.on("did-finish-load", () => {
		captureWindow?.webContents.send("hotkey:triggered", mode);
	});
	captureWindow.on("blur", () => {
		if (captureWindow && !captureWindow.isDestroyed()) captureWindow.hide();
	});
	captureWindow.on("closed", () => {
		captureWindow = null;
	});
}
function createWorkspaceWindow(showImmediately = false) {
	if (workspaceWindow && !workspaceWindow.isDestroyed()) {
		workspaceWindow.show();
		workspaceWindow.focus();
		return;
	}
	workspaceWindow = new BrowserWindow({
		width: 1080,
		height: 700,
		minWidth: 480,
		minHeight: 500,
		frame: false,
		transparent: true,
		backgroundColor: "#00000000",
		hasShadow: true,
		show: showImmediately,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true
		}
	});
	workspaceWindow.setMenuBarVisibility(false);
	const url = VITE_DEV_SERVER_URL ? `${VITE_DEV_SERVER_URL}#workspace` : `file://${path.join(process.env.DIST, "index.html")}#workspace`;
	workspaceWindow.loadURL(url);
	workspaceWindow.on("close", (e) => {
		if (!isQuitting) {
			e.preventDefault();
			workspaceWindow?.hide();
		}
	});
	workspaceWindow.on("closed", () => {
		workspaceWindow = null;
	});
}
function setupTray() {
	const icon = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#22d3ee"/><text x="16" y="22" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#0f172a">N</text></svg>`).toString("base64")}`);
	tray = new Tray(icon);
	const contextMenu = Menu.buildFromTemplate([
		{
			label: "Context Resume (Ghi chú & Mạch)",
			enabled: false
		},
		{ type: "separator" },
		{
			label: "⚡ Quick Note (Ctrl+Alt+Space)",
			click: () => {
				createQuickCaptureWindow("quick-capture");
			}
		},
		{
			label: "⏸ Lưu Checkpoint (Ctrl+Alt+P)",
			click: () => {
				createQuickCaptureWindow("pause-checkpoint");
			}
		},
		{
			label: "📌 Mini Dock Nổi (Dock)",
			click: () => {
				if (dockWindow && !dockWindow.isDestroyed()) {
					if (dockWindow.isVisible()) dockWindow.hide();
					else dockWindow.show();
				} else createDockWindow();
			}
		},
		{
			label: "📝 Mở Workspace Ghi Chú",
			click: () => {
				if (workspaceWindow && !workspaceWindow.isDestroyed()) {
					workspaceWindow.show();
					workspaceWindow.focus();
				} else createWorkspaceWindow(true);
			}
		},
		{ type: "separator" },
		{
			label: "Thoát ứng dụng",
			click: () => {
				isQuitting = true;
				app.quit();
			}
		}
	]);
	tray.setToolTip("Context Resume - Ghi chú thông minh & Khôi phục ngữ cảnh tức thì");
	tray.setContextMenu(contextMenu);
	tray.on("click", () => {
		if (dockWindow && !dockWindow.isDestroyed()) {
			dockWindow.show();
			dockWindow.focus();
		} else createDockWindow();
	});
}
function registerGlobalShortcuts() {
	globalShortcut.register("CommandOrControl+Alt+Space", () => {
		createQuickCaptureWindow("quick-capture");
	});
	globalShortcut.register("CommandOrControl+Alt+P", () => {
		createQuickCaptureWindow("pause-checkpoint");
	});
	globalShortcut.register("CommandOrControl+Alt+D", () => {
		if (dockWindow && !dockWindow.isDestroyed()) {
			if (dockWindow.isVisible()) dockWindow.hide();
			else dockWindow.show();
		} else createDockWindow();
	});
	globalShortcut.register("CommandOrControl+Alt+W", () => {
		if (workspaceWindow && !workspaceWindow.isDestroyed()) {
			if (workspaceWindow.isVisible()) workspaceWindow.hide();
			else {
				workspaceWindow.show();
				workspaceWindow.focus();
			}
		} else createWorkspaceWindow(true);
	});
	globalShortcut.register("CommandOrControl+Alt+R", () => {
		BrowserWindow.getAllWindows().forEach((win) => {
			win.webContents.send("hotkey:triggered", "quick-resume");
		});
	});
}
app.whenReady().then(() => {
	createDockWindow();
	createWorkspaceWindow(false);
	setupTray();
	registerGlobalShortcuts();
	const keepDockVisible = () => {
		if (dockWindow && !dockWindow.isDestroyed()) keepWindowOnScreen(dockWindow);
	};
	screen.on("display-metrics-changed", keepDockVisible);
	screen.on("display-removed", keepDockVisible);
	app.on("activate", () => {
		if (dockWindow === null) createDockWindow();
	});
});
app.on("will-quit", () => {
	isQuitting = true;
	globalShortcut.unregisterAll();
});
app.on("window-all-closed", () => {});
ipcMain.on("window:minimize", (event) => {
	BrowserWindow.fromWebContents(event.sender)?.minimize();
});
ipcMain.on("window:maximize", (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	if (win?.isMaximized()) win.unmaximize();
	else win?.maximize();
});
ipcMain.on("window:close", (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	if (win === workspaceWindow) win.hide();
	else win?.close();
});
ipcMain.on("window:hide", (event) => {
	BrowserWindow.fromWebContents(event.sender)?.hide();
});
ipcMain.on("window:set-always-on-top", (event, flag) => {
	BrowserWindow.fromWebContents(event.sender)?.setAlwaysOnTop(flag, "screen-saver");
});
ipcMain.on("window:set-opacity", (event, opacity) => {
	BrowserWindow.fromWebContents(event.sender)?.setOpacity(Math.max(.2, Math.min(1, opacity)));
});
ipcMain.on("window:set-ignore-mouse-events", (event, ignore, forward) => {
	BrowserWindow.fromWebContents(event.sender)?.setIgnoreMouseEvents(ignore, { forward: forward ?? true });
});
ipcMain.on("window:open-quick-capture", () => {
	createQuickCaptureWindow();
});
ipcMain.on("window:close-quick-capture", () => {
	if (captureWindow && !captureWindow.isDestroyed()) captureWindow.hide();
});
ipcMain.on("window:resize-quick-capture", (_event, width, height) => {
	if (captureWindow && !captureWindow.isDestroyed()) {
		const safeWidth = Number.isFinite(width) ? Math.max(320, Math.min(640, Math.round(width))) : 400;
		const safeHeight = Number.isFinite(height) ? Math.max(120, Math.min(480, Math.round(height))) : 155;
		captureWindow.setSize(safeWidth, safeHeight);
	}
});
ipcMain.on("window:open-workspace", () => {
	if (workspaceWindow && !workspaceWindow.isDestroyed()) {
		workspaceWindow.show();
		workspaceWindow.focus();
	} else createWorkspaceWindow(true);
});
ipcMain.on("window:hide-workspace", () => {
	workspaceWindow?.hide();
});
ipcMain.on("window:toggle-workspace", () => {
	if (workspaceWindow && !workspaceWindow.isDestroyed()) {
		if (workspaceWindow.isVisible()) workspaceWindow.hide();
		else {
			workspaceWindow.show();
			workspaceWindow.focus();
		}
	} else createWorkspaceWindow(true);
});
ipcMain.on("window:open-dock", () => {
	createDockWindow();
});
ipcMain.on("window:hide-dock", () => {
	dockWindow?.hide();
});
ipcMain.on("window:resize-dock", (_event, width, height) => {
	if (dockWindow && !dockWindow.isDestroyed()) {
		const safeWidth = Number.isFinite(width) ? Math.max(50, Math.min(640, Math.round(width))) : 320;
		const safeHeight = Number.isFinite(height) ? Math.max(50, Math.min(480, Math.round(height))) : 100;
		dockWindow.setSize(safeWidth, safeHeight);
		keepWindowOnScreen(dockWindow);
		saveDockPosition();
	}
});
ipcMain.on("data:broadcast-sync", (_event, data) => {
	BrowserWindow.getAllWindows().forEach((win) => {
		win.webContents.send("data:sync", data);
	});
});
ipcMain.handle("storage:save", (_event, key, data) => {
	const current = readStorageFile();
	current[key] = data;
	return writeStorageFile(current);
});
ipcMain.handle("storage:load", (_event, key) => {
	return readStorageFile()[key] ?? null;
});
//#endregion
export {};
