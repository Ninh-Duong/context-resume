import React, { useState, useEffect, useRef } from 'react'
import { useResumeStore } from '../store/useResumeStore'
import {
  Sparkles,
  AlertTriangle,
  X,
  Layers,
  ArrowRight
} from 'lucide-react'

export const QuickCaptureModal: React.FC = () => {
  const {
    isQuickCaptureOpen,
    setQuickCaptureOpen,
    getActiveTask,
    pauseActiveTask,
    createTask,
  } = useResumeStore()

  const activeTask = getActiveTask()
  const nextInputRef = useRef<HTMLInputElement>(null)

  const [nextAction, setNextAction] = useState('')
  const [blocker, setBlocker] = useState('')
  const [newNextTaskTitle, setNewNextTaskTitle] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const isDedicatedCaptureWindow = window.location.hash === '#capture'

  // Focus input automatically on open
  useEffect(() => {
    if (!isQuickCaptureOpen && !isDedicatedCaptureWindow) return

    setNextAction('')
    setBlocker('')
    setNewNextTaskTitle('')
    setShowAdvanced(false)

    const focusTimer = window.setTimeout(() => {
      nextInputRef.current?.focus()
    }, 40)

    if (isDedicatedCaptureWindow) {
      window.electronAPI?.resizeQuickCapture?.(400, 155)
    }

    return () => window.clearTimeout(focusTimer)
  }, [isQuickCaptureOpen, activeTask?.id, isDedicatedCaptureWindow])

  const handleClose = () => {
    setQuickCaptureOpen(false)
    window.electronAPI?.closeQuickCapture?.()
  }

  const handleToggleAdvanced = () => {
    const nextState = !showAdvanced
    setShowAdvanced(nextState)
    if (nextState) {
      window.electronAPI?.resizeQuickCapture?.(400, 260)
    } else {
      window.electronAPI?.resizeQuickCapture?.(400, 155)
    }
  }

  // Keyboard navigation & Submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  const handleSave = () => {
    if (!nextAction.trim() && !newNextTaskTitle.trim()) return

    if (activeTask) {
      pauseActiveTask(
        {
          nextAction: nextAction.trim() || 'Tiếp tục công việc',
          blocker: blocker.trim() || undefined,
        },
        newNextTaskTitle.trim() || undefined
      )
    } else if (newNextTaskTitle.trim() || nextAction.trim()) {
      createTask(newNextTaskTitle.trim() || nextAction.trim(), nextAction.trim() ? [nextAction.trim()] : undefined)
    }

    handleClose()
  }

  if (!isQuickCaptureOpen && !isDedicatedCaptureWindow) return null

  return (
    <div
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Quick Capture checkpoint"
      className="w-full select-none text-slate-100 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="glass-panel rounded-2xl overflow-hidden ring-1 ring-cyan-400/20 p-3.5 space-y-2.5">
        {/* Header */}
        <div className="drag-region flex items-center justify-between cursor-move">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-bold text-slate-300 truncate">
              {activeTask ? `Lưu Checkpoint: ${activeTask.title}` : 'Quick Note Checkpoint'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="no-drag p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
            title="Đóng (Esc)"
            aria-label="Đóng Quick Capture"
          >
            <X size={14} />
          </button>
        </div>

        {/* Primary Input */}
        <div className="space-y-1">
          <label className="text-[12px] font-semibold text-cyan-400 flex items-center gap-1">
            <ArrowRight size={13} />
            Tôi sẽ tiếp tục:
          </label>
          <input
            ref={nextInputRef}
            type="text"
            placeholder="VD: Thêm filter customerId vào SQL query..."
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-cyan-500/50 text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 shadow-inner"
          />
        </div>

        {/* Expandable Advanced Options */}
        {showAdvanced && (
          <div className="space-y-2 pt-1 border-t border-slate-800 text-xs animate-in fade-in duration-100">
            <div className="space-y-0.5">
              <label className="text-[11px] text-slate-400 flex items-center gap-1">
                <AlertTriangle size={11} className="text-amber-400" />
                Bị chặn bởi (Blocker):
              </label>
              <input
                type="text"
                placeholder="VD: Chờ mock JSON từ Tuấn Frontend..."
                value={blocker}
                onChange={(e) => setBlocker(e.target.value)}
                className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
              />
            </div>

            <div className="space-y-0.5">
              <label className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles size={11} className="text-indigo-400" />
                Chuyển sang Task mới ngay (Task B):
              </label>
              <input
                type="text"
                placeholder="VD: Fix gấp lỗi thanh toán..."
                value={newNextTaskTitle}
                onChange={(e) => setNewNextTaskTitle(e.target.value)}
                className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
          <button
            type="button"
            onClick={handleToggleAdvanced}
            className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors font-medium"
          >
            <Layers size={12} />
            {showAdvanced ? '− Thu gọn' : '+ Thêm chi tiết'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px]">
              <kbd className="bg-slate-800 px-1 py-0.2 rounded text-slate-400">Esc</kbd> Hủy
            </span>
            <button
              type="button"
              onClick={handleSave}
              disabled={!nextAction.trim() && !newNextTaskTitle.trim()}
              className="px-3.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-cyan-500/20"
            >
              Lưu Checkpoint [Enter]
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
