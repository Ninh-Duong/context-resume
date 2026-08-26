import React, { useState, useEffect, useRef } from 'react'
import { useResumeStore } from '../store/useResumeStore'
import {
  Sparkles,
  AlertTriangle,
  X,
  Layers,
  ArrowRight,
  Inbox,
  CheckCircle2,
} from 'lucide-react'

export const QuickCaptureModal: React.FC = () => {
  const {
    isQuickCaptureOpen,
    quickCaptureMode,
    setQuickCaptureOpen,
    setQuickCaptureMode,
    getActiveContextNote,
    pauseActiveContext,
    createNote,
  } = useResumeStore()

  const activeContext = getActiveContextNote()
  const quickInputRef = useRef<HTMLInputElement>(null)
  const checkpointNextRef = useRef<HTMLInputElement>(null)

  const activeTab = quickCaptureMode || 'note'
  const [quickText, setQuickText] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [lastCompleted, setLastCompleted] = useState('')
  const [blocker, setBlocker] = useState('')
  const [newContextTitle, setNewContextTitle] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [savedToast, setSavedToast] = useState(false)

  const isDedicatedCaptureWindow = window.location.hash === '#capture'

  // Focus on open
  useEffect(() => {
    if (!isQuickCaptureOpen && !isDedicatedCaptureWindow) return

    const focusTimer = window.setTimeout(() => {
      if (activeTab === 'note') {
        quickInputRef.current?.focus()
      } else {
        checkpointNextRef.current?.focus()
      }
    }, 50)

    // Resize dedicated electron window
    if (isDedicatedCaptureWindow) {
      const height = activeTab === 'note' ? 180 : showAdvanced ? 320 : 220
      window.electronAPI?.resizeQuickCapture?.(440, height)
    }

    return () => window.clearTimeout(focusTimer)
  }, [isQuickCaptureOpen, activeTab, isDedicatedCaptureWindow, showAdvanced])

  const handleClose = () => {
    setQuickCaptureOpen(false)
    setQuickText('')
    setNextAction('')
    setLastCompleted('')
    setBlocker('')
    setNewContextTitle('')
    setShowAdvanced(false)
    setSavedToast(false)
    window.electronAPI?.closeQuickCapture?.()
  }

  const handleSwitchTab = (tab: 'note' | 'checkpoint') => {
    setQuickCaptureMode(tab)
  }

  const handleSaveQuickNote = () => {
    if (!quickText.trim()) return

    createNote({
      title: quickText.trim(),
      content: '',
      inInbox: true,
      type: 'note',
    })

    setSavedToast(true)
    setQuickText('')
    window.setTimeout(() => {
      handleClose()
    }, 450)
  }

  const handleSaveCheckpoint = () => {
    if (!nextAction.trim() && !newContextTitle.trim()) return

    if (activeContext) {
      pauseActiveContext(
        {
          nextAction: nextAction.trim() || 'Tiếp tục công việc',
          lastCompleted: lastCompleted.trim() || undefined,
          blocker: blocker.trim() || undefined,
        },
        newContextTitle.trim() || undefined
      )
    } else if (newContextTitle.trim() || nextAction.trim()) {
      createNote({
        title: newContextTitle.trim() || nextAction.trim(),
        type: 'context',
        steps: nextAction.trim() ? [nextAction.trim()] : undefined,
      })
    }

    handleClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (activeTab === 'note') {
        handleSaveQuickNote()
      } else {
        handleSaveCheckpoint()
      }
    }
  }

  if (!isQuickCaptureOpen && !isDedicatedCaptureWindow) return null

  return (
    <div
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Quick Capture"
      className="w-full select-none text-slate-100 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="glass-panel rounded-2xl overflow-hidden ring-1 ring-cyan-400/20 p-4 space-y-3 shadow-2xl">
        {/* Top Header & Tab Switcher */}
        <div className="drag-region flex items-center justify-between cursor-move">
          <div className="no-drag flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleSwitchTab('note')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'note'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Inbox size={13} />
              Quick Note (Inbox)
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('checkpoint')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'checkpoint'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={13} />
              Lưu Checkpoint
            </button>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="no-drag p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            title="Đóng (Esc)"
            aria-label="Đóng"
          >
            <X size={15} />
          </button>
        </div>

        {/* TAB 1: QUICK NOTE (INBOX) */}
        {activeTab === 'note' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                <Inbox size={12} />
                Ghi chú nhanh vào Inbox:
              </label>
              <input
                ref={quickInputRef}
                type="text"
                placeholder="VD: Gọi điện cho khách hàng lúc 3h chiều..."
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/50 text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 shadow-inner"
              />
            </div>

            {savedToast && (
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 size={14} />
                Đã lưu thành công vào Inbox!
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-500">
                Không làm gián đoạn công việc đang làm.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-2.5 py-1 hover:bg-slate-800 text-slate-400 text-xs rounded-lg"
                >
                  Hủy (Esc)
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickNote}
                  disabled={!quickText.trim()}
                  className="px-3.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-cyan-500/20"
                >
                  Lưu vào Inbox [Enter]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHECKPOINT RESUME */}
        {activeTab === 'checkpoint' && (
          <div className="space-y-3">
            {activeContext ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="truncate">Context: {activeContext.title}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Chưa có Context nào đang chạy. Tạo Checkpoint sẽ mở Context mới.
              </p>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                <ArrowRight size={12} />
                Việc tiếp theo tôi sẽ làm (Next Action):
              </label>
              <input
                ref={checkpointNextRef}
                type="text"
                placeholder="VD: Thêm filter customerId vào SQL query..."
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/50 text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 shadow-inner"
              />
            </div>

            {showAdvanced && (
              <div className="space-y-2 pt-1 border-t border-slate-800 text-xs animate-in fade-in duration-100">
                <div className="space-y-0.5">
                  <label className="text-[11px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-400" />
                    Vừa hoàn thành gì:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Đã tạo DTO và route..."
                    value={lastCompleted}
                    onChange={(e) => setLastCompleted(e.target.value)}
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                  />
                </div>

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
                    Chuyển sang Context mới ngay (Khẩn cấp):
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Fix lỗi deploy production..."
                    value={newContextTitle}
                    onChange={(e) => setNewContextTitle(e.target.value)}
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors font-medium"
              >
                <Layers size={12} />
                {showAdvanced ? '− Thu gọn' : '+ Thêm chi tiết'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-2.5 py-1 hover:bg-slate-800 text-slate-400 text-xs rounded-lg"
                >
                  Hủy (Esc)
                </button>
                <button
                  type="button"
                  onClick={handleSaveCheckpoint}
                  disabled={!nextAction.trim() && !newContextTitle.trim()}
                  className="px-3.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-amber-500/20"
                >
                  Lưu Checkpoint [Enter]
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
