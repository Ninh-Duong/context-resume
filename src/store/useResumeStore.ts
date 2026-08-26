import { create } from 'zustand'
import type {
  Note,
  NoteType,
  Step,
  Checkpoint,
  ContextData,
  SidebarFilter,
  StepStatus,
  DockSettings,
  HotkeySettings,
} from '../types'

interface ResumeStoreState {
  notes: Note[]
  selectedNoteId: string | null
  activeContextId: string | null
  sidebarFilter: SidebarFilter
  searchQuery: string
  isQuickCaptureOpen: boolean
  quickCaptureMode: 'note' | 'checkpoint'
  dockSettings: DockSettings
  hotkeySettings: HotkeySettings

  // Note Management
  createNote: (params?: {
    title?: string
    content?: string
    type?: NoteType
    tags?: string[]
    inInbox?: boolean
    steps?: string[]
  }) => string
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void
  deleteNote: (id: string) => void
  togglePin: (id: string) => void
  toggleArchive: (id: string) => void
  setNoteInbox: (id: string, inInbox: boolean) => void
  convertToContext: (id: string, initialSteps?: string[]) => void
  convertToNote: (id: string) => void
  selectNote: (id: string | null) => void
  setSidebarFilter: (filter: SidebarFilter) => void
  setSearchQuery: (query: string) => void

  // Context & Step Management
  activateContext: (noteId: string) => void
  pauseActiveContext: (
    checkpoint: { nextAction: string; lastCompleted?: string; blocker?: string; context?: string },
    startNewTitle?: string
  ) => void
  completeContext: (noteId: string) => void
  addStep: (noteId: string, label: string, status?: StepStatus) => void
  updateStepStatus: (noteId: string, stepId: string, status: StepStatus) => void
  toggleStepComplete: (noteId: string, stepId: string) => void
  editStep: (noteId: string, stepId: string, label: string, note?: string) => void
  deleteStep: (noteId: string, stepId: string) => void
  reorderSteps: (noteId: string, startIndex: number, endIndex: number) => void
  addCheckpoint: (
    noteId: string,
    checkpoint: { nextAction: string; lastCompleted?: string; blocker?: string; context?: string }
  ) => void

  // Selectors
  getActiveContextNote: () => Note | undefined
  getPausedContextNotes: () => Note[]
  getSuggestedResumeNote: () => Note | undefined
  getAllTags: () => string[]

  // Modal & Dock Controls
  setQuickCaptureOpen: (open: boolean, mode?: 'note' | 'checkpoint') => void
  setQuickCaptureMode: (mode: 'note' | 'checkpoint') => void
  updateDockSettings: (settings: Partial<DockSettings>) => void

  // Multi-window & Persistence
  syncFromRemote: (payload: { notes: Note[]; activeContextId: string | null; dockSettings?: DockSettings }) => void
  exportData: () => string
  importData: (jsonStr: string) => boolean
}

const STORAGE_V2_KEY = 'context_resume_data_v2'
const STORAGE_V1_KEY = 'context_resume_data_v1'
const SETTINGS_STORAGE_KEY = 'context_resume_settings_v2'

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

