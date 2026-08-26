export type TaskStatus = 'active' | 'paused' | 'blocked' | 'completed' | 'archived'

export type StepStatus = 'done' | 'current' | 'next' | 'blocked' | 'later'

export interface Step {
  id: string
  taskId: string
  label: string
  status: StepStatus
  order: number
  note?: string
  completedAt?: number
}

export interface Checkpoint {
  id: string
  taskId: string
  stepId?: string
  lastCompleted?: string
  nextAction: string
  blocker?: string
  context?: string
  createdAt: number
}

export interface Task {
  id: string
  title: string
  status: TaskStatus
  colorTag?: string
  steps: Step[]
  checkpoints: Checkpoint[]
  createdAt: number
  lastPausedAt?: number
  lastResumedAt?: number
  completedAt?: number
}

export type AppViewMode = 'workspace' | 'dock' | 'spotlight'

export interface DockSettings {
  compact: boolean
  bubbleMode: boolean
  position: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  opacity: number
  alwaysOnTop: boolean
  clickThrough: boolean
}

export interface HotkeySettings {
  quickCapture: string
  pauseCheckpoint: string
  toggleDock: string
  toggleWorkspace: string
  quickResume: string
}

export interface ElectronAPI {
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  hideWindow: () => void
  setAlwaysOnTop: (flag: boolean) => void
  setOpacity: (opacity: number) => void
  setIgnoreMouseEvents: (ignore: boolean, forward?: boolean) => void

  openQuickCapture: () => void
  closeQuickCapture: () => void
  resizeQuickCapture: (width: number, height: number) => void

  openWorkspace: () => void
  hideWorkspace: () => void
  toggleWorkspace: () => void

  openDock: () => void
  hideDock: () => void
  resizeDock: (width: number, height: number) => void

  saveLocalData: (key: string, data: any) => Promise<boolean>
  loadLocalData: (key: string) => Promise<any>

  onGlobalHotkeyTriggered: (callback: (action: string) => void) => () => void
  onDataSync: (callback: (data: any) => void) => () => void
  broadcastDataSync: (data: any) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
