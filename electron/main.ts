import { app, BrowserWindow, globalShortcut, ipcMain, screen, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let dockWindow: BrowserWindow | null = null
let captureWindow: BrowserWindow | null = null
let workspaceWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

const DATA_FILE_PATH = path.join(app.getPath('userData'), 'context-resume-storage.json')

function readStorageFile() {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8')
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    }
  } catch (err) {
    console.error('Failed to read storage file:', err)
  }
  return {}
}

function writeStorageFile(data: any) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('Failed to write storage file:', err)
    return false
  }
}

function getDockPosition(width: number, height: number) {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const area = display.workArea
  const saved = readStorageFile().dockPosition
  const hasSavedPosition = saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)
  const maxX = area.x + Math.max(0, area.width - width - 12)
  const maxY = area.y + Math.max(0, area.height - height - 12)

  return {
    x: Math.max(area.x + 12, Math.min(hasSavedPosition ? saved.x : maxX, maxX)),
    y: Math.max(area.y + 12, Math.min(hasSavedPosition ? saved.y : maxY, maxY)),
  }
}

function keepWindowOnScreen(win: BrowserWindow) {
  if (win.isDestroyed()) return

  const bounds = win.getBounds()
  const display = screen.getDisplayMatching(bounds)
  const area = display.workArea
  const maxX = area.x + Math.max(0, area.width - bounds.width)
  const maxY = area.y + Math.max(0, area.height - bounds.height)
  const x = Math.max(area.x, Math.min(bounds.x, maxX))
  const y = Math.max(area.y, Math.min(bounds.y, maxY))

  if (x !== bounds.x || y !== bounds.y) {
    win.setPosition(x, y)
  }
}

function saveDockPosition() {
  if (!dockWindow || dockWindow.isDestroyed()) return
  const [x, y] = dockWindow.getPosition()
  const current = readStorageFile()
  current.dockPosition = { x, y }
  writeStorageFile(current)
}

// 1. FLOATING MINI NOTE DOCK (320 x 95px Default, Always On Top)
function createDockWindow() {
  if (dockWindow && !dockWindow.isDestroyed()) {
    dockWindow.show()
    dockWindow.focus()
    return
  }

  const dockWidth = 320
  const dockHeight = 100
  const { x, y } = getDockPosition(dockWidth, dockHeight)

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
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  dockWindow.setMenuBarVisibility(false)
  dockWindow.setAlwaysOnTop(true, 'screen-saver')

  const url = VITE_DEV_SERVER_URL
    ? `${VITE_DEV_SERVER_URL}#dock`
    : `file://${path.join(process.env.DIST, 'index.html')}#dock`

  dockWindow.loadURL(url)

  dockWindow.on('closed', () => {
    dockWindow = null
  })
  dockWindow.on('moved', saveDockPosition)
}

// 2. QUICK CAPTURE SPOTLIGHT POPUP (400 x 150px)
function createQuickCaptureWindow() {
  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.show()
    captureWindow.focus()
    captureWindow.webContents.send('hotkey:triggered', 'quick-capture')
    return
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight, x: displayX, y: displayY } = primaryDisplay.workArea

  const captureWidth = 400
  const captureHeight = 155
  const x = displayX + Math.round((screenWidth - captureWidth) / 2)
  const y = displayY + Math.round(screenHeight * 0.24)

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
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  captureWindow.setMenuBarVisibility(false)
  captureWindow.setAlwaysOnTop(true, 'screen-saver')

  const url = VITE_DEV_SERVER_URL
    ? `${VITE_DEV_SERVER_URL}#capture`
    : `file://${path.join(process.env.DIST, 'index.html')}#capture`

  captureWindow.loadURL(url)

  captureWindow.on('blur', () => {
    if (captureWindow && !captureWindow.isDestroyed()) {
      captureWindow.hide()
    }
  })

  captureWindow.on('closed', () => {
    captureWindow = null
  })
}

// 3. WORKSPACE DASHBOARD (960 x 640px)
function createWorkspaceWindow(showImmediately = false) {
  if (workspaceWindow && !workspaceWindow.isDestroyed()) {
    workspaceWindow.show()
    workspaceWindow.focus()
    return
  }

  workspaceWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 360,
    minHeight: 460,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    show: showImmediately,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  workspaceWindow.setMenuBarVisibility(false)

  const url = VITE_DEV_SERVER_URL
    ? `${VITE_DEV_SERVER_URL}#workspace`
    : `file://${path.join(process.env.DIST, 'index.html')}#workspace`

  workspaceWindow.loadURL(url)

  workspaceWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      workspaceWindow?.hide()
    }
  })

  workspaceWindow.on('closed', () => {
    workspaceWindow = null
  })
}