const initialSampleNotes: Note[] = [
  {
    id: 'note-sample-inbox-1',
    title: 'Ý tưởng tối ưu cache cho API Response',
    content: 'Có thể sử dụng Redis TTL 5 phút cho các endpoint thống kê dashboard để giảm tải DB Postgres.',
    type: 'note',
    tags: ['api', 'performance'],
    pinned: false,
    archived: false,
    inInbox: true,
    createdAt: Date.now() - 1000 * 60 * 20,
    updatedAt: Date.now() - 1000 * 60 * 20,
  },
  {
    id: 'note-sample-context-1',
    title: 'Invoice API – Customer Filter',
    content: 'Tính năng lọc hóa đơn theo customerId và date range cho đối tác Enterprise.',
    type: 'context',
    tags: ['work', 'backend'],
    pinned: true,
    archived: false,
    inInbox: false,
    colorTag: '#0ea5e9',
    createdAt: Date.now() - 1000 * 60 * 120,
    updatedAt: Date.now() - 1000 * 60 * 15,
    context: {
      status: 'active',
      lastResumedAt: Date.now() - 1000 * 60 * 15,
      checkpoints: [
        {
          id: 'cp-sample-1',
          lastCompleted: 'Tạo route API & DTO InvoiceFilterDto',
          nextAction: 'Thêm filter customerId vào SQL query builder',
          blocker: 'Chờ mock JSON từ Tuấn Frontend',
          context: 'src/services/invoice.service.ts',
          createdAt: Date.now() - 1000 * 60 * 30,
        },
      ],
      steps: [
        {
          id: 'step-sample-1',
          label: 'Tạo route API /api/invoices',
          status: 'done',
          order: 0,
          completedAt: Date.now() - 1000 * 60 * 90,
        },
        {
          id: 'step-sample-2',
          label: 'Tạo DTO InvoiceFilterDto',
          status: 'done',
          order: 1,
          completedAt: Date.now() - 1000 * 60 * 60,
        },
        {
          id: 'step-sample-3',
          label: 'Thêm filter customerId vào SQL query builder',
          status: 'current',
          order: 2,
        },
        {
          id: 'step-sample-4',
          label: 'Chờ frontend gửi sample response data',
          status: 'blocked',
          order: 3,
          note: 'Cần mock JSON từ Tuấn Frontend',
        },
        {
          id: 'step-sample-5',
          label: 'Viết Unit Test & bàn giao QA',
          status: 'later',
          order: 4,
        },
      ],
    },
  },
  {
    id: 'note-sample-pinned-1',
    title: 'Ghi chú Họp Sprint Planning tuần này',
    content: '1. Hoàn thiện migration Note-First cho Context Resume\n2. Review UI Dock & Spotlight Quick Capture\n3. Release v1.0.0',
    type: 'note',
    tags: ['meeting', 'planning'],
    pinned: true,
    archived: false,
    inInbox: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 2,
  },
]

function migrateV1ToV2(v1Tasks: any[]): Note[] {
  if (!Array.isArray(v1Tasks) || v1Tasks.length === 0) return []

  return v1Tasks.map((task, idx) => {
    const steps: Step[] = Array.isArray(task.steps)
      ? task.steps.map((s: any, sIdx: number) => ({
          id: s.id || `step-${Date.now()}-${sIdx}`,
          label: s.label || 'Bước công việc',
          status: (s.status as StepStatus) || 'later',
          order: typeof s.order === 'number' ? s.order : sIdx,
          note: s.note,
          completedAt: s.completedAt,
        }))
      : []

    const checkpoints: Checkpoint[] = Array.isArray(task.checkpoints)
      ? task.checkpoints.map((cp: any, cpIdx: number) => ({
          id: cp.id || `cp-${Date.now()}-${cpIdx}`,
          lastCompleted: cp.lastCompleted,
          nextAction: cp.nextAction || 'Tiếp tục công việc',
          blocker: cp.blocker,
          context: cp.context,
          createdAt: typeof cp.createdAt === 'number' ? cp.createdAt : Date.now(),
        }))
      : []

    const normalizedSteps = ensureCurrentStep(steps)

    const contextData: ContextData = {
      status: task.status === 'completed' ? 'completed' : task.status === 'paused' ? 'paused' : 'active',
      steps: normalizedSteps,
      checkpoints,
      lastPausedAt: task.lastPausedAt,
      lastResumedAt: task.lastResumedAt,
      completedAt: task.completedAt,
    }

    return {
      id: task.id || `note-migrated-${idx}-${Date.now()}`,
      title: task.title || 'Ghi chú công việc',
      content: '',
      type: 'context' as NoteType,
      tags: ['migrated'],
      pinned: false,
      archived: task.status === 'archived',
      inInbox: false,
      colorTag: task.colorTag || '#0ea5e9',
      createdAt: typeof task.createdAt === 'number' ? task.createdAt : Date.now(),
      updatedAt: Date.now(),
      context: contextData,
    }
  })
}

