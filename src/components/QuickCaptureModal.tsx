import React, { useState, useEffect, useRef } from 'react'
import { useResumeStore } from '../store/useResumeStore'
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  Keyboard,
  Layers,
  FileText
} from 'lucide-react'

export const QuickCaptureModal: React.FC = () => {
  const {
    isQuickCaptureOpen,
    setQuickCaptureOpen,
    getActiveTask,
    pauseActiveTask,
    createTask,
    addStep,
  } = useResumeStore()

  const activeTask = getActiveTask()
  const nextInputRef = useRef<HTMLInputElement>(null)

  const [nextAction, setNextAction] = useState('')
  const [lastCompleted, setLastCompleted] = useState('')
  const [blocker, setBlocker] = useState('')
  const [contextNotes, setContextNotes] = useState('')
  const [newNextTaskTitle, setNewNextTaskTitle] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Auto-focus input on open and reset fields
  useEffect(() => {
    if (isQuickCaptureOpen) {
      // Prefill last completed from latest done step if available
      const lastDoneStep = activeTask?.steps
        .filter((s) => s.status === 'done')
        .slice(-1)[0]
      if (lastDoneStep) {
        setLastCompleted(lastDoneStep.label)
      } else {
        setLastCompleted('')
      }
      setNextAction('')
      setBlocker('')
      setContextNotes('')
      setNewNextTaskTitle('')
      setShowAdvanced(false)

      setTimeout(() => {
        nextInputRef.current?.focus()
      }, 50)
    }
  }, [isQuickCaptureOpen, activeTask])

  // Global key listener for ESC & Shortcuts within modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setQuickCaptureOpen(false)
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmitAndSwitch()
    } else if (e.key === 'Enter' && e.target === nextInputRef.current && !e.shiftKey) {
      e.preventDefault()
      handleQuickSave()
    }
  }

  const handleQuickSave = () => {
    if (!nextAction.trim() && !newNextTaskTitle.trim()) return

    if (activeTask) {
      if (nextAction.trim()) {
        // Add step to active task as well
        addStep(activeTask.id, nextAction.trim(), 'current')
      }
      pauseActiveTask(
        {
          nextAction: nextAction.trim() || 'Tiếp tục công việc',
          lastCompleted: lastCompleted.trim() || undefined,
          blocker: blocker.trim() || undefined,
          context: contextNotes.trim() || undefined,
        },
        newNextTaskTitle.trim() || undefined
      )
    } else if (newNextTaskTitle.trim() || nextAction.trim()) {
      createTask(newNextTaskTitle.trim() || nextAction.trim(), nextAction.trim() ? [nextAction.trim()] : undefined)
    }

    setQuickCaptureOpen(false)
  }

  const handleSubmitAndSwitch = () => {
    handleQuickSave()
  }

  if (!isQuickCaptureOpen) return null

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl mx-4 rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden ring-1 ring-cyan-500/30 text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/80">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Quick Capture Checkpoint
              </h2>
              <p className="text-[11px] text-slate-400">
                Lưu nhanh ngữ cảnh trong 5 giây để chuyển việc không lo quên
              </p>
            </div>
          </div>

          <button
            onClick={() => setQuickCaptureOpen(false)}
            className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-3.5">
          {/* Active Task Context Badge */}
          {activeTask ? (
            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300">
                  Task hiện tại
                </span>
                <span className="font-semibold text-slate-200 truncate">
                  {activeTask.title}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">
                {activeTask.steps.filter((s) => s.status === 'done').length}/{activeTask.steps.length} bước xong
              </span>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              <span>Chưa có Task nào đang chạy. Nhập tên Task mới hoặc hành động bên dưới:</span>
            </div>
          )}

          {/* Primary Field: NEXT ACTION (Mandatory Core) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
              <ArrowRight size={14} />
              Quay lại sẽ làm gì đầu tiên? (NEXT Action - Bắt buộc)
            </label>
            <input
              ref={nextInputRef}
              type="text"
              placeholder="VD: Thêm filter customerId vào SQL query builder..."
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/50 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-inner"
            />
          </div>

          {/* Progressive Disclosure Toggle */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <Layers size={13} />
              {showAdvanced ? '− Thu gọn tùy chọn chi tiết' : '+ Thêm Blocker / Đã xong / Chuyển sang Task mới'}
            </button>
            <span className="text-[11px] text-slate-500">
              Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Enter</kbd> để lưu
            </span>
          </div>

          {/* Expandable Fields */}
          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
              {/* Last completed */}
              <div className="space-y-1">
                <label className="text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  Vừa hoàn thành xong việc gì?
                </label>
                <input
                  type="text"
                  placeholder="VD: Đã tạo DTO và route API"
                  value={lastCompleted}
                  onChange={(e) => setLastCompleted(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                />
              </div>

              {/* Blocker */}
              <div className="space-y-1">
                <label className="text-slate-400 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-amber-400" />
                  Bị chặn / Chờ ai đó? (Blocker)
                </label>
                <input
                  type="text"
                  placeholder="VD: Chưa có sample response từ frontend..."
                  value={blocker}
                  onChange={(e) => setBlocker(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                />
              </div>

              {/* Switch to Task B */}
              <div className="space-y-1">
                <label className="text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-indigo-400" />
                  Chuyển sang làm việc đột xuất nào ngay? (Task B)
                </label>
                <input
                  type="text"
                  placeholder="VD: Fix gấp lỗi thanh toán cho KH VIP..."
                  value={newNextTaskTitle}
                  onChange={(e) => setNewNextTaskTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                />
              </div>

              {/* Context cues */}
              <div className="space-y-1">
                <label className="text-slate-400 flex items-center gap-1.5">
                  <FileText size={13} className="text-slate-400" />
                  Ghi chú ngữ cảnh (File, URL, note):
                </label>
                <input
                  type="text"
                  placeholder="VD: invoice.service.ts | Jira #342"
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Keyboard size={14} />
            <span><kbd className="bg-slate-700 px-1 rounded text-slate-200">Esc</kbd> Hủy</span>
            <span>•</span>
            <span><kbd className="bg-slate-700 px-1 rounded text-slate-200">Ctrl+Enter</kbd> Lưu & Chuyển Task</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuickCaptureOpen(false)}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleQuickSave}
              disabled={!nextAction.trim() && !newNextTaskTitle.trim()}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-semibold transition-colors shadow-lg shadow-cyan-500/20"
            >
              Lưu Checkpoint [Enter]
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
