import React, { useState } from 'react'
import type { Note, StepStatus } from '../../types'
import { useResumeStore } from '../../store/useResumeStore'
import { CheckpointTimeline } from './CheckpointTimeline'
import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  ArrowUp,
  ArrowDown,
  CheckCheck,
} from 'lucide-react'

interface ContextPanelProps {
  note: Note
  nowTimestamp?: number
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ note, nowTimestamp }) => {
  const {
    activateContext,
    completeContext,
    addStep,
    updateStepStatus,
    toggleStepComplete,
    editStep,
    deleteStep,
    reorderSteps,
    setQuickCaptureOpen,
  } = useResumeStore()

  const [newStepLabel, setNewStepLabel] = useState('')
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editingStepText, setEditingStepText] = useState('')
  const [editingStepNote, setEditingStepNote] = useState('')
  const [showCheckpoints, setShowCheckpoints] = useState(true)

  const contextData = note.context
  if (!contextData) return null

  const steps = contextData.steps || []
  const checkpoints = contextData.checkpoints || []
  const doneStepsCount = steps.filter((s) => s.status === 'done').length
  const totalStepsCount = steps.length
  const progressPercent = totalStepsCount > 0 ? Math.round((doneStepsCount / totalStepsCount) * 100) : 0

  const currentStep = steps.find((s) => s.status === 'current')
  const nextStep = steps.find((s) => s.status === 'next')
  const isActive = contextData.status === 'active'
  const isPaused = contextData.status === 'paused'
  const isCompleted = contextData.status === 'completed'

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStepLabel.trim()) return
    addStep(note.id, newStepLabel.trim(), currentStep ? 'next' : 'current')
    setNewStepLabel('')
  }

  const handleStartEditing = (stepId: string, label: string, noteText?: string) => {
    setEditingStepId(stepId)
    setEditingStepText(label)
    setEditingStepNote(noteText || '')
  }

  const handleSaveStepEdit = (stepId: string) => {
    if (editingStepText.trim()) {
      editStep(note.id, stepId, editingStepText.trim(), editingStepNote.trim() || undefined)
      setEditingStepId(null)
    }
  }

  const handleOpenCheckpointModal = () => {
    setQuickCaptureOpen(true, 'checkpoint')
  }

  return (
    <div className="space-y-6 pt-4 border-t border-slate-800">
      {/* 1. STATUS & CONTROLS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2.5">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isActive
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : isPaused
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isActive ? 'bg-cyan-400 animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            {isActive ? 'Đang thực hiện' : isPaused ? 'Tạm dừng' : 'Đã hoàn thành'}
          </span>

          <span className="text-xs text-slate-400">
            {doneStepsCount}/{totalStepsCount} bước hoàn thành ({progressPercent}%)
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isActive && (
            <button
              type="button"
              onClick={() => activateContext(note.id)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-colors"
            >
              <Play size={13} />
              Tiếp tục Context
            </button>
          )}

          {isActive && (
            <button
              type="button"
              onClick={handleOpenCheckpointModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-amber-500/30"
            >
              <Pause size={13} />
              Lưu Checkpoint
            </button>
          )}

          {!isCompleted && (
            <button
              type="button"
              onClick={() => completeContext(note.id)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-emerald-500/30"
              title="Đánh dấu hoàn thành toàn bộ context"
            >
              <CheckCheck size={13} />
              Hoàn thành
            </button>
          )}
        </div>
      </div>

      {/* 2. PROGRESS BAR */}
      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3. PROMINENT CURRENT ACTION CARD */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/40 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Sparkles size={13} /> Việc đang làm ngay bây giờ (Current Action):
          </span>
          {currentStep && (
            <button
              type="button"
              onClick={() => toggleStepComplete(note.id, currentStep.id)}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <CheckCircle2 size={12} />
              Xong bước này
            </button>
          )}
        </div>

        <p className="text-base font-semibold text-slate-100">
          {currentStep ? currentStep.label : nextStep ? `Sắp tới: ${nextStep.label}` : 'Chưa thiết lập bước đang làm'}
        </p>

        {currentStep?.note && (
          <p className="text-xs text-amber-300/90 flex items-center gap-1 mt-1">
            <AlertTriangle size={12} className="text-amber-400 shrink-0" />
            <span>{currentStep.note}</span>
          </p>
        )}
      </div>

      {/* 4. STEP MANAGEMENT LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Danh sách các bước ({doneStepsCount}/{totalStepsCount})
          </h3>
          <span className="text-[11px] text-slate-500">Kéo/Dùng nút để sắp xếp thứ tự</span>
        </div>

        <div className="space-y-2">
          {steps.map((step, idx) => {
            const isDone = step.status === 'done'
            const isCurr = step.status === 'current'
            const isBlocked = step.status === 'blocked'
            const isEditing = editingStepId === step.id

            return (
              <div
                key={step.id}
                className={`flex flex-col gap-2 p-3 rounded-xl transition-all ${
                  isCurr
                    ? 'bg-slate-900 border border-cyan-500/40 ring-1 ring-cyan-500/20 shadow-sm'
                    : isDone
                    ? 'bg-slate-950/40 border border-slate-900 text-slate-500'
                    : isBlocked
                    ? 'bg-amber-950/20 border border-amber-500/30 text-amber-200'
                    : 'bg-slate-900/50 border border-slate-800/80 hover:bg-slate-900/90 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Step status checkbox */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleStepComplete(note.id, step.id)}
                      className="shrink-0 transition-transform active:scale-95"
                      title={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                      aria-label={`Đánh dấu bước: ${step.label}`}
                    >
                      {isDone ? (
                        <CheckCircle2 size={20} className="text-emerald-400" />
                      ) : isCurr ? (
                        <span className="flex h-4 w-4 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20" />
                      ) : isBlocked ? (
                        <AlertTriangle size={18} className="text-amber-400" />
                      ) : (
                        <span className="flex h-4 w-4 rounded-full border-2 border-slate-600 hover:border-cyan-400" />
                      )}
                    </button>

                    {/* Step label / edit input */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={editingStepText}
                            onChange={(e) => setEditingStepText(e.target.value)}
                            className="w-full px-2.5 py-1 bg-slate-950 border border-cyan-500 rounded text-xs text-slate-100 focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveStepEdit(step.id)
                              if (e.key === 'Escape') setEditingStepId(null)
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Ghi chú thêm / Blocker (tùy chọn)..."
                            value={editingStepNote}
                            onChange={(e) => setEditingStepNote(e.target.value)}
                            className="w-full px-2.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-300 focus:outline-none"
                          />
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveStepEdit(step.id)}
                              className="px-2.5 py-0.5 bg-cyan-500 text-slate-950 text-xs rounded font-bold"
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStepId(null)}
                              className="px-2 py-0.5 hover:bg-slate-800 text-slate-400 text-xs rounded"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              isDone
                                ? 'line-through text-slate-500'
                                : isCurr
                                ? 'text-slate-100 font-semibold'
                                : 'text-slate-200'
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.note && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {step.note}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <select
                        value={step.status}
                        onChange={(e) =>
                          updateStepStatus(note.id, step.id, e.target.value as StepStatus)
                        }
                        className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer border border-slate-700/60"
                      >
                        <option value="done">Xong</option>
                        <option value="current">Đang làm</option>
                        <option value="next">Tiếp theo</option>
                        <option value="blocked">Bị chặn</option>
                        <option value="later">Làm sau</option>
                      </select>

                      {/* Reorder Up/Down */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => reorderSteps(note.id, idx, idx - 1)}
                        className="p-1 hover:bg-slate-800 disabled:opacity-20 text-slate-400 hover:text-slate-200 rounded"
                        title="Di chuyển lên"
                      >
                        <ArrowUp size={13} />
                      </button>

                      <button
                        type="button"
                        disabled={idx === steps.length - 1}
                        onClick={() => reorderSteps(note.id, idx, idx + 1)}
                        className="p-1 hover:bg-slate-800 disabled:opacity-20 text-slate-400 hover:text-slate-200 rounded"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEditing(step.id, step.label, step.note)}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteStep(note.id, step.id)}
                        className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded"
                        title="Xóa bước này"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add Step input */}
          <form onSubmit={handleAddStep} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="+ Thêm bước tiếp theo vào tiến trình..."
              value={newStepLabel}
              onChange={(e) => setNewStepLabel(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!newStepLabel.trim()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <Plus size={13} />
              Thêm bước
            </button>
          </form>
        </div>
      </div>

      {/* 5. CHECKPOINT HISTORY */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowCheckpoints(!showCheckpoints)}
            className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Clock size={13} className="text-cyan-400" />
            Lịch sử Checkpoint ({checkpoints.length})
            <span className="text-[10px] text-slate-500 lowercase font-normal">
              {showCheckpoints ? '(bấm để thu gọn)' : '(bấm để xem)'}
            </span>
          </button>

          {isActive && (
            <button
              type="button"
              onClick={handleOpenCheckpointModal}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              + Tạo Checkpoint mới
            </button>
          )}
        </div>

        {showCheckpoints && (
          <CheckpointTimeline checkpoints={checkpoints} nowTimestamp={nowTimestamp} />
        )}
      </div>
    </div>
  )
}
