import React, { useState } from 'react'
import { useResumeStore } from '../store/useResumeStore'
import type { StepStatus } from '../types'
import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Layers,
  Search,
  Sparkles,
  ArrowRight,
  Download,
  FolderOpen
} from 'lucide-react'

export const ResumeMapWorkspace: React.FC = () => {
  const {
    tasks,
    activeTaskId,
    switchActiveTask,
    deleteTask,
    addStep,
    updateStepStatus,
    toggleStepComplete,
    editStep,
    deleteStep,
    createTask,
    setQuickCaptureOpen,
  } = useResumeStore()

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(activeTaskId || tasks[0]?.id || null)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'blocked' | 'completed'>('all')
  const [search, setSearch] = useState('')
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskSteps, setNewTaskSteps] = useState('')
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editingStepText, setEditingStepText] = useState('')
  const [newStepInput, setNewStepInput] = useState('')

  // Sync selected task if activeTaskId changes
  React.useEffect(() => {
    if (activeTaskId) {
      setSelectedTaskId(activeTaskId)
    }
  }, [activeTaskId])

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0]

  // Filtered tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.steps.some((s) => s.label.toLowerCase().includes(search.toLowerCase()))
    
    if (!matchesSearch) return false
    if (filter === 'all') return true
    if (filter === 'active') return t.status === 'active'
    if (filter === 'paused') return t.status === 'paused'
    if (filter === 'blocked') return t.status === 'blocked' || t.steps.some((s) => s.status === 'blocked')
    if (filter === 'completed') return t.status === 'completed'
    return true
  })

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const initialSteps = newTaskSteps
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const createdId = createTask(newTaskTitle.trim(), initialSteps)
    setSelectedTaskId(createdId)
    setNewTaskTitle('')
    setNewTaskSteps('')
    setIsCreatingTask(false)
  }

  const handleAddStepToCurrent = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTask && newStepInput.trim()) {
      addStep(selectedTask.id, newStepInput.trim(), 'next')
      setNewStepInput('')
    }
  }

  const handleSaveStepEdit = (stepId: string) => {
    if (selectedTask && editingStepText.trim()) {
      editStep(selectedTask.id, stepId, editingStepText.trim())
      setEditingStepId(null)
    }
  }

  const handleExportMarkdown = () => {
    if (!selectedTask) return
    const md = `# ${selectedTask.title}\n\nTrạng thái: ${selectedTask.status.toUpperCase()}\n\n## Các bước tiến trình:\n` +
      selectedTask.steps.map((s) => `- [${s.status === 'done' ? 'x' : ' '}] (${s.status.toUpperCase()}) ${s.label}`).join('\n') +
      `\n\n## Lịch sử Checkpoint:\n` +
      selectedTask.checkpoints.map((cp) => `### ${new Date(cp.createdAt).toLocaleString()}\n- Vừa xong: ${cp.lastCompleted || 'N/A'}\n- Tiếp theo: ${cp.nextAction}\n- Blocker: ${cp.blocker || 'Không có'}\n`).join('\n')
    
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTask.title.replace(/\s+/g, '_')}_checkpoint.md`
    a.click()
  }

  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return ''
    const diff = Math.floor((Date.now() - timestamp) / 1000)
    if (diff < 60) return 'Vừa xong'
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    return `${Math.floor(diff / 86400)} ngày trước`
  }

  return (
    <div className="flex h-[calc(100vh-42px)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* LEFT SIDEBAR: Resume Stack */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/70 flex flex-col shrink-0">
        {/* Search & Filter Header */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers size={14} className="text-cyan-400" />
              Resume Stack
            </span>
            <button
              onClick={() => setIsCreatingTask(true)}
              className="p-1 px-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-1 transition-colors border border-cyan-500/30"
            >
              <Plus size={13} />
              Tạo Task
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm task, bước làm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
            {(['all', 'active', 'paused', 'blocked', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded-full capitalize whitespace-nowrap transition-colors ${
                  filter === f
                    ? 'bg-slate-700 text-cyan-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang làm' : f === 'paused' ? 'Tạm dừng' : f === 'blocked' ? 'Bị chặn' : 'Đã xong'}
              </button>
            ))}
          </div>
        </div>

        {/* Task List Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredTasks.map((t) => {
            const isSelected = selectedTask?.id === t.id
            const isActive = t.status === 'active'
            const currentStep = t.steps.find((s) => s.status === 'current') || t.steps.find((s) => s.status === 'next')

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTaskId(t.id)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/20'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5 truncate">
                    {isActive ? (
                      <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    ) : t.status === 'paused' ? (
                      <span className="flex h-2 w-2 rounded-full bg-amber-400" />
                    ) : t.status === 'completed' ? (
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                    ) : (
                      <span className="flex h-2 w-2 rounded-full bg-slate-500" />
                    )}
                    <h4 className="text-xs font-semibold text-slate-200 truncate">
                      {t.title}
                    </h4>
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : t.status === 'paused'
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : t.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                {/* Next Step Preview */}
                {currentStep && (
                  <p className="text-[11px] text-slate-400 line-clamp-1 pl-3.5 border-l border-slate-700/60 my-1">
                    → {currentStep.label}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 pt-1 border-t border-slate-800/60">
                  <span>
                    {t.status === 'paused' && t.lastPausedAt
                      ? `Dừng ${formatRelativeTime(t.lastPausedAt)}`
                      : t.status === 'active'
                      ? 'Đang hoạt động'
                      : formatRelativeTime(t.createdAt)}
                  </span>
                  <span>{t.steps.filter((s) => s.status === 'done').length}/{t.steps.length} bước</span>
                </div>
              </div>
            )
          })}

          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              Không tìm thấy task nào phù hợp.
            </div>
          )}
        </div>
      </div>

      {/* MAIN VIEW: Structured Resume Map */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
        {selectedTask ? (
          <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
            {/* Task Banner Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        selectedTask.status === 'active'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : selectedTask.status === 'paused'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {selectedTask.status === 'active'
                        ? '● Active (Đang làm)'
                        : selectedTask.status === 'paused'
                        ? '↺ Paused (Tạm dừng)'
                        : '✓ Completed (Đã xong)'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} /> Tạo {new Date(selectedTask.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-slate-100">{selectedTask.title}</h1>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {selectedTask.status !== 'active' ? (
                    <button
                      onClick={() => switchActiveTask(selectedTask.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-colors"
                    >
                      <Play size={13} />
                      Tiếp tục Task này (Resume)
                    </button>
                  ) : (
                    <button
                      onClick={() => setQuickCaptureOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-medium text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Pause size={13} />
                      Tạm dừng (Pause Checkpoint)
                    </button>
                  )}

                  <button
                    onClick={handleExportMarkdown}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    title="Xuất tệp Markdown"
                  >
                    <Download size={14} />
                  </button>

                  <button
                    onClick={() => deleteTask(selectedTask.id)}
                    className="p-2 rounded-xl hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs transition-colors"
                    title="Xóa Task"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Progress Summary Bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Tiến độ thực hiện ({selectedTask.steps.filter((s) => s.status === 'done').length}/{selectedTask.steps.length} bước)</span>
                  <span className="font-mono text-cyan-400 font-medium">
                    {selectedTask.steps.length > 0
                      ? Math.round(
                          (selectedTask.steps.filter((s) => s.status === 'done').length / selectedTask.steps.length) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                    style={{
                      width: `${
                        selectedTask.steps.length > 0
                          ? (selectedTask.steps.filter((s) => s.status === 'done').length / selectedTask.steps.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* STRUCTURED RESUME MAP (Tree Visualizer) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-cyan-400" />
                  Sơ đồ Khôi phục Ngữ cảnh (Resume Map)
                </h3>
                <span className="text-xs text-slate-500">Bấm icon để đổi trạng thái nhanh</span>
              </div>

              {/* Visual Tree Graph */}
              <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {selectedTask.steps.map((step) => {
                  const isDone = step.status === 'done'
                  const isCurrent = step.status === 'current'
                  const isNext = step.status === 'next'
                  const isBlocked = step.status === 'blocked'

                  return (
                    <div key={step.id} className="relative group">
                      {/* Branch connector line */}
                      <span className="absolute -left-3.5 top-5 w-3.5 h-0.5 bg-slate-800" />

                      {/* Node Card */}
                      <div
                        className={`p-3.5 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-cyan-950/40 border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                            : isDone
                            ? 'bg-slate-900/40 border-emerald-500/30 text-slate-400'
                            : isBlocked
                            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {/* Status Selector Icon Button */}
                            <button
                              onClick={() => toggleStepComplete(selectedTask.id, step.id)}
                              className="mt-0.5 shrink-0 transition-transform active:scale-90"
                              title="Chuyển trạng thái hoàn thành"
                            >
                              {isDone ? (
                                <CheckCircle2 size={18} className="text-emerald-400" />
                              ) : isCurrent ? (
                                <span className="flex h-4 w-4 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20" />
                              ) : isBlocked ? (
                                <AlertTriangle size={18} className="text-amber-400" />
                              ) : (
                                <span className="flex h-4 w-4 rounded-full border-2 border-slate-500 hover:border-cyan-400" />
                              )}
                            </button>

                            {/* Step Text / Edit Input */}
                            <div className="flex-1 min-w-0">
                              {editingStepId === step.id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingStepText}
                                    onChange={(e) => setEditingStepText(e.target.value)}
                                    className="flex-1 px-2.5 py-1 bg-slate-950 border border-cyan-500 rounded text-xs text-slate-100 focus:outline-none"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveStepEdit(step.id)
                                      if (e.key === 'Escape') setEditingStepId(null)
                                    }}
                                  />
                                  <button
                                    onClick={() => handleSaveStepEdit(step.id)}
                                    className="px-2 py-1 bg-cyan-500 text-slate-950 text-xs rounded font-medium"
                                  >
                                    Lưu
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span
                                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                        isDone
                                          ? 'bg-emerald-500/20 text-emerald-300'
                                          : isCurrent
                                          ? 'bg-cyan-500/20 text-cyan-300'
                                          : isBlocked
                                          ? 'bg-amber-500/20 text-amber-300'
                                          : isNext
                                          ? 'bg-indigo-500/20 text-indigo-300'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {isDone
                                        ? '✓ Done'
                                        : isCurrent
                                        ? '● CURRENT'
                                        : isBlocked
                                        ? '⚠ BLOCKED'
                                        : isNext
                                        ? '→ NEXT'
                                        : '○ Later'}
                                    </span>
                                    {step.completedAt && (
                                      <span className="text-[10px] text-slate-500">
                                        Xong lúc {new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </div>
                                  <p
                                    className={`text-sm font-medium ${
                                      isDone ? 'line-through text-slate-500' : isCurrent ? 'text-slate-100 font-semibold' : 'text-slate-200'
                                    }`}
                                  >
                                    {step.label}
                                  </p>
                                  {step.note && (
                                    <p className="text-xs text-amber-300/90 mt-1 italic">
                                      {step.note}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Step Controls */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Cycle Status Menu */}
                            <select
                              value={step.status}
                              onChange={(e) => updateStepStatus(selectedTask.id, step.id, e.target.value as StepStatus)}
                              className="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                            >
                              <option value="done">Done</option>
                              <option value="current">Current</option>
                              <option value="next">Next</option>
                              <option value="blocked">Blocked</option>
                              <option value="later">Later</option>
                            </select>

                            <button
                              onClick={() => {
                                setEditingStepId(step.id)
                                setEditingStepText(step.label)
                              }}
                              className="p-1 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded"
                              title="Sửa tên bước"
                            >
                              <Edit3 size={13} />
                            </button>

                            <button
                              onClick={() => deleteStep(selectedTask.id, step.id)}
                              className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded"
                              title="Xóa bước này"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Add Step Form */}
                <form onSubmit={handleAddStepToCurrent} className="relative pl-0 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="+ Thêm bước tiếp theo vào sơ đồ..."
                      value={newStepInput}
                      onChange={(e) => setNewStepInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      disabled={!newStepInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium text-xs transition-colors"
                    >
                      Thêm bước
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* CHECKPOINT HISTORY & CONTEXT CUES */}
            {selectedTask.checkpoints.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock size={13} className="text-cyan-400" />
                  Lịch sử Checkpoint đã lưu ({selectedTask.checkpoints.length})
                </h3>
                <div className="space-y-2">
                  {selectedTask.checkpoints.map((cp) => (
                    <div key={cp.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span>Lưu lúc {new Date(cp.createdAt).toLocaleString()}</span>
                        {cp.lastCompleted && <span className="text-emerald-400">✓ {cp.lastCompleted}</span>}
                      </div>
                      <div className="text-slate-200 font-medium flex items-start gap-1.5">
                        <ArrowRight size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                        <span>{cp.nextAction}</span>
                      </div>
                      {cp.blocker && (
                        <div className="text-amber-400 flex items-center gap-1 pt-1 text-[11px]">
                          <AlertTriangle size={11} /> {cp.blocker}
                        </div>
                      )}
                      {cp.context && (
                        <div className="text-slate-400 text-[11px]">
                          Ngữ cảnh: {cp.context}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3">
            <FolderOpen size={36} className="text-slate-700" />
            <p className="text-sm">Chưa có task nào được chọn.</p>
            <button
              onClick={() => setIsCreatingTask(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs transition-colors"
            >
              + Tạo Task Mới
            </button>
          </div>
        )}
      </div>

      {/* CREATE NEW TASK MODAL */}
      {isCreatingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Plus size={16} className="text-cyan-400" />
              Tạo Task & Chuỗi Bước Tiến Trình Mới
            </h3>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Tên Task (KEY gợi nhớ ngắn gọn):
                </label>
                <input
                  type="text"
                  placeholder="VD: Invoice API – Customer Filter"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Các bước thực hiện (Mỗi dòng một bước):</span>
                  <span className="text-[11px] text-slate-500">Tùy chọn</span>
                </label>
                <textarea
                  rows={4}
                  placeholder={`Tạo route\nTạo DTO\nThêm filter customerId\nViết test`}
                  value={newTaskSteps}
                  onChange={(e) => setNewTaskSteps(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingTask(false)}
                  className="px-3.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-semibold text-xs shadow-lg shadow-cyan-500/20"
                >
                  Bắt đầu Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
