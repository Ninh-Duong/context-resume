import { create } from 'zustand'
import type { Task, Step, Checkpoint, AppViewMode, DockSettings, HotkeySettings, TaskStatus, StepStatus } from '../types'

interface ResumeStoreState {
  tasks: Task[]
  activeTaskId: string | null
  currentView: AppViewMode
  isQuickCaptureOpen: boolean
  searchQuery: string
  dockSettings: DockSettings
  hotkeySettings: HotkeySettings

  // Actions
  createTask: (title: string, stepLabels?: string[]) => string
  switchActiveTask: (taskId: string) => void
  pauseActiveTask: (checkpoint: { nextAction: string; lastCompleted?: string; blocker?: string; context?: string }, startNewTitle?: string) => void
  resumeTask: (taskId: string) => void
  completeTask: (taskId: string) => void
  deleteTask: (taskId: string) => void
  
  // Step Actions
  addStep: (taskId: string, label: string, status?: StepStatus) => void
  updateStepStatus: (taskId: string, stepId: string, status: StepStatus) => void
  toggleStepComplete: (taskId: string, stepId: string) => void
  editStep: (taskId: string, stepId: string, label: string, note?: string) => void
  deleteStep: (taskId: string, stepId: string) => void
  reorderSteps: (taskId: string, startIndex: number, endIndex: number) => void

  // Checkpoint & Resume Stack
  addCheckpoint: (taskId: string, checkpoint: Omit<Checkpoint, 'id' | 'taskId' | 'createdAt'>) => void
  getActiveTask: () => Task | undefined
  getPausedTasks: () => Task[]
  getSuggestedResumeTask: () => Task | undefined

  // View & UI controls
  setViewMode: (view: AppViewMode) => void
  setQuickCaptureOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  updateDockSettings: (settings: Partial<DockSettings>) => void
  
  // Cross-window Sync
  syncFromRemote: (payload: { tasks: Task[]; activeTaskId: string | null; dockSettings?: DockSettings }) => void

  // Data Export/Import
  exportData: () => string
  importData: (jsonStr: string) => boolean
}

const LOCAL_STORAGE_KEY = 'context_resume_data_v1'
const SETTINGS_STORAGE_KEY = 'context_resume_settings_v1'

const initialSampleTasks: Task[] = [
  {
    id: 'task-invoice-api',
    title: 'Invoice API – Customer Filter',
    status: 'active',
    colorTag: '#0ea5e9',
    createdAt: Date.now() - 3600 * 1000 * 2,
    lastResumedAt: Date.now() - 3600 * 1000,
    checkpoints: [
      {
        id: 'cp-1',
        taskId: 'task-invoice-api',
        lastCompleted: 'Tạo route & Tạo DTO',
        nextAction: 'Thêm filter customerId vào SQL query builder',
        blocker: 'Chờ mock JSON từ Tuấn Frontend',
        context: 'invoice.service.ts | API documentation',
        createdAt: Date.now() - 1800 * 1000,
      },
    ],
    steps: [
      {
        id: 'step-1',
        taskId: 'task-invoice-api',
        label: 'Tạo route API /api/invoices',
        status: 'done',
        order: 0,
        completedAt: Date.now() - 2500 * 1000,
      },
      {
        id: 'step-2',
        taskId: 'task-invoice-api',
        label: 'Tạo DTO InvoiceFilterDto',
        status: 'done',
        order: 1,
        completedAt: Date.now() - 2000 * 1000,
      },
      {
        id: 'step-3',
        taskId: 'task-invoice-api',
        label: 'Thêm filter customerId vào SQL query builder',
        status: 'current',
        order: 2,
      },
      {
        id: 'step-4',
        taskId: 'task-invoice-api',
        label: 'Chờ frontend gửi sample response data',
        status: 'blocked',
        order: 3,
        note: 'Blocker: Cần mock JSON từ Tuấn Frontend',
      },
      {
        id: 'step-5',
        taskId: 'task-invoice-api',
        label: 'Viết Unit Test & gửi QA',
        status: 'later',
        order: 4,
      },
    ],
  },
  {
    id: 'task-auth-fix',
    title: 'Fix lỗi Token Expire trên Mobile App',
    status: 'paused',
    colorTag: '#6366f1',
    createdAt: Date.now() - 3600 * 1000 * 5,
    lastPausedAt: Date.now() - 3600 * 1000 * 2,
    checkpoints: [
      {
        id: 'cp-2',
        taskId: 'task-auth-fix',
        lastCompleted: 'Kiểm tra log refresh token',
        nextAction: 'Tăng expire time của access token lên 15m & test lại',
        createdAt: Date.now() - 3600 * 1000 * 2,
      },
    ],
    steps: [
      {
        id: 'step-auth-1',
        taskId: 'task-auth-fix',
        label: 'Check Sentry logs tìm session bị ngắt quãng',
        status: 'done',
        order: 0,
      },
      {
        id: 'step-auth-2',
        taskId: 'task-auth-fix',
        label: 'Tăng expire time của access token lên 15m',
        status: 'next',
        order: 1,
      },
    ],
  },
]

