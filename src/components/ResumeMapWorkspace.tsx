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
  Search,
  Sparkles,
  ArrowRight,
  Download,
  FolderOpen,
  ChevronLeft
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
  } = useResumeStore()

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(activeTaskId || tasks[0]?.id || null)
  const [search, setSearch] = useState('')
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskSteps, setNewTaskSteps] = useState('')
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editingStepText, setEditingStepText] = useState('')
  const [newStepInput, setNewStepInput] = useState('')
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('map')
  const [now] = useState(() => Date.now())

  React.useEffect(() => {
    if (activeTaskId) {
      setSelectedTaskId(activeTaskId)
    }
  }, [activeTaskId])

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0]

  const filteredTasks = tasks.filter((t) => {
    return (
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.steps.some((s) => s.label.toLowerCase().includes(search.toLowerCase()))
    )
  })

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setActiveTab('map')
  }

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
    setActiveTab('map')
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

  const handleOpenQuickCapture = () => {
    window.electronAPI?.openQuickCapture?.()
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
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return ''
    const diff = Math.floor((now - timestamp) / 1000)
    if (diff < 60) return 'Vừa xong'
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    return `${Math.floor(diff / 86400)} ngày trước`
  }

  const activeStep = selectedTask?.steps.find((s) => s.status === 'current') ||
    selectedTask?.steps.find((s) => s.status === 'next')

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* MOBILE TAB SWITCHER */}
      <div className="flex md:hidden items-center justify-around border-b border-slate-800 bg-slate-900 px-2 py-1.5 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
            activeTab === 'list' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
          }`}
        >
          Danh sách Task ({filteredTasks.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
            activeTab === 'map' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
          }`}
        >
          Sơ đồ Tiến trình
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* COMPACT SIDEBAR (240px) */}
        <div
          className={`w-full md:w-60 border-r border-slate-800/80 bg-slate-900/40 flex flex-col shrink-0 ${
            activeTab === 'list' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Search & Header */}
          <div className="p-3 border-b border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Tasks ({filteredTasks.length})
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingTask(true)}
                className="p-1 px-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus size={12} />
                Tạo
              </button>
            </div>

            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm task..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredTasks.map((t) => {
              const isSelected = selectedTask?.id === t.id
              const isActive = t.status === 'active'

              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleSelectTask(t.id)}
                  className={`w-full p-2.5 rounded-xl cursor-pointer text-left transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border border-cyan-500/40 shadow-sm'
                      : 'hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-cyan-400 animate-pulse'
                          : t.status === 'paused'
                          ? 'bg-amber-400'
                          : t.status === 'completed'
                          ? 'bg-emerald-400'
                          : 'bg-slate-500'
                      }`}
                    />
                    <h4 className="text-xs font-semibold text-slate-200 truncate flex-1">
                      {t.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pl-4">
                    <span>{t.status === 'active' ? 'Đang làm' : t.status === 'paused' ? 'Tạm dừng' : 'Đã xong'}</span>
                    <span>{t.steps.filter((s) => s.status === 'done').length}/{t.steps.length} xong</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* MAIN CANVAS: Clean, Large Typography & Structured Map */}
        <div
          className={`flex-1 flex flex-col bg-slate-950 overflow-y-auto ${
            activeTab === 'map' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedTask ? (
            <div className="p-5 sm:p-7 max-w-3xl mx-auto w-full space-y-6">
              {/* Back to list on mobile */}
              <div className="md:hidden">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 py-1"
                >
                  <ChevronLeft size={14} /> Danh sách tasks
                </button>
              </div>

              {/* Task Header Banner */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          selectedTask.status === 'active'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : selectedTask.status === 'paused'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {selectedTask.status === 'active' ? '● Đang làm' : selectedTask.status === 'paused' ? '↺ Tạm dừng' : '✓ Đã xong'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatRelativeTime(selectedTask.createdAt)}
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{selectedTask.title}</h1>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedTask.status !== 'active' ? (
                      <button
                        type="button"
                        onClick={() => switchActiveTask(selectedTask.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-colors"
                      >
                        <Play size={13} />
                        Tiếp tục Task
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenQuickCapture}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-amber-500/30"
                      >
                        <Pause size={13} />
                        Lưu Checkpoint
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleExportMarkdown}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                      title="Xuất Markdown"
                    >
                      <Download size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteTask(selectedTask.id)}
                      className="p-2 rounded-xl hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs transition-colors"
                      title="Xóa Task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Prominent NEXT Action Callout */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                    <Sparkles size={12} /> Bước tiếp theo (Next Action):
                  </span>
                  <p className="text-[15px] font-semibold text-slate-100">
                    {activeStep ? activeStep.label : 'Chưa có bước tiếp theo'}
                  </p>
                </div>
              </div>

              {/* CLEAN STRUCTURED STEP TIMELINE */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tiến trình ({selectedTask.steps.filter((s) => s.status === 'done').length}/{selectedTask.steps.length} bước)
                </h3>

                <div className="space-y-2">
                  {selectedTask.steps.map((step) => {
                    const isDone = step.status === 'done'
                    const isCurrent = step.status === 'current'
                    const isBlocked = step.status === 'blocked'

                    return (
                      <div
                        key={step.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl transition-all ${
                          isCurrent
                            ? 'bg-slate-900 border border-cyan-500/40 ring-1 ring-cyan-500/20'
                            : isDone
                            ? 'bg-slate-950/40 text-slate-500'
                            : isBlocked
                            ? 'bg-amber-950/20 border border-amber-500/30 text-amber-200'
                            : 'bg-slate-900/40 hover:bg-slate-900/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleStepComplete(selectedTask.id, step.id)}
                            className="shrink-0 transition-transform active:scale-95"
                            title="Đổi trạng thái"
                            aria-label={`Đánh dấu bước: ${step.label}`}
                          >
                            {isDone ? (
                              <CheckCircle2 size={20} className="text-emerald-400" />
                            ) : isCurrent ? (
                              <span className="flex h-4 w-4 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20" />
                            ) : isBlocked ? (
                              <AlertTriangle size={18} className="text-amber-400" />
                            ) : (
                              <span className="flex h-4 w-4 rounded-full border-2 border-slate-600 hover:border-cyan-400" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            {editingStepId === step.id ? (
                              <div className="flex items-center gap-2">
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
                                  type="button"
                                  onClick={() => handleSaveStepEdit(step.id)}
                                  className="px-2.5 py-1 bg-cyan-500 text-slate-950 text-xs rounded font-bold"
                                >
                                  Lưu
                                </button>
                              </div>
                            ) : (
                              <p className={`text-sm font-medium ${isDone ? 'line-through text-slate-500' : isCurrent ? 'text-slate-100 font-semibold' : 'text-slate-200'}`}>
                                {step.label}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <select
                            value={step.status}
                            onChange={(e) => updateStepStatus(selectedTask.id, step.id, e.target.value as StepStatus)}
                            className="bg-slate-800 text-slate-300 text-[10px] rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                          >
                            <option value="done">Xong</option>
                            <option value="current">Đang làm</option>
                            <option value="next">Tiếp theo</option>
                            <option value="blocked">Bị chặn</option>
                            <option value="later">Làm sau</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingStepId(step.id)
                              setEditingStepText(step.label)
                            }}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                            title="Sửa"
                            aria-label={`Sửa bước: ${step.label}`}
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteStep(selectedTask.id, step.id)}
                            className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded"
                            title="Xóa"
                            aria-label={`Xóa bước: ${step.label}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {/* Add Step Form */}
                  <form onSubmit={handleAddStepToCurrent} className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="+ Thêm bước tiếp theo vào sơ đồ..."
                      value={newStepInput}
                      onChange={(e) => setNewStepInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      disabled={!newStepInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold text-xs transition-colors"
                    >
                      Thêm bước
                    </button>
                  </form>
                </div>
              </div>

              {/* CHECKPOINT HISTORY */}
              {selectedTask.checkpoints.length > 0 && (
                <div className="pt-4 border-t border-slate-800/80 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Clock size={12} />
                    Lịch sử Checkpoint ({selectedTask.checkpoints.length})
                  </h3>
                  <div className="space-y-1.5">
                    {selectedTask.checkpoints.map((cp) => (
                      <div key={cp.id} className="p-2.5 rounded-xl bg-slate-900/40 text-xs flex items-center justify-between text-slate-300">
                        <div className="flex items-center gap-1.5 truncate">
                          <ArrowRight size={12} className="text-cyan-400 shrink-0" />
                          <span className="truncate">{cp.nextAction}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                          {formatRelativeTime(cp.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3 p-6">
              <FolderOpen size={36} className="text-slate-700" />
              <p className="text-sm">Chưa có task nào được chọn.</p>
              <button
                type="button"
                onClick={() => setIsCreatingTask(true)}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs transition-colors"
              >
                + Tạo Task Mới
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW TASK MODAL */}
      {isCreatingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Plus size={15} className="text-cyan-400" />
              Tạo Task Mới
            </h3>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Tên Task:
                </label>
                <input
                  type="text"
                  placeholder="VD: Invoice API – Customer Filter"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Các bước (Mỗi dòng một bước):</span>
                  <span className="text-[10px] text-slate-500">Tùy chọn</span>
                </label>
                <textarea
                  rows={4}
                  placeholder={`Tạo route API\nTạo DTO\nThêm filter customerId`}
                  value={newTaskSteps}
                  onChange={(e) => setNewTaskSteps(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 resize-none font-mono"
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
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
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
