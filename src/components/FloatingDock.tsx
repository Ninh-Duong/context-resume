import React, { useState, useEffect } from 'react'
import { useResumeStore } from '../store/useResumeStore'
import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Pin,
  Minimize2,
  MoreHorizontal,
  Layout,
  Sliders
} from 'lucide-react'

export const FloatingDock: React.FC = () => {
  const {
    getActiveTask,
    getSuggestedResumeTask,
    resumeTask,
    toggleStepComplete,
    dockSettings,
    updateDockSettings,
  } = useResumeStore()

  const [showMenu, setShowMenu] = useState(false)

  const activeTask = getActiveTask()
  const suggestedResume = getSuggestedResumeTask()

  const currentStep = activeTask?.steps.find((s) => s.status === 'current')
  const nextStep = activeTask?.steps.find((s) => s.status === 'next')
  const activeAction = currentStep || nextStep || activeTask?.steps.find((s) => s.status !== 'done')
  const latestCheckpoint = activeTask?.checkpoints?.[0]

  const handleToggleMenu = () => {
    const nextOpen = !showMenu
    setShowMenu(nextOpen)
    window.electronAPI?.resizeDock?.(320, nextOpen ? 260 : 100)
  }

  // Resize window when toggling bubble mode
  const handleToggleBubbleMode = () => {
    const nextBubble = !dockSettings.bubbleMode
    updateDockSettings({ bubbleMode: nextBubble })
    setShowMenu(false)
    if (nextBubble) {
      window.electronAPI?.resizeDock?.(50, 50)
    } else {
      window.electronAPI?.resizeDock?.(320, 100)
    }
  }

  const handleAdvanceStep = () => {
    if (activeTask && activeAction) {
      toggleStepComplete(activeTask.id, activeAction.id)
    }
  }

  const handleOpenQuickCapture = () => {
    setShowMenu(false)
    window.electronAPI?.resizeDock?.(320, 100)
    window.electronAPI?.openQuickCapture?.()
  }

  const handleOpenWorkspace = () => {
    setShowMenu(false)
    window.electronAPI?.resizeDock?.(320, 100)
    window.electronAPI?.openWorkspace?.()
  }

  const handleTogglePin = () => {
    const nextPin = !dockSettings.alwaysOnTop
    updateDockSettings({ alwaysOnTop: nextPin })
    window.electronAPI?.setAlwaysOnTop?.(nextPin)
  }

  useEffect(() => {
    window.electronAPI?.setOpacity?.(dockSettings.opacity)
    window.electronAPI?.setAlwaysOnTop?.(dockSettings.alwaysOnTop)
  }, [dockSettings.opacity, dockSettings.alwaysOnTop])

  // ==========================================
  // 1. THU GỌN: MINI FLOATING BUBBLE (44-48px)
  // ==========================================
  if (dockSettings.bubbleMode) {
    return (
      <div
        onClick={handleToggleBubbleMode}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleToggleBubbleMode()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={activeTask ? `Mở note ${activeTask.title}` : 'Mở Context Resume note'}
        className="glass-panel drag-region group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl transition-all duration-150 hover:scale-105 hover:border-cyan-300"
        title={activeTask ? `Đang làm: ${activeTask.title} (Bấm để mở Note)` : 'Context Resume Note (Bấm để mở)'}
      >
        <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
        <span className="absolute flex h-3.5 w-3.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/60" />
      </div>
    )
  }

  // ==========================================
  // 2. MỞ RỘNG: DESKTOP MINI NOTE (320 x 95px)
  // ==========================================
  return (
    <div
      className="h-full w-full select-none text-slate-100 transition-all duration-150"
    >
      <div className="glass-panel h-full rounded-2xl overflow-hidden ring-1 ring-cyan-400/20 p-2.5 space-y-2">
        {/* TOP ROW: Task Name & Menu Button */}
        <div className="drag-region flex items-center justify-between gap-2 cursor-move">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <h3 className="text-[14px] font-bold text-slate-100 truncate tracking-tight">
              {activeTask ? activeTask.title : 'Chưa có Task'}
            </h3>
          </div>

          <div className="no-drag flex items-center gap-1 shrink-0 relative">
            <button
              type="button"
              onClick={handleToggleMenu}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
              title="Tùy chọn khác"
              aria-label="Options menu"
              aria-expanded={showMenu}
            >
              <MoreHorizontal size={15} />
            </button>

            {/* Menu Popover */}
            {showMenu && (
              <div className="absolute right-0 top-6 z-50 w-44 rounded-xl border border-slate-700 bg-slate-950 p-1.5 shadow-2xl text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={handleOpenWorkspace}
                  className="flex w-full items-center gap-2 px-2 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 text-left transition-colors"
                >
                  <Layout size={13} className="text-cyan-400" />
                  <span>Mở Sơ Đồ Chi Tiết</span>
                </button>

                <button
                  type="button"
                  onClick={handleTogglePin}
                  className="flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Pin size={13} className={dockSettings.alwaysOnTop ? 'text-cyan-400' : 'text-slate-400'} />
                    <span>Ghim Luôn Nổi</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{dockSettings.alwaysOnTop ? 'Bật' : 'Tắt'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleBubbleMode}
                  className="flex w-full items-center gap-2 px-2 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 text-left transition-colors"
                >
                  <Minimize2 size={13} className="text-indigo-400" />
                  <span>Thu Nhỏ Thành Bubble</span>
                </button>

                <div className="pt-1 border-t border-slate-800 px-2 py-1 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Sliders size={11} /> Độ mờ</span>
                    <span>{Math.round(dockSettings.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.05"
                    value={dockSettings.opacity}
                    onChange={(e) => updateDockSettings({ opacity: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer h-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE & ACTION ROW: Next Action & 2 Big Action Buttons */}
        {activeTask ? (
          <div className="flex items-center justify-between gap-2.5">
            {/* NEXT Action (High Contrast, Big Text) */}
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block leading-tight">
                Tiếp theo
              </span>
              <button
                type="button"
                className="block w-full text-left text-[13px] font-semibold text-slate-100 truncate leading-snug cursor-pointer hover:text-cyan-200"
                onClick={handleOpenQuickCapture}
                title={activeAction ? activeAction.label : 'Bấm để thêm bước'}
              >
                {activeAction ? activeAction.label : 'Bấm để thêm bước tiếp theo'}
              </button>

              {/* Blocker alert if present */}
              {latestCheckpoint?.blocker && (
                <div className="flex items-center gap-1 text-[11px] text-amber-300 truncate mt-0.5">
                  <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                  <span className="truncate">{latestCheckpoint.blocker}</span>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS (Fitts's Law Target >= 34px) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAdvanceStep}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-transform active:scale-95 shadow-sm"
                title="Hoàn thành bước này (✓)"
                aria-label="Complete step"
              >
                <CheckCircle2 size={18} />
              </button>

              <button
                type="button"
                onClick={handleOpenQuickCapture}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-transform active:scale-95 shadow-sm"
                title="Tạm dừng & Checkpoint (⏸)"
                aria-label="Pause and Checkpoint"
              >
                <Pause size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* Empty State or Resume Suggestion */
          <div className="flex items-center justify-between gap-2 py-0.5">
            {suggestedResume ? (
              <div className="flex items-center justify-between w-full gap-2 min-w-0">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                    <RotateCcw size={10} /> Task chờ
                  </span>
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {suggestedResume.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => resumeTask(suggestedResume.id)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs flex items-center gap-1 transition-colors shrink-0 shadow"
                >
                  <Play size={12} /> Tiếp tục
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-400">Không có task active.</span>
                <button
                  type="button"
                  onClick={handleOpenQuickCapture}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors shadow"
                >
                  <Plus size={13} /> Tạo Task
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