// Safe LocalStorage helpers
function safeGetStorage(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key)
    }
  } catch {}
  return null
}

function safeSetStorage(key: string, value: string) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value)
    }
  } catch {}
}

function notifyCrossWindowSync(data: any) {
  try {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.broadcastDataSync) {
      ;(window as any).electronAPI.broadcastDataSync(data)
    }
  } catch {}
}

function loadInitialTasks(): { tasks: Task[]; activeTaskId: string | null } {
  try {
    const raw = safeGetStorage(LOCAL_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
        const normalizedTasks = parsed.tasks.map((task: Task) => ({
          ...task,
          steps: ensureCurrentStep(Array.isArray(task.steps) ? task.steps : []),
        }))
        return {
          tasks: normalizedTasks,
          activeTaskId: parsed.activeTaskId ?? normalizedTasks[0]?.id ?? null,
        }
      }
    }
  } catch (err) {
    console.error('Failed to load local storage state:', err)
  }
  return {
    tasks: initialSampleTasks,
    activeTaskId: 'task-invoice-api',
  }
}

function loadInitialDockSettings(): DockSettings {
  const defaultSettings: DockSettings = {
    compact: false,
    bubbleMode: false,
    position: 'bottom-right',
    opacity: 0.95,
    alwaysOnTop: true,
    clickThrough: false,
  }
  try {
    const raw = safeGetStorage(SETTINGS_STORAGE_KEY)
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) }
    }
  } catch {}
  return defaultSettings
}

function normalizeCurrentStep(steps: Step[], preferredStepId?: string): Step[] {
  let currentAssigned = false

  return steps.map((step) => {
    const shouldBeCurrent = preferredStepId
      ? step.id === preferredStepId
      : step.status === 'current'

    if (shouldBeCurrent && !currentAssigned) {
      currentAssigned = true
      return { ...step, status: 'current' as StepStatus }
    }

    if (step.status === 'current') {
      return { ...step, status: 'next' as StepStatus }
    }

    return step
  })
}

function ensureCurrentStep(steps: Step[], excludedStepId?: string): Step[] {
  const normalized = normalizeCurrentStep(steps)
  if (normalized.some((step) => step.status === 'current')) return normalized

  const candidate = normalized.find(
    (step) => step.id !== excludedStepId && (step.status === 'next' || step.status === 'later')
  )
  return candidate ? normalizeCurrentStep(normalized, candidate.id) : normalized
}

const initialData = loadInitialTasks()

