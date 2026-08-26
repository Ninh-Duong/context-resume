export type NoteType = 'note' | 'context'

export type ContextStatus = 'active' | 'paused' | 'completed' | 'archived'

export type StepStatus = 'done' | 'current' | 'next' | 'blocked' | 'later'

export interface Step {
  id: string
  label: string
  status: StepStatus
  order: number
  note?: string
  completedAt?: number
}

export interface Checkpoint {
  id: string
  lastCompleted?: string
  nextAction: string
  blocker?: string
  context?: string
  createdAt: number
}

export interface ContextData {
  status: ContextStatus
  steps: Step[]
  checkpoints: Checkpoint[]
  currentStepId?: string
  lastPausedAt?: number
  lastResumedAt?: number
  completedAt?: number
}

export interface Note {
  id: string
  title: string
  content: string
  type: NoteType
  tags: string[]
  pinned: boolean
  archived: boolean
  inInbox: boolean
  colorTag?: string
  createdAt: number
  updatedAt: number
  context?: ContextData
}

export type SidebarFilter =
  | 'inbox'
  | 'all'
  | 'pinned'
  | 'active_context'
  | 'archived'
  | { tag: string }

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

