import React from 'react'
import { useResumeStore } from '../store/useResumeStore'
import {
  Sparkles,
  Minus,
  X,
  Square,
  Compass,
  Layout
} from 'lucide-react'

declare global {
  interface Window {
    electronAPI?: {
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      hideWindow: () => void
      setAlwaysOnTop: (flag: boolean) => void
      setOpacity: (opacity: number) => void
      resizeWindow: (w: number, h: number) => void
      openQuickCapture: () => void
      openWorkspace: () => void
      openDock: () => void
    }
  }
}

export const Header: React.FC = () => {
  const { currentView, setViewMode, setQuickCaptureOpen } = useResumeStore()

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow()
  }

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow()
  }

  const handleClose = () => {
    window.electronAPI?.closeWindow()
  }

  return (
    <header className="drag-region flex items-center justify-between h-[42px] px-3.5 bg-slate-900/90 border-b border-slate-800 text-slate-200 select-none">
      {/* App Logo & Title */}
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs shadow-sm">
          M
        </div>
        <span className="text-xs font-bold tracking-tight text-slate-100">
          Context Resume <span className="text-cyan-400 font-normal">| Mạch</span>
        </span>
      </div>

      {/* Center View Mode Switcher */}
      <div className="no-drag flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-xs">
        <button
          onClick={() => setViewMode('workspace')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
            currentView === 'workspace'
              ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layout size={13} />
          <span>Resume Map</span>
        </button>

        <button
          onClick={() => setViewMode('dock')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
            currentView === 'dock'
              ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Compass size={13} />
          <span>Floating Dock</span>
        </button>

        <button
          onClick={() => setQuickCaptureOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-amber-300 hover:bg-amber-500/20 transition-all font-medium"
          title="Bấm Ctrl + Alt + Space để mở nhanh từ mọi nơi"
        >
          <Sparkles size={13} />
          <span>Quick Capture</span>
          <kbd className="hidden md:inline-block px-1 py-0.2 bg-slate-800 text-[10px] rounded text-slate-400 font-mono">
            Ctrl+Alt+Space
          </kbd>
        </button>
      </div>

      {/* Window Controls */}
      <div className="no-drag flex items-center gap-1">
        <button
          onClick={handleMinimize}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
          title="Thu nhỏ"
        >
          <Minus size={13} />
        </button>
        <button
          onClick={handleMaximize}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
          title="Phóng to"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
          title="Đóng"
        >
          <X size={13} />
        </button>
      </div>
    </header>
  )
}