export const useResumeStore = create<ResumeStoreState>((set, get) => ({
  tasks: initialData.tasks,
  activeTaskId: initialData.activeTaskId,
  currentView: 'workspace',
  isQuickCaptureOpen: false,
  searchQuery: '',
  dockSettings: loadInitialDockSettings(),

  hotkeySettings: {
    quickCapture: 'Ctrl+Alt+Space',
    pauseCheckpoint: 'Ctrl+Alt+P',
    toggleDock: 'Ctrl+Alt+D',
    toggleWorkspace: 'Ctrl+Alt+W',
    quickResume: 'Ctrl+Alt+R',
  },

  createTask: (title: string, stepLabels?: string[]) => {
    const newTaskId = `task-${Date.now()}`
    const steps: Step[] = (stepLabels || []).map((label, idx) => ({
      id: `step-${Date.now()}-${idx}`,
      taskId: newTaskId,
      label: label.trim(),
      status: idx === 0 ? 'current' : 'later',
      order: idx,
    }))

    const newTask: Task = {
      id: newTaskId,
      title: title.trim(),
      status: 'active',
      colorTag: '#0ea5e9',
      steps,
      checkpoints: [],
      createdAt: Date.now(),
      lastResumedAt: Date.now(),
    }

    set((state) => {
      // Pause any currently active task
      const updatedTasks = state.tasks.map((t) =>
        t.status === 'active' && t.id !== newTaskId
          ? { ...t, status: 'paused' as TaskStatus, lastPausedAt: Date.now() }
          : t
      )
      const finalTasks = [newTask, ...updatedTasks]
      safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: finalTasks, activeTaskId: newTaskId }))
      notifyCrossWindowSync({ tasks: finalTasks, activeTaskId: newTaskId })
      return {
        tasks: finalTasks,
        activeTaskId: newTaskId,
      }
    })

    return newTaskId
  },

  switchActiveTask: (taskId: string) => {
    set((state) => {
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, status: 'active' as TaskStatus, lastResumedAt: Date.now() }
        }
        if (t.status === 'active') {
          return { ...t, status: 'paused' as TaskStatus, lastPausedAt: Date.now() }
        }
        return t
      })
      safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: updatedTasks, activeTaskId: taskId }))
      notifyCrossWindowSync({ tasks: updatedTasks, activeTaskId: taskId })
      return { tasks: updatedTasks, activeTaskId: taskId }
    })
  },

  pauseActiveTask: (checkpoint, startNewTitle) => {
    const { activeTaskId, createTask } = get()
    if (!activeTaskId) return

    set((state) => {
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === activeTaskId) {
          const newCp: Checkpoint = {
            id: `cp-${Date.now()}`,
            taskId: t.id,
            lastCompleted: checkpoint.lastCompleted,
            nextAction: checkpoint.nextAction,
            blocker: checkpoint.blocker,
            context: checkpoint.context,
            createdAt: Date.now(),
          }

          // Keep one resumable step even if older data contains multiple current steps.
          const currentStep = t.steps.find((s) => s.status === 'current')
          let updatedSteps = normalizeCurrentStep(t.steps, currentStep?.id)

          if (currentStep) {
            updatedSteps = updatedSteps.map((s) =>
              s.id === currentStep.id
                ? {
                    ...s,
                    label: checkpoint.nextAction || s.label,
                    status: 'current' as StepStatus,
                    note: checkpoint.blocker || s.note,
                  }
                : s
            )
          }

          // If there was no current step, add the next action as the current step
          if (!currentStep && checkpoint.nextAction) {
            updatedSteps.push({
              id: `step-${Date.now()}`,
              taskId: t.id,
              label: checkpoint.nextAction,
              status: 'current',
              order: updatedSteps.length,
              note: checkpoint.blocker,
            })
          }

          return {
            ...t,
            status: 'paused' as TaskStatus,
            lastPausedAt: Date.now(),
            steps: updatedSteps,
            checkpoints: [newCp, ...t.checkpoints],
          }
        }
        return t
      })

      safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: updatedTasks, activeTaskId: null }))
      notifyCrossWindowSync({ tasks: updatedTasks, activeTaskId: null })
      return { tasks: updatedTasks, activeTaskId: null }
    })

    if (startNewTitle && startNewTitle.trim()) {
      createTask(startNewTitle)
    }
  },

  resumeTask: (taskId: string) => {
    get().switchActiveTask(taskId)
  },

  completeTask: (taskId: string) => {
    set((state) => {
      let nextActiveId: string | null = null
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          // Mark all unfinished steps as done
          const finishedSteps = t.steps.map((s) =>
            s.status !== 'done' ? { ...s, status: 'done' as StepStatus, completedAt: Date.now() } : s
          )
          return { ...t, status: 'completed' as TaskStatus, completedAt: Date.now(), steps: finishedSteps }
        }
        return t
      })

      // Suggest the most recently paused task
      const pausedTasks = updatedTasks
        .filter((t) => t.status === 'paused' && t.id !== taskId)
        .sort((a, b) => (b.lastPausedAt || 0) - (a.lastPausedAt || 0))

      if (pausedTasks.length > 0) {
        nextActiveId = pausedTasks[0].id
        const finalTasks = updatedTasks.map((t) =>
          t.id === nextActiveId ? { ...t, status: 'active' as TaskStatus, lastResumedAt: Date.now() } : t
        )
        safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: finalTasks, activeTaskId: nextActiveId }))
        notifyCrossWindowSync({ tasks: finalTasks, activeTaskId: nextActiveId })
        return { tasks: finalTasks, activeTaskId: nextActiveId }
      }

      safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: updatedTasks, activeTaskId: null }))
      notifyCrossWindowSync({ tasks: updatedTasks, activeTaskId: null })
      return { tasks: updatedTasks, activeTaskId: null }
    })
  },

  deleteTask: (taskId: string) => {
    set((state) => {
      const updatedTasks = state.tasks.filter((t) => t.id !== taskId)
      let nextActiveId = state.activeTaskId === taskId ? null : state.activeTaskId

      if (state.activeTaskId === taskId) {
        const nextTask = updatedTasks
          .filter((t) => t.status === 'paused')
          .sort((a, b) => (b.lastPausedAt || 0) - (a.lastPausedAt || 0))[0]

        if (nextTask) {
          nextActiveId = nextTask.id
          const resumedTasks = updatedTasks.map((t) =>
            t.id === nextTask.id ? { ...t, status: 'active' as TaskStatus, lastResumedAt: Date.now() } : t
          )
          safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: resumedTasks, activeTaskId: nextActiveId }))
          notifyCrossWindowSync({ tasks: resumedTasks, activeTaskId: nextActiveId })
          return { tasks: resumedTasks, activeTaskId: nextActiveId }
        }
      }

      safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: updatedTasks, activeTaskId: nextActiveId }))
      notifyCrossWindowSync({ tasks: updatedTasks, activeTaskId: nextActiveId })
      return { tasks: updatedTasks, activeTaskId: nextActiveId }
    })
  },

  addStep: (taskId: string, label: string, status: StepStatus = 'later') => {
    set((state) => {
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          // If adding a current step, reset any existing current step to next
          const existingSteps = status === 'current'
            ? t.steps.map((s) => (s.status === 'current' ? { ...s, status: 'next' as StepStatus } : s))
            : t.steps

          const newStep: Step = {
            id: `step-${Date.now()}`,
            taskId,
            label: label.trim(),
            status,
            order: existingSteps.length,
          }
          return { ...t, steps: [...existingSteps, newStep] }
        }
        return t
      })
      safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: updatedTasks, activeTaskId: state.activeTaskId }))
      notifyCrossWindowSync({ tasks: updatedTasks, activeTaskId: state.activeTaskId })
      return { tasks: updatedTasks }
    })
  },

  updateStepStatus: (taskId: string, stepId: string, status: StepStatus) => {
    set((state) => {
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          const wasCurrent = t.steps.some((s) => s.id === stepId && s.status === 'current')
          const updatedSteps = t.steps.map((s) => {
            if (s.id === stepId) {
              return {
                ...s,
                status,
                completedAt: status === 'done' ? Date.now() : undefined,
              }
            }
            // Enforce single-current constraint
            if (status === 'current' && s.status === 'current') {
              return { ...s, status: 'next' as StepStatus }
            }
            return s
          })
          return {
            ...t,
            steps: status === 'current'
              ? normalizeCurrentStep(updatedSteps, stepId)
              : ensureCurrentStep(updatedSteps, wasCurrent ? stepId : undefined),
          }
        }
        return t
      })
      safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: updatedTasks, activeTaskId: state.activeTaskId }))
      notifyCrossWindowSync({ tasks: updatedTasks, activeTaskId: state.activeTaskId })
      return { tasks: updatedTasks }
    })
  },

  toggleStepComplete: (taskId: string, stepId: string) => {
    const task = get().tasks.find((t) => t.id === taskId)
    const step = task?.steps.find((s) => s.id === stepId)
    if (!step) return

    set((state) => {
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          const isDoneNow = step.status !== 'done'
          let updatedSteps = t.steps.map((s) =>
            s.id === stepId
              ? {
                  ...s,
                  status: (isDoneNow ? 'done' : 'current') as StepStatus,
                  completedAt: isDoneNow ? Date.now() : undefined,
                }
              : s
          )

          updatedSteps = isDoneNow
            ? ensureCurrentStep(updatedSteps)
            : normalizeCurrentStep(updatedSteps, stepId)

          return { ...t, steps: updatedSteps }
        }
        return t
      })
      safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: updatedTasks, activeTaskId: state.activeTaskId }))
      notifyCrossWindowSync({ tasks: updatedTasks, activeTaskId: state.activeTaskId })
      return { tasks: updatedTasks }
    })
  },

  editStep: (taskId: string, stepId: string, label: string, note?: string) => {
    set((state) => {
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          const updatedSteps = t.steps.map((s) =>
            s.id === stepId ? { ...s, label: label.trim(), note } : s
          )
          return { ...t, steps: updatedSteps }
        }
        return t
      })
      safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: updatedTasks, activeTaskId: state.activeTaskId }))
      notifyCrossWindowSync({ tasks: updatedTasks, activeTaskId: state.activeTaskId })
      return { tasks: updatedTasks }
    })
  },

  deleteStep: (taskId: string, stepId: string) => {
    set((state) => {
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          const deletedStep = t.steps.find((s) => s.id === stepId)
          const remainingSteps = t.steps.filter((s) => s.id !== stepId)
          return {
            ...t,
            steps: deletedStep?.status === 'current' ? ensureCurrentStep(remainingSteps) : remainingSteps,
          }
        }
        return t
      })
      safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: updatedTasks, activeTaskId: state.activeTaskId }))
      notifyCrossWindowSync({ tasks: updatedTasks, activeTaskId: state.activeTaskId })
      return { tasks: updatedTasks }
    })
  },

  reorderSteps: (taskId: string, startIndex: number, endIndex: number) => {
    set((state) => {
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          const result = Array.from(t.steps)
          const [removed] = result.splice(startIndex, 1)
          result.splice(endIndex, 0, removed)
          const reordered = result.map((step, idx) => ({ ...step, order: idx }))
          return { ...t, steps: reordered }
        }
        return t
      })
      safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: updatedTasks, activeTaskId: state.activeTaskId }))
      notifyCrossWindowSync({ tasks: updatedTasks, activeTaskId: state.activeTaskId })
      return { tasks: updatedTasks }
    })
  },

  addCheckpoint: (taskId: string, checkpoint) => {
    set((state) => {
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          const newCp: Checkpoint = {
            id: `cp-${Date.now()}`,
            taskId,
            lastCompleted: checkpoint.lastCompleted,
            nextAction: checkpoint.nextAction,
            blocker: checkpoint.blocker,
            context: checkpoint.context,
            createdAt: Date.now(),
          }
          return { ...t, checkpoints: [newCp, ...t.checkpoints] }
        }
        return t
      })
      safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: updatedTasks, activeTaskId: state.activeTaskId }))
      notifyCrossWindowSync({ tasks: updatedTasks, activeTaskId: state.activeTaskId })
      return { tasks: updatedTasks }
    })
  },

  getActiveTask: () => {
    const { tasks, activeTaskId } = get()
    return tasks.find((t) => t.id === activeTaskId && t.status === 'active')
  },

  getPausedTasks: () => {
    const { tasks } = get()
    return tasks
      .filter((t) => t.status === 'paused')
      .sort((a, b) => (b.lastPausedAt || 0) - (a.lastPausedAt || 0))
  },

  getSuggestedResumeTask: () => {
    const paused = get().getPausedTasks()
    return paused.length > 0 ? paused[0] : undefined
  },

  setViewMode: (view: AppViewMode) => set({ currentView: view }),
  setQuickCaptureOpen: (open: boolean) => set({ isQuickCaptureOpen: open }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  
  updateDockSettings: (settings: Partial<DockSettings>) =>
    set((state) => {
      const updated = { ...state.dockSettings, ...settings }
      safeSetStorage(SETTINGS_STORAGE_KEY, JSON.stringify(updated))
      notifyCrossWindowSync({ tasks: state.tasks, activeTaskId: state.activeTaskId, dockSettings: updated })
      return { dockSettings: updated }
    }),

  syncFromRemote: (payload) => {
    set((state) => ({
      tasks: payload.tasks ?? state.tasks,
      activeTaskId: payload.activeTaskId !== undefined ? payload.activeTaskId : state.activeTaskId,
      dockSettings: payload.dockSettings ? { ...state.dockSettings, ...payload.dockSettings } : state.dockSettings,
    }))
  },

  exportData: () => {
    const { tasks } = get()
    return JSON.stringify(tasks, null, 2)
  },

  importData: (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr)
      if (Array.isArray(parsed)) {
        set({ tasks: parsed, activeTaskId: parsed[0]?.id || null })
        safeSetStorage(LOCAL_STORAGE_KEY, JSON.stringify({ tasks: parsed, activeTaskId: parsed[0]?.id || null }))
        notifyCrossWindowSync({ tasks: parsed, activeTaskId: parsed[0]?.id || null })
        return true
      }
    } catch (err) {
      console.error('Failed to import data:', err)
    }
    return false
  },
}))
