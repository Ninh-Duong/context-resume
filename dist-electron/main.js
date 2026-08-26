import { BrowserWindow as e, Menu as t, Tray as n, app as r, globalShortcut as i, ipcMain as a, nativeImage as o, screen as s } from "electron";
import c from "path";
import l from "fs";
process.env.DIST = c.join(__dirname, "../dist"), process.env.VITE_PUBLIC = r.isPackaged ? process.env.DIST : c.join(process.env.DIST, "../public");
var u = null, d = null, f = process.env.VITE_DEV_SERVER_URL, p = c.join(r.getPath("userData"), "context-resume-storage.json");
function m() {
	try {
		if (l.existsSync(p)) {
			let e = l.readFileSync(p, "utf-8");
			return JSON.parse(e);
		}
	} catch (e) {
		console.error("Failed to read storage file:", e);
	}
	return {};
}
function h(e) {
	try {
		return l.writeFileSync(p, JSON.stringify(e, null, 2), "utf-8"), !0;
	} catch (e) {
		return console.error("Failed to write storage file:", e), !1;
	}
}
function g() {
	let { width: t, height: n } = s.getPrimaryDisplay().workAreaSize;
	u = new e({
		width: 1100,
		height: 720,
		minWidth: 320,
		minHeight: 180,
		frame: !1,
		transparent: !0,
		backgroundColor: "#00000000",
		hasShadow: !0,
		alwaysOnTop: !1,
		webPreferences: {
			preload: c.join(__dirname, "preload.js"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	}), u.setMenuBarVisibility(!1), f ? u.loadURL(f) : u.loadFile(c.join(process.env.DIST, "index.html")), u.on("closed", () => {
		u = null;
	});
}
function _() {
	let e = o.createEmpty();
	d = new n(e);
	let i = t.buildFromTemplate([
		{
			label: "Context Resume (Mạch)",
			enabled: !1
		},
		{ type: "separator" },
		{
			label: "⚡ Quick Capture (Ctrl+Alt+Space)",
			click: () => {
				u && (u.webContents.send("hotkey:triggered", "quick-capture"), u.show(), u.focus());
			}
		},
		{
			label: "📌 Floating Memory Dock (Ctrl+Alt+D)",
			click: () => {
				u && (u.webContents.send("hotkey:triggered", "toggle-dock"), u.show(), u.focus());
			}
		},
		{
			label: "🗺️ Resume Map Workspace (Ctrl+Alt+W)",
			click: () => {
				u && (u.webContents.send("hotkey:triggered", "toggle-workspace"), u.show(), u.focus());
			}
		},
		{ type: "separator" },
		{
			label: "Thoát ứng dụng",
			click: () => {
				r.quit();
			}
		}
	]);
	d.setToolTip("Context Resume - Khôi phục ngữ cảnh tức thì"), d.setContextMenu(i), d.on("click", () => {
		u && (u.isVisible() ? u.focus() : u.show());
	});
}
function v() {
	i.register("CommandOrControl+Alt+Space", () => {
		u && (u.webContents.send("hotkey:triggered", "quick-capture"), u.show(), u.focus());
	}), i.register("CommandOrControl+Alt+P", () => {
		u && (u.webContents.send("hotkey:triggered", "pause-checkpoint"), u.show(), u.focus());
	}), i.register("CommandOrControl+Alt+D", () => {
		u && (u.webContents.send("hotkey:triggered", "toggle-dock"), u.show(), u.focus());
	}), i.register("CommandOrControl+Alt+W", () => {
		u && (u.webContents.send("hotkey:triggered", "toggle-workspace"), u.show(), u.focus());
	}), i.register("CommandOrControl+Alt+R", () => {
		u && u.webContents.send("hotkey:triggered", "quick-resume");
	});
}
r.whenReady().then(() => {
	g(), _(), v(), r.on("activate", () => {
		e.getAllWindows().length === 0 && g();
	});
}), r.on("will-quit", () => {
	i.unregisterAll();
}), r.on("window-all-closed", () => {
	process.platform !== "darwin" && r.quit();
}), a.on("window:minimize", (t) => {
	e.fromWebContents(t.sender)?.minimize();
}), a.on("window:maximize", (t) => {
	let n = e.fromWebContents(t.sender);
	n?.isMaximized() ? n.unmaximize() : n?.maximize();
}), a.on("window:close", (t) => {
	e.fromWebContents(t.sender)?.close();
}), a.on("window:hide", (t) => {
	e.fromWebContents(t.sender)?.hide();
}), a.on("window:set-always-on-top", (t, n) => {
	e.fromWebContents(t.sender)?.setAlwaysOnTop(n, "screen-saver");
}), a.on("window:set-opacity", (t, n) => {
	e.fromWebContents(t.sender)?.setOpacity(Math.max(.2, Math.min(1, n)));
}), a.on("window:set-ignore-mouse-events", (t, n, r) => {
	e.fromWebContents(t.sender)?.setIgnoreMouseEvents(n, { forward: r ?? !0 });
}), a.on("window:resize", (t, n, r) => {
	let i = e.fromWebContents(t.sender);
	if (i) {
		let [e, t] = i.getSize();
		(e !== n || t !== r) && i.setSize(n, r);
	}
}), a.on("data:broadcast-sync", (t, n) => {
	e.getAllWindows().forEach((e) => {
		e.webContents.send("data:sync", n);
	});
}), a.handle("storage:save", (e, t, n) => {
	let r = m();
	return r[t] = n, h(r);
}), a.handle("storage:load", (e, t) => m()[t] ?? null);
//#endregion
export {};