// SYSTEM TRAY
function setupTray() {
  const traySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#22d3ee"/><text x="16" y="22" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#0f172a">M</text></svg>`
  const icon = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(traySvg).toString('base64')}`)
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Context Resume (Mạch)',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '⚡ Quick Capture (Ctrl+Alt+Space)',
      click: () => {
        createQuickCaptureWindow()
      },
    },
    {
      label: '📌 Note Nổi Mini (Dock)',
      click: () => {
        if (dockWindow && !dockWindow.isDestroyed()) {
          if (dockWindow.isVisible()) dockWindow.hide()
          else dockWindow.show()
        } else {
          createDockWindow()
        }
      },
    },
    {
      label: '🗺️ Mở Resume Map (Workspace)',
      click: () => {
        if (workspaceWindow && !workspaceWindow.isDestroyed()) {
          workspaceWindow.show()
          workspaceWindow.focus()
        } else {
          createWorkspaceWindow(true)
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Thoát ứng dụng',
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setToolTip('Context Resume - Khôi phục ngữ cảnh tức thì')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (dockWindow && !dockWindow.isDestroyed()) {
      dockWindow.show()
      dockWindow.focus()
    } else {
      createDockWindow()
    }
  })
}

// GLOBAL SHORTCUTS
function registerGlobalShortcuts() {
  globalShortcut.register('CommandOrControl+Alt+Space', () => {
    createQuickCaptureWindow()
  })

  globalShortcut.register('CommandOrControl+Alt+P', () => {
    createQuickCaptureWindow()
  })

  globalShortcut.register('CommandOrControl+Alt+D', () => {
    if (dockWindow && !dockWindow.isDestroyed()) {
      if (dockWindow.isVisible()) dockWindow.hide()
      else dockWindow.show()
    } else {
      createDockWindow()
    }
  })

  globalShortcut.register('CommandOrControl+Alt+W', () => {
    if (workspaceWindow && !workspaceWindow.isDestroyed()) {
      if (workspaceWindow.isVisible()) workspaceWindow.hide()
      else {
        workspaceWindow.show()
        workspaceWindow.focus()
      }
    } else {
      createWorkspaceWindow(true)
    }
  })

  globalShortcut.register('CommandOrControl+Alt+R', () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('hotkey:triggered', 'quick-resume')
    })
  })
}

app.whenReady().then(() => {
  createDockWindow()
  createWorkspaceWindow(false)
  setupTray()
  registerGlobalShortcuts()

  const keepDockVisible = () => {
    if (dockWindow && !dockWindow.isDestroyed()) keepWindowOnScreen(dockWindow)
  }
  screen.on('display-metrics-changed', keepDockVisible)
  screen.on('display-removed', keepDockVisible)

  app.on('activate', () => {
    if (dockWindow === null) createDockWindow()
  })
})

app.on('will-quit', () => {
  isQuitting = true
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  // Keep app running in tray
})

// IPC HANDLERS
ipcMain.on('window:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.minimize()
})

ipcMain.on('window:maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.on('window:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win === workspaceWindow) {
    win.hide()
  } else {
    win?.close()
  }
})

ipcMain.on('window:hide', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.hide()
})

ipcMain.on('window:set-always-on-top', (event, flag: boolean) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.setAlwaysOnTop(flag, 'screen-saver')
})

ipcMain.on('window:set-opacity', (event, opacity: number) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.setOpacity(Math.max(0.2, Math.min(1.0, opacity)))
})

ipcMain.on('window:set-ignore-mouse-events', (event, ignore: boolean, forward?: boolean) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.setIgnoreMouseEvents(ignore, { forward: forward ?? true })
})

ipcMain.on('window:open-quick-capture', () => {
  createQuickCaptureWindow()
})

ipcMain.on('window:close-quick-capture', () => {
  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.hide()
  }
})

ipcMain.on('window:resize-quick-capture', (_event, width: number, height: number) => {
  if (captureWindow && !captureWindow.isDestroyed()) {
    const safeWidth = Number.isFinite(width) ? Math.max(320, Math.min(640, Math.round(width))) : 400
    const safeHeight = Number.isFinite(height) ? Math.max(120, Math.min(480, Math.round(height))) : 155
    captureWindow.setSize(safeWidth, safeHeight)
  }
})

ipcMain.on('window:open-workspace', () => {
  if (workspaceWindow && !workspaceWindow.isDestroyed()) {
    workspaceWindow.show()
    workspaceWindow.focus()
  } else {
    createWorkspaceWindow(true)
  }
})

ipcMain.on('window:hide-workspace', () => {
  workspaceWindow?.hide()
})

ipcMain.on('window:toggle-workspace', () => {
  if (workspaceWindow && !workspaceWindow.isDestroyed()) {
    if (workspaceWindow.isVisible()) workspaceWindow.hide()
    else {
      workspaceWindow.show()
      workspaceWindow.focus()
    }
  } else {
    createWorkspaceWindow(true)
  }
})

ipcMain.on('window:open-dock', () => {
  createDockWindow()
})

ipcMain.on('window:hide-dock', () => {
  dockWindow?.hide()
})

ipcMain.on('window:resize-dock', (_event, width: number, height: number) => {
  if (dockWindow && !dockWindow.isDestroyed()) {
    const safeWidth = Number.isFinite(width) ? Math.max(50, Math.min(640, Math.round(width))) : 320
    const safeHeight = Number.isFinite(height) ? Math.max(50, Math.min(480, Math.round(height))) : 100
    dockWindow.setSize(safeWidth, safeHeight)
    keepWindowOnScreen(dockWindow)
    saveDockPosition()
  }
})

ipcMain.on('data:broadcast-sync', (_event, data) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('data:sync', data)
  })
})

ipcMain.handle('storage:save', (_event, key: string, data: any) => {
  const current = readStorageFile()
  current[key] = data
  return writeStorageFile(current)
})

ipcMain.handle('storage:load', (_event, key: string) => {
  const current = readStorageFile()
  return current[key] ?? null
})
