import React, { useState } from 'react'
import { useResumeStore } from '../store/useResumeStore'
import {
  Play,
  Pause,
  CheckCircle2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw,
  Plus,
  Compass,
  Settings2,
  Sparkles
} from 'lucide-react'

export const FloatingDock: React.FC = () => {
  const {
    getActiveTask,
    getPausedTasks,
    getSuggestedResumeTask,
    resumeTask,
    completeTask,
    toggleStepComplete,
    addStep,
    setQuickCaptureOpen,
    setViewMode,
    dockSettings,
    updateDockSettings,
  } = useResumeStore()

  const [isExpanded, setIsExpanded] = useState(false)
  const [newStepText, setNewStepText] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  const activeTask = getActiveTask()
  const pausedTasks = getPausedTasks()
  const suggestedResume = getSuggestedResumeTask()

  const currentStep = activeTask?.steps.find((s) => s.status === 'current')
  const nextStep = activeTask?.steps.find((s) => s.status === 'next')
  const activeAction = currentStep || nextStep || activeTask?.steps.find((s) => s.status !== 'done')
  const latestCheckpoint = activeTask?.checkpoints?.[0]

  const handleAdvanceStep = () => {
    if (activeTask && activeAction) {
      toggleStepComplete(activeTask.id, activeAction.id)
    }
  }

  const handleAddInlineStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTask && newStepText.trim()) {
      addStep(activeTask.id, newStepText.trim(), 'next')
      setNewStepText('')
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center p-4 min-h-screen bg-slate-950/40 backdrop-blur-sm"
      style={{ opacity: dockSettings.opacity }}
    >
      {/* Floating HUD Container */}
      <div
        className={`w-full max-w-md transition-all duration-300 rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl backdrop-blur-xl overflow-hidden text-slate-100 flex flex-col ${
          isExpanded ? 'ring-1 ring-cyan-500/30' : ''
        }`}
      >
        {/* Header / Drag Bar */}
        <div className="drag-region flex items-center justify-between px-3.5 py-2.5 bg-slate-800/80 border-b border-slate-800 cursor-move">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
              Context Resume Dock
            </span>
          </div>

          <div className="no-drag flex items-center gap-1.5">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 hover:bg-slate-700/60 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
              title="Cài đặt Dock"
            >
              <Settings2 size={13} />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-700/60 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
              title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            >
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <button
              onClick={() => setViewMode('workspace')}
              className="p-1 hover:bg-cyan-500/20 text-cyan-400 rounded-md transition-colors"
              title="Mở toàn bộ Resume Map Workspace"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        {/* Settings Sub-panel if toggled */}
        {showSettings && (
          <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Độ trong suốt (Opacity):</span>
              <input
                type="range"
                min="0.4"
                max="1.0"
                step="0.05"
                value={dockSettings.opacity}
                onChange={(e) => updateDockSettings({ opacity: parseFloat(e.target.value) })}
                className="w-24 accent-cyan-400 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Phím tắt nhanh:</span>
              <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">
                Ctrl + Alt + Space
              </span>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="p-3.5 space-y-3">
          {activeTask ? (
            <div>
              {/* Active Task Name & Status Pill */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Đang làm
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                      {activeTask.checkpoints.length > 0 ? `Đã lưu ${activeTask.checkpoints.length} checkpoint` : 'Mới bắt đầu'}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 truncate" title={activeTask.title}>
                    {activeTask.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setQuickCaptureOpen(true)}
                    className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-all text-xs flex items-center gap-1"
                    title="Tạm dừng & Lưu Checkpoint (Ctrl+Alt+P)"
                  >
                    <Pause size={13} />
                    <span className="hidden sm:inline">Pause</span>
                  </button>
                  <button
                    onClick={() => completeTask(activeTask.id)}
                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all text-xs flex items-center gap-1"
                    title="Đánh dấu hoàn thành Task"
                  >
                    <CheckCircle2 size={13} />
                    <span className="hidden sm:inline">Xong</span>
                  </button>
                </div>
              </div>

              {/* Prominent NEXT Action Badge (Core UX value) */}
              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-800/90 border border-cyan-500/30 shadow-inner">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1 mb-1">
                  <Sparkles size={12} className="text-cyan-400" />
                  Bước tiếp theo (NEXT Action):
                </div>
                {activeAction ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-200 line-clamp-2">
                      {activeAction.label}
                    </p>
                    <button
                      onClick={handleAdvanceStep}
                      className="p-1 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded transition-colors shrink-0"
                      title="Hoàn thành bước này"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Chưa có bước tiếp theo. Hãy thêm bước bên dưới!
                  </p>
                )}

                {/* Blocker Alert if any */}
                {latestCheckpoint?.blocker && (
                  <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-start gap-1.5 text-xs text-amber-300">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-400" />
                    <span className="line-clamp-1">{latestCheckpoint.blocker}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty Active Task State */
            <div className="py-4 text-center space-y-2">
              <p className="text-xs text-slate-400">Hiện chưa có task nào đang Active.</p>
              <button
                onClick={() => setQuickCaptureOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors shadow-lg shadow-cyan-500/20"
              >
                <Plus size={14} />
                Tạo Task mới hoặc Ghi Checkpoint
              </button>
            </div>
          )}

          {/* Suggested Resume Banner if there are paused tasks */}
          {!activeTask && suggestedResume && (
            <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                  <RotateCcw size={11} /> Gợi ý tiếp tục (Paused Task)
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {suggestedResume.title}
                </div>
              </div>
              <button
                onClick={() => resumeTask(suggestedResume.id)}
                className="px-2.5 py-1 rounded bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs flex items-center gap-1 transition-colors shrink-0"
              >
                <Play size={12} /> Tiếp tục
              </button>
            </div>
          )}

          {/* Expanded Step Timeline List */}
          {isExpanded && activeTask && (
            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>Danh sách các bước ({activeTask.steps.length}):</span>
                <span className="text-[11px] text-slate-500">1-click đổi trạng thái</span>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {activeTask.steps.map((step) => (
                  <div
                    key={step.id}
                    onClick={() => toggleStepComplete(activeTask.id, step.id)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-all border ${
                      step.status === 'done'
                        ? 'bg-slate-900/50 border-emerald-500/20 text-slate-400 line-through'
                        : step.status === 'current'
                        ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200 font-medium'
                        : step.status === 'blocked'
                        ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="shrink-0">
                      {step.status === 'done' ? (
                        <CheckCircle2 size={13} className="text-emerald-400" />
                      ) : step.status === 'current' ? (
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-400/30" />
                      ) : step.status === 'blocked' ? (
                        <AlertTriangle size={13} className="text-amber-400" />
                      ) : (
                        <span className="inline-block w-2.5 h-2.5 rounded-full border border-slate-500" />
                      )}
                    </span>
                    <span className="flex-1 truncate">{step.label}</span>
                  </div>
                ))}
              </div>

              {/* Add Step input */}
              <form onSubmit={handleAddInlineStep} className="flex items-center gap-1.5 mt-2">
                <input
                  type="text"
                  placeholder="+ Thêm bước tiếp theo..."
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!newStepText.trim()}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300 transition-colors"
                >
                  <Plus size={13} />
                </button>
              </form>
            </div>
          )}

          {/* Quick Footer */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Compass size={11} />
              {pausedTasks.length > 0 ? `${pausedTasks.length} task đang Pause` : 'Không có task chờ'}
            </span>
            <button
              onClick={() => setQuickCaptureOpen(true)}
              className="hover:text-cyan-400 transition-colors font-medium"
            >
              ⚡ Quick Capture [Ctrl+Alt+Space]
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
