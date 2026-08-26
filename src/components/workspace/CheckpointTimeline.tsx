import React from 'react'
import type { Checkpoint } from '../../types'
import { formatRelativeTime } from '../../utils/time'
import { ArrowRight, CheckCircle2, AlertTriangle, FileText, Clock } from 'lucide-react'

interface CheckpointTimelineProps {
  checkpoints: Checkpoint[]
  nowTimestamp?: number
}

export const CheckpointTimeline: React.FC<CheckpointTimelineProps> = ({
  checkpoints,
  nowTimestamp,
}) => {
  if (!checkpoints || checkpoints.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center text-xs text-slate-400">
        Chưa có checkpoint nào được ghi lại.
      </div>
    )
  }

  return (
    <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {checkpoints.map((cp, idx) => {
        const isLatest = idx === 0

        return (
          <div key={cp.id} className="relative space-y-1.5 group">
            {/* Timeline bullet */}
            <span
              className={`absolute -left-[19px] top-1.5 h-3 w-3 rounded-full border-2 border-slate-950 transition-colors ${
                isLatest
                  ? 'bg-cyan-400 ring-2 ring-cyan-400/20'
                  : 'bg-slate-600 group-hover:bg-slate-400'
              }`}
            />

            {/* Checkpoint Card */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                isLatest
                  ? 'bg-slate-900/90 border-cyan-500/30 shadow-sm'
                  : 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock size={11} className={isLatest ? 'text-cyan-400' : 'text-slate-500'} />
                  {formatRelativeTime(cp.createdAt, nowTimestamp)}
                </span>
                {isLatest && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                    Mới nhất
                  </span>
                )}
              </div>

              {/* Next Action */}
              <div className="flex items-start gap-2 text-xs font-semibold text-slate-100">
                <ArrowRight size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 block">Việc tiếp theo:</span>
                  <p className="text-[13px] text-slate-100">{cp.nextAction}</p>
                </div>
              </div>

              {/* Last completed */}
              {cp.lastCompleted && (
                <div className="flex items-start gap-2 text-xs text-slate-300 mt-2 pl-5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Vừa hoàn thành:</span>
                    <p className="text-slate-300">{cp.lastCompleted}</p>
                  </div>
                </div>
              )}

              {/* Blocker */}
              {cp.blocker && (
                <div className="flex items-start gap-2 text-xs text-amber-200 mt-2 pl-5 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                  <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">Bị chặn bởi (Blocker):</span>
                    <p className="text-amber-200">{cp.blocker}</p>
                  </div>
                </div>
              )}

              {/* Context info */}
              {cp.context && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 pl-5 font-mono truncate">
                  <FileText size={11} className="text-slate-500 shrink-0" />
                  <span className="truncate">{cp.context}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