function loadInitialData(): { notes: Note[]; activeContextId: string | null; selectedNoteId: string | null } {
  try {
    // 1. Try to load V2 data
    const rawV2 = safeGetStorage(STORAGE_V2_KEY)
    if (rawV2) {
      const parsed = JSON.parse(rawV2)
      if (Array.isArray(parsed.notes) && parsed.notes.length > 0) {
        const notes = parsed.notes.map((n: Note) => {
          if (n.type === 'context' && n.context) {
            return {
              ...n,
              context: {
                ...n.context,
                steps: ensureCurrentStep(n.context.steps || []),
              },
            }
          }
          return n
        })

        const activeContext = notes.find((n: Note) => n.type === 'context' && n.context?.status === 'active')

        return {
          notes,
          activeContextId: parsed.activeContextId ?? activeContext?.id ?? null,
          selectedNoteId: parsed.selectedNoteId ?? notes[0]?.id ?? null,
        }
      }
    }

    // 2. Check for V1 data to migrate
    const rawV1 = safeGetStorage(STORAGE_V1_KEY)
    if (rawV1) {
      const parsedV1 = JSON.parse(rawV1)
      const tasks = Array.isArray(parsedV1) ? parsedV1 : parsedV1?.tasks
      if (Array.isArray(tasks) && tasks.length > 0) {
        const migratedNotes = migrateV1ToV2(tasks)
        const activeContext = migratedNotes.find((n) => n.context?.status === 'active')
        const activeId = activeContext?.id || null
        const selectedId = migratedNotes[0]?.id || null

        // Save migrated data to v2
        safeSetStorage(
          STORAGE_V2_KEY,
          JSON.stringify({ notes: migratedNotes, activeContextId: activeId, selectedNoteId: selectedId })
        )

        return {
          notes: migratedNotes,
          activeContextId: activeId,
          selectedNoteId: selectedId,
        }
      }
    }
  } catch (err) {
    console.error('Failed to load initial notes state:', err)
  }

  // 3. Fallback to Initial Sample Data
  const defaultActive = initialSampleNotes.find((n) => n.type === 'context' && n.context?.status === 'active')?.id || null
  return {
    notes: initialSampleNotes,
    activeContextId: defaultActive,
    selectedNoteId: initialSampleNotes[0].id,
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

const initialData = loadInitialData()

export const useResumeStore = create<ResumeStoreState>((set, get) => ({
  notes: initialData.notes,
  selectedNoteId: initialData.selectedNoteId,
  activeContextId: initialData.activeContextId,
  sidebarFilter: 'inbox',
  searchQuery: '',
  isQuickCaptureOpen: false,
  quickCaptureMode: 'note',
  dockSettings: loadInitialDockSettings(),

  hotkeySettings: {
    quickCapture: 'Ctrl+Alt+Space',
    pauseCheckpoint: 'Ctrl+Alt+P',
    toggleDock: 'Ctrl+Alt+D',
    toggleWorkspace: 'Ctrl+Alt+W',
    quickResume: 'Ctrl+Alt+R',
  },

  createNote: (params) => {
    const newId = `note-${Date.now()}`
    const isContext = params?.type === 'context' || (params?.steps && params.steps.length > 0)
    const type: NoteType = isContext ? 'context' : 'note'
    const now = Date.now()

    let contextData: ContextData | undefined
    if (isContext) {
      const steps: Step[] = (params?.steps || []).map((label, idx) => ({
        id: `step-${now}-${idx}`,
        label: label.trim(),
        status: idx === 0 ? 'current' : 'later',
        order: idx,
      }))

      contextData = {
        status: 'active',
        steps: ensureCurrentStep(steps),
        checkpoints: [],
        lastResumedAt: now,
      }
    }

    const newNote: Note = {
      id: newId,
      title: (params?.title || '').trim() || (isContext ? 'Context mới' : 'Ghi chú không tiêu đề'),
      content: params?.content || '',
      type,
      tags: params?.tags || [],
      pinned: false,
      archived: false,
      inInbox: params?.inInbox !== undefined ? params.inInbox : !isContext,
      colorTag: isContext ? '#0ea5e9' : undefined,
      createdAt: now,
      updatedAt: now,
      context: contextData,
    }

    set((state) => {
      // If new note is an active context, pause existing active context
      let updatedNotes = state.notes
      let nextActiveContextId = state.activeContextId

      if (isContext) {
        updatedNotes = updatedNotes.map((n) => {
          if (n.type === 'context' && n.context?.status === 'active') {
            return {
              ...n,
              context: {
                ...n.context,
                status: 'paused' as const,
                lastPausedAt: now,
              },
            }
          }
          return n
        })
        nextActiveContextId = newId
      }

      const finalNotes = [newNote, ...updatedNotes]
      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: finalNotes, activeContextId: nextActiveContextId, selectedNoteId: newId })
      )
      notifyCrossWindowSync({ notes: finalNotes, activeContextId: nextActiveContextId })

      return {
        notes: finalNotes,
        selectedNoteId: newId,
        activeContextId: nextActiveContextId,
      }
    })

    return newId
  },

  updateNote: (id, updates) => {
    set((state) => {
      const updatedNotes = state.notes.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            ...updates,
            updatedAt: Date.now(),
          }
        }
        return n
      })

      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: state.activeContextId, selectedNoteId: state.selectedNoteId })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: state.activeContextId })

      return { notes: updatedNotes }
    })
  },

  deleteNote: (id) => {
    set((state) => {
      const updatedNotes = state.notes.filter((n) => n.id !== id)
      let nextActiveContextId = state.activeContextId === id ? null : state.activeContextId
      let nextSelectedId = state.selectedNoteId === id ? updatedNotes[0]?.id || null : state.selectedNoteId

      // If active context was deleted, promote the most recently paused context
      if (state.activeContextId === id) {
        const pausedContext = updatedNotes
          .filter((n) => n.type === 'context' && n.context?.status === 'paused')
          .sort((a, b) => (b.context?.lastPausedAt || 0) - (a.context?.lastPausedAt || 0))[0]

        if (pausedContext && pausedContext.context) {
          nextActiveContextId = pausedContext.id
          const activatedNotes = updatedNotes.map((n) =>
            n.id === pausedContext.id
              ? {
                  ...n,
                  context: { ...n.context!, status: 'active' as const, lastResumedAt: Date.now() },
                }
              : n
          )
          safeSetStorage(
            STORAGE_V2_KEY,
            JSON.stringify({ notes: activatedNotes, activeContextId: nextActiveContextId, selectedNoteId: nextSelectedId })
          )
          notifyCrossWindowSync({ notes: activatedNotes, activeContextId: nextActiveContextId })
          return { notes: activatedNotes, activeContextId: nextActiveContextId, selectedNoteId: nextSelectedId }
        }
      }

      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: nextActiveContextId, selectedNoteId: nextSelectedId })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: nextActiveContextId })

      return { notes: updatedNotes, activeContextId: nextActiveContextId, selectedNoteId: nextSelectedId }
    })
  },

  togglePin: (id) => {
    set((state) => {
      const updatedNotes = state.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n))
      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: state.activeContextId, selectedNoteId: state.selectedNoteId })
      )
      return { notes: updatedNotes }
    })
  },

  toggleArchive: (id) => {
    set((state) => {
      const updatedNotes = state.notes.map((n) =>
        n.id === id ? { ...n, archived: !n.archived, inInbox: false, updatedAt: Date.now() } : n
      )
      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: state.activeContextId, selectedNoteId: state.selectedNoteId })
      )
      return { notes: updatedNotes }
    })
  },

  setNoteInbox: (id, inInbox) => {
    set((state) => {
      const updatedNotes = state.notes.map((n) => (n.id === id ? { ...n, inInbox, updatedAt: Date.now() } : n))
      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: state.activeContextId, selectedNoteId: state.selectedNoteId })
      )
      return { notes: updatedNotes }
    })
  },

  convertToContext: (id, initialSteps) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return

    const now = Date.now()
    const steps: Step[] = (initialSteps || ['Bắt đầu công việc']).map((label, idx) => ({
      id: `step-${now}-${idx}`,
      label: label.trim(),
      status: idx === 0 ? 'current' : 'later',
      order: idx,
    }))

    const contextData: ContextData = {
      status: 'active',
      steps: ensureCurrentStep(steps),
      checkpoints: [],
      lastResumedAt: now,
    }

    set((state) => {
      const updatedNotes = state.notes.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            type: 'context' as const,
            inInbox: false,
            colorTag: n.colorTag || '#0ea5e9',
            updatedAt: now,
            context: contextData,
          }
        }
        // Pause any other active context
        if (n.type === 'context' && n.context?.status === 'active') {
          return {
            ...n,
            context: {
              ...n.context,
              status: 'paused' as const,
              lastPausedAt: now,
            },
          }
        }
        return n
      })

      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: id, selectedNoteId: id })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: id })

      return {
        notes: updatedNotes,
        activeContextId: id,
        selectedNoteId: id,
      }
    })
  },

  convertToNote: (id) => {
    set((state) => {
      const updatedNotes = state.notes.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            type: 'note' as const,
            updatedAt: Date.now(),
          }
        }
        return n
      })

      const nextActiveId = state.activeContextId === id ? null : state.activeContextId
      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: nextActiveId, selectedNoteId: state.selectedNoteId })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: nextActiveId })

      return { notes: updatedNotes, activeContextId: nextActiveId }
    })
  },

  selectNote: (id) => set({ selectedNoteId: id }),
  setSidebarFilter: (filter) => set({ sidebarFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Context & Step Management
  activateContext: (noteId) => {
    set((state) => {
      const now = Date.now()
      const updatedNotes = state.notes.map((n) => {
        if (n.id === noteId && n.type === 'context' && n.context) {
          return {
            ...n,
            context: {
              ...n.context,
              status: 'active' as const,
              lastResumedAt: now,
            },
            updatedAt: now,
          }
        }
        if (n.type === 'context' && n.context?.status === 'active') {
          return {
            ...n,
            context: {
              ...n.context,
              status: 'paused' as const,
              lastPausedAt: now,
            },
          }
        }
        return n
      })

      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: noteId, selectedNoteId: noteId })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: noteId })

      return { notes: updatedNotes, activeContextId: noteId, selectedNoteId: noteId }
    })
  },

  pauseActiveContext: (checkpoint, startNewTitle) => {
    const { activeContextId, createNote } = get()
    if (!activeContextId) return

    const now = Date.now()
    set((state) => {
      const updatedNotes = state.notes.map((n) => {
        if (n.id === activeContextId && n.type === 'context' && n.context) {
          const newCp: Checkpoint = {
            id: `cp-${now}`,
            lastCompleted: checkpoint.lastCompleted,
            nextAction: checkpoint.nextAction,
            blocker: checkpoint.blocker,
            context: checkpoint.context,
            createdAt: now,
          }

          const currentStep = n.context.steps.find((s) => s.status === 'current')
          let updatedSteps = normalizeCurrentStep(n.context.steps, currentStep?.id)

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
          } else if (checkpoint.nextAction) {
            updatedSteps.push({
              id: `step-${now}`,
              label: checkpoint.nextAction,
              status: 'current',
              order: updatedSteps.length,
              note: checkpoint.blocker,
            })
          }

          return {
            ...n,
            updatedAt: now,
            context: {
              ...n.context,
              status: 'paused' as const,
              lastPausedAt: now,
              steps: updatedSteps,
              checkpoints: [newCp, ...n.context.checkpoints],
            },
          }
        }
        return n
      })

      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: null, selectedNoteId: state.selectedNoteId })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: null })

      return { notes: updatedNotes, activeContextId: null }
    })

    if (startNewTitle && startNewTitle.trim()) {
      createNote({ title: startNewTitle.trim(), type: 'context' })
    }
  },

  completeContext: (noteId) => {
    const now = Date.now()
    set((state) => {
      let nextActiveId: string | null = null
      const updatedNotes = state.notes.map((n) => {
        if (n.id === noteId && n.type === 'context' && n.context) {
          const finishedSteps = n.context.steps.map((s) =>
            s.status !== 'done' ? { ...s, status: 'done' as StepStatus, completedAt: now } : s
          )
          return {
            ...n,
            updatedAt: now,
            context: {
              ...n.context,
              status: 'completed' as const,
              completedAt: now,
              steps: finishedSteps,
            },
          }
        }
        return n
      })

      // Suggest the most recently paused context
      const pausedContexts = updatedNotes
        .filter((n) => n.id !== noteId && n.type === 'context' && n.context?.status === 'paused')
        .sort((a, b) => (b.context?.lastPausedAt || 0) - (a.context?.lastPausedAt || 0))

      if (pausedContexts.length > 0) {
        nextActiveId = pausedContexts[0].id
        const finalNotes = updatedNotes.map((n) =>
          n.id === nextActiveId && n.context
            ? { ...n, context: { ...n.context, status: 'active' as const, lastResumedAt: now } }
            : n
        )
        safeSetStorage(
          STORAGE_V2_KEY,
          JSON.stringify({ notes: finalNotes, activeContextId: nextActiveId, selectedNoteId: state.selectedNoteId })
        )
        notifyCrossWindowSync({ notes: finalNotes, activeContextId: nextActiveId })
        return { notes: finalNotes, activeContextId: nextActiveId }
      }

      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: null, selectedNoteId: state.selectedNoteId })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: null })
      return { notes: updatedNotes, activeContextId: null }
    })
  },

  addStep: (noteId, label, status = 'later') => {
    set((state) => {
      const updatedNotes = state.notes.map((n) => {
        if (n.id === noteId && n.type === 'context' && n.context) {
          const existingSteps = status === 'current'
            ? n.context.steps.map((s) => (s.status === 'current' ? { ...s, status: 'next' as StepStatus } : s))
            : n.context.steps

          const newStep: Step = {
            id: `step-${Date.now()}`,
            label: label.trim(),
            status,
            order: existingSteps.length,
          }

          return {
            ...n,
            updatedAt: Date.now(),
            context: {
              ...n.context,
              steps: [...existingSteps, newStep],
            },
          }
        }
        return n
      })

      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: state.activeContextId, selectedNoteId: state.selectedNoteId })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: state.activeContextId })
      return { notes: updatedNotes }
    })
  },

  updateStepStatus: (noteId, stepId, status) => {
    set((state) => {
      const updatedNotes = state.notes.map((n) => {
        if (n.id === noteId && n.type === 'context' && n.context) {
          const wasCurrent = n.context.steps.some((s) => s.id === stepId && s.status === 'current')
          const updatedSteps = n.context.steps.map((s) => {
            if (s.id === stepId) {
              return {
                ...s,
                status,
                completedAt: status === 'done' ? Date.now() : undefined,
              }
            }
            if (status === 'current' && s.status === 'current') {
              return { ...s, status: 'next' as StepStatus }
            }
            return s
          })

          const finalSteps = status === 'current'
            ? normalizeCurrentStep(updatedSteps, stepId)
            : ensureCurrentStep(updatedSteps, wasCurrent ? stepId : undefined)

          return {
            ...n,
            updatedAt: Date.now(),
            context: {
              ...n.context,
              steps: finalSteps,
            },
          }
        }
        return n
      })

      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: state.activeContextId, selectedNoteId: state.selectedNoteId })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: state.activeContextId })
      return { notes: updatedNotes }
    })
  },

  toggleStepComplete: (noteId, stepId) => {
    const note = get().notes.find((n) => n.id === noteId)
    const step = note?.context?.steps.find((s) => s.id === stepId)
    if (!step || !note?.context) return

    set((state) => {
      const updatedNotes = state.notes.map((n) => {
        if (n.id === noteId && n.context) {
          const isDoneNow = step.status !== 'done'
          let updatedSteps = n.context.steps.map((s) =>
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

          return {
            ...n,
            updatedAt: Date.now(),
            context: {
              ...n.context,
              steps: updatedSteps,
            },
          }
        }
        return n
      })

      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: state.activeContextId, selectedNoteId: state.selectedNoteId })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: state.activeContextId })
      return { notes: updatedNotes }
    })
  },

  editStep: (noteId, stepId, label, noteText) => {
    set((state) => {
      const updatedNotes = state.notes.map((n) => {
        if (n.id === noteId && n.context) {
          const updatedSteps = n.context.steps.map((s) =>
            s.id === stepId ? { ...s, label: label.trim(), note: noteText } : s
          )
          return {
            ...n,
            updatedAt: Date.now(),
            context: {
              ...n.context,
              steps: updatedSteps,
            },
          }
        }
        return n
      })

      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: state.activeContextId, selectedNoteId: state.selectedNoteId })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: state.activeContextId })
      return { notes: updatedNotes }
    })
  },

  deleteStep: (noteId, stepId) => {
    set((state) => {
      const updatedNotes = state.notes.map((n) => {
        if (n.id === noteId && n.context) {
          const deletedStep = n.context.steps.find((s) => s.id === stepId)
          const remainingSteps = n.context.steps.filter((s) => s.id !== stepId)
          return {
            ...n,
            updatedAt: Date.now(),
            context: {
              ...n.context,
              steps: deletedStep?.status === 'current' ? ensureCurrentStep(remainingSteps) : remainingSteps,
            },
          }
        }
        return n
      })

      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: state.activeContextId, selectedNoteId: state.selectedNoteId })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: state.activeContextId })
      return { notes: updatedNotes }
    })
  },

  reorderSteps: (noteId, startIndex, endIndex) => {
    set((state) => {
      const updatedNotes = state.notes.map((n) => {
        if (n.id === noteId && n.context) {
          const result = Array.from(n.context.steps)
          const [removed] = result.splice(startIndex, 1)
          result.splice(endIndex, 0, removed)
          const reordered = result.map((step, idx) => ({ ...step, order: idx }))
          return {
            ...n,
            updatedAt: Date.now(),
            context: {
              ...n.context,
              steps: reordered,
            },
          }
        }
        return n
      })

      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: state.activeContextId, selectedNoteId: state.selectedNoteId })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: state.activeContextId })
      return { notes: updatedNotes }
    })
  },

  addCheckpoint: (noteId, checkpoint) => {
    set((state) => {
      const now = Date.now()
      const updatedNotes = state.notes.map((n) => {
        if (n.id === noteId && n.type === 'context' && n.context) {
          const newCp: Checkpoint = {
            id: `cp-${now}`,
            lastCompleted: checkpoint.lastCompleted,
            nextAction: checkpoint.nextAction,
            blocker: checkpoint.blocker,
            context: checkpoint.context,
            createdAt: now,
          }
          return {
            ...n,
            updatedAt: now,
            context: {
              ...n.context,
              checkpoints: [newCp, ...n.context.checkpoints],
            },
          }
        }
        return n
      })

      safeSetStorage(
        STORAGE_V2_KEY,
        JSON.stringify({ notes: updatedNotes, activeContextId: state.activeContextId, selectedNoteId: state.selectedNoteId })
      )
      notifyCrossWindowSync({ notes: updatedNotes, activeContextId: state.activeContextId })
      return { notes: updatedNotes }
    })
  },

  // Selectors
  getActiveContextNote: () => {
    const { notes, activeContextId } = get()
    return notes.find((n) => n.id === activeContextId && n.type === 'context' && n.context?.status === 'active')
  },

  getPausedContextNotes: () => {
    const { notes } = get()
    return notes
      .filter((n) => n.type === 'context' && n.context?.status === 'paused')
      .sort((a, b) => (b.context?.lastPausedAt || 0) - (a.context?.lastPausedAt || 0))
  },

  getSuggestedResumeNote: () => {
    const paused = get().getPausedContextNotes()
    return paused.length > 0 ? paused[0] : undefined
  },

  getAllTags: () => {
    const { notes } = get()
    const tagSet = new Set<string>()
    notes.forEach((n) => {
      if (!n.archived) {
        n.tags.forEach((t) => tagSet.add(t.toLowerCase()))
      }
    })
    return Array.from(tagSet).sort()
  },

  // UI & Dock
  setQuickCaptureOpen: (open, mode = 'note') => set({ isQuickCaptureOpen: open, quickCaptureMode: mode }),
  setQuickCaptureMode: (mode) => set({ quickCaptureMode: mode }),

  updateDockSettings: (settings) =>
    set((state) => {
      const updated = { ...state.dockSettings, ...settings }
      safeSetStorage(SETTINGS_STORAGE_KEY, JSON.stringify(updated))
      notifyCrossWindowSync({ notes: state.notes, activeContextId: state.activeContextId, dockSettings: updated })
      return { dockSettings: updated }
    }),

  syncFromRemote: (payload) => {
    set((state) => ({
      notes: payload.notes ?? state.notes,
      activeContextId: payload.activeContextId !== undefined ? payload.activeContextId : state.activeContextId,
      dockSettings: payload.dockSettings ? { ...state.dockSettings, ...payload.dockSettings } : state.dockSettings,
    }))
  },

  exportData: () => {
    const { notes } = get()
    return JSON.stringify({ version: '2.0.0', exportedAt: Date.now(), notes }, null, 2)
  },

  importData: (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr)
      let notesToImport: Note[] = []

      if (parsed.version === '2.0.0' && Array.isArray(parsed.notes)) {
        notesToImport = parsed.notes
      } else if (Array.isArray(parsed)) {
        // Direct array of Notes or V1 Tasks
        if (parsed.length > 0 && ('type' in parsed[0] || 'inInbox' in parsed[0])) {
          notesToImport = parsed
        } else {
          notesToImport = migrateV1ToV2(parsed)
        }
      }

      if (notesToImport.length > 0) {
        const activeContext = notesToImport.find((n) => n.type === 'context' && n.context?.status === 'active')
        const activeId = activeContext?.id || null
        const selectedId = notesToImport[0].id

        set({ notes: notesToImport, activeContextId: activeId, selectedNoteId: selectedId })
        safeSetStorage(
          STORAGE_V2_KEY,
          JSON.stringify({ notes: notesToImport, activeContextId: activeId, selectedNoteId: selectedId })
        )
        notifyCrossWindowSync({ notes: notesToImport, activeContextId: activeId })
        return true
      }
    } catch (err) {
      console.error('Failed to import data:', err)
    }
    return false
  },
}))

