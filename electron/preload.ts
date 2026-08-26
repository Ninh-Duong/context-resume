import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use IPC
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
  
  // Navigation / Window switching
  openQuickCapture: () => ipcRenderer.send('window:open-quick-capture'),
  openWorkspace: () => ipcRenderer.send('window:open-workspace'),
  openDock: () => ipcRenderer.send('window:open-dock'),
  resizeWindow: (width: number, height: number) => ipcRenderer.send('window:resize', width, height),
  
  // Storage & System
  saveLocalData: (key: string, data: any) => ipcRenderer.invoke('storage:save', key, data),
  loadLocalData: (key: string) => ipcRenderer.invoke('storage:load', key),
  
  // Events from main process
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
