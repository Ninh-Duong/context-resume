import { contextBridge, ipcRenderer } from 'electron'

// Expose protected IPC methods to Renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  hideWindow: () => ipcRenderer.send('window:hide'),
  setAlwaysOnTop: (flag: boolean) => ipcRenderer.send('window:set-always-on-top', flag),
  setOpacity: (opacity: number) => ipcRenderer.send('window:set-opacity', opacity),
  setIgnoreMouseEvents: (ignore: boolean, forward?: boolean) =>
    ipcRenderer.send('window:set-ignore-mouse-events', ignore, forward),

  // Multi-window management
  openQuickCapture: () => ipcRenderer.send('window:open-quick-capture'),
  closeQuickCapture: () => ipcRenderer.send('window:close-quick-capture'),
  resizeQuickCapture: (width: number, height: number) =>
    ipcRenderer.send('window:resize-quick-capture', width, height),

  openWorkspace: () => ipcRenderer.send('window:open-workspace'),
  hideWorkspace: () => ipcRenderer.send('window:hide-workspace'),
  toggleWorkspace: () => ipcRenderer.send('window:toggle-workspace'),

  openDock: () => ipcRenderer.send('window:open-dock'),
  hideDock: () => ipcRenderer.send('window:hide-dock'),
  resizeDock: (width: number, height: number) =>
    ipcRenderer.send('window:resize-dock', width, height),

  // Storage & System
  saveLocalData: (key: string, data: any) => ipcRenderer.invoke('storage:save', key, data),
  loadLocalData: (key: string) => ipcRenderer.invoke('storage:load', key),
  
  // Cross-window Event Sync
  onGlobalHotkeyTriggered: (callback: (action: string) => void) => {
    const handler = (_event: any, action: string) => callback(action)
    ipcRenderer.on('hotkey:triggered', handler)
    return () => ipcRenderer.removeListener('hotkey:triggered', handler)
  },
  onDataSync: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('data:sync', handler)
    return () => ipcRenderer.removeListener('data:sync', handler)
  },
  broadcastDataSync: (data: any) => ipcRenderer.send('data:broadcast-sync', data),
})
