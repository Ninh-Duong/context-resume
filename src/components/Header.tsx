import React from 'react'
import {
  Sparkles,
  Minus,
  X,
  Square,
  Compass
} from 'lucide-react'

export const Header: React.FC = () => {
  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow?.()
  }

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow?.()
  }

  const handleClose = () => {
    window.electronAPI?.closeWindow?.()
  }

  const handleOpenDock = () => {
    window.electronAPI?.openDock?.()
  }

  const handleOpenQuickCapture = () => {
    window.electronAPI?.openQuickCapture?.()
  }

  return (
    <header className="drag-region flex items-center justify-between h-[42px] px-3.5 bg-slate-900/95 border-b border-slate-800 text-slate-200 select-none shrink-0">
      {/* App Logo & Title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs shadow-sm shrink-0">
          M
        </div>
        <span className="text-xs font-bold tracking-tight text-slate-100 truncate">
          Context Resume <span className="text-cyan-400 font-normal hidden sm:inline">| Mạch</span>
        </span>
      </div>

      {/* Center Quick Actions */}
      <div className="no-drag flex min-w-0 flex-1 items-center justify-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={handleOpenDock}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
          title="Mở Note Nổi Mini trên màn hình"
        >
          <Compass size={13} />
          <span className="hidden sm:inline">Note Nổi</span>
        </button>

        <button
          type="button"
          onClick={handleOpenQuickCapture}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors font-medium border border-amber-500/20"
          title="Bấm Ctrl + Alt + Space để mở nhanh từ mọi nơi"
        >
          <Sparkles size={13} />
          <span>Quick Capture</span>
          <kbd className="hidden lg:inline-block px-1 py-0.2 bg-slate-800 text-[10px] rounded text-slate-400 font-mono">
            Ctrl+Alt+Space
          </kbd>
        </button>
      </div>

      {/* Window Controls */}
      <div className="no-drag flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handleMinimize}
          className="min-h-8 min-w-8 p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
          title="Thu nhỏ"
          aria-label="Thu nhỏ cửa sổ"
        >
          <Minus size={13} />
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          className="min-h-8 min-w-8 p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
          title="Phóng to"
          aria-label="Phóng to cửa sổ"
        >
          <Square size={12} />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="min-h-8 min-w-8 p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
          title="Ẩn xuống Khay hệ thống"
          aria-label="Ẩn xuống khay hệ thống"
        >
          <X size={13} />
        </button>
      </div>
    </header>
  )
}
