import { app, BrowserWindow, globalShortcut, ipcMain, screen, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let mainWindow: BrowserWindow | null = null
let captureWindow: BrowserWindow | null = null
let tray: Tray | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

const DATA_FILE_PATH = path.join(app.getPath('userData'), 'context-resume-storage.json')

// Helper to load & save persistence data
function readStorageFile() {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8')
      return JSON.parse(raw)
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

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 320,
    minHeight: 180,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  mainWindow.setMenuBarVisibility(false)

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(process.env.DIST, 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createQuickCaptureWindow() {
  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.show()
    captureWindow.focus()
    return
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  const captureWidth = 560
  const captureHeight = 340
  const x = Math.round((screenWidth - captureWidth) / 2)
  const y = Math.round(screenHeight * 0.22) // Top-center spotlight position

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

  const url = VITE_DEV_SERVER_URL
    ? `${VITE_DEV_SERVER_URL}#capture`
    : `file://${path.join(process.env.DIST, 'index.html')}#capture`

  captureWindow.loadURL(url)

  captureWindow.on('blur', () => {
    // Optional: auto-hide on blur if needed
  })

  captureWindow.on('closed', () => {
    captureWindow = null
  })
}

function setupTray() {
  // Create a clean 16x16 icon programmatically if file doesn't exist
  const icon = nativeImage.createEmpty()
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
        if (mainWindow) {
          mainWindow.webContents.send('hotkey:triggered', 'quick-capture')
          mainWindow.show()
          mainWindow.focus()
        }
      },
    },
    {
      label: '📌 Floating Memory Dock (Ctrl+Alt+D)',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('hotkey:triggered', 'toggle-dock')
          mainWindow.show()
          mainWindow.focus()
        }
      },
    },
    {
      label: '🗺️ Resume Map Workspace (Ctrl+Alt+W)',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('hotkey:triggered', 'toggle-workspace')
          mainWindow.show()
          mainWindow.focus()
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Thoát ứng dụng',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setToolTip('Context Resume - Khôi phục ngữ cảnh tức thì')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus()
      } else {
        mainWindow.show()
      }
    }
  })
}

function registerGlobalShortcuts() {
  // Ctrl+Alt+Space: Quick Capture
  globalShortcut.register('CommandOrControl+Alt+Space', () => {
    if (mainWindow) {
      mainWindow.webContents.send('hotkey:triggered', 'quick-capture')
      mainWindow.show()
      mainWindow.focus()
    }
  })

  // Ctrl+Alt+P: Quick Pause Checkpoint
  globalShortcut.register('CommandOrControl+Alt+P', () => {
    if (mainWindow) {
      mainWindow.webContents.send('hotkey:triggered', 'pause-checkpoint')
      mainWindow.show()
      mainWindow.focus()
    }
  })

  // Ctrl+Alt+D: Toggle Dock Mode
  globalShortcut.register('CommandOrControl+Alt+D', () => {
    if (mainWindow) {
      mainWindow.webContents.send('hotkey:triggered', 'toggle-dock')
      mainWindow.show()
      mainWindow.focus()
    }
  })

  // Ctrl+Alt+W: Toggle Full Workspace
  globalShortcut.register('CommandOrControl+Alt+W', () => {
    if (mainWindow) {
      mainWindow.webContents.send('hotkey:triggered', 'toggle-workspace')
      mainWindow.show()
      mainWindow.focus()
    }
  })

  // Ctrl+Alt+R: Quick Resume
  globalShortcut.register('CommandOrControl+Alt+R', () => {
    if (mainWindow) {
      mainWindow.webContents.send('hotkey:triggered', 'quick-resume')
    }
  })
}

app.whenReady().then(() => {
  createMainWindow()
  setupTray()
  registerGlobalShortcuts()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
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
  win?.close()
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

ipcMain.on('window:resize', (event, width: number, height: number) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    const [currentWidth, currentHeight] = win.getSize()
    if (currentWidth !== width || currentHeight !== height) {
      win.setSize(width, height)
    }
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
