import React, { useEffect } from 'react'
import { useResumeStore } from './store/useResumeStore'
import { Header } from './components/Header'
import { FloatingDock } from './components/FloatingDock'
import { QuickCaptureModal } from './components/QuickCaptureModal'
import { ResumeMapWorkspace } from './components/ResumeMapWorkspace'

export const App: React.FC = () => {
  const {
    currentView,
    setViewMode,
    setQuickCaptureOpen,
    getSuggestedResumeTask,
    resumeTask,
  } = useResumeStore()

  // Detect URL Hash for sub-window modes (e.g. #capture, #dock)
  const hash = window.location.hash

  useEffect(() => {
    if (hash === '#capture') {
      setQuickCaptureOpen(true)
    } else if (hash === '#dock') {
      setViewMode('dock')
    }
  }, [hash, setQuickCaptureOpen, setViewMode])

  // Listen to IPC events from Electron Main process
  useEffect(() => {
    if ((window as any).electronAPI?.onGlobalHotkeyTriggered) {
      const unsubscribe = (window as any).electronAPI.onGlobalHotkeyTriggered((action: string) => {
        if (action === 'quick-capture' || action === 'pause-checkpoint') {
          setQuickCaptureOpen(true)
        } else if (action === 'toggle-dock') {
          setViewMode(currentView === 'dock' ? 'workspace' : 'dock')
        } else if (action === 'toggle-workspace') {
          setViewMode('workspace')
        } else if (action === 'quick-resume') {
          const suggested = getSuggestedResumeTask()
          if (suggested) {
            resumeTask(suggested.id)
          }
        }
      })
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe()
      }
    }
  }, [currentView, setQuickCaptureOpen, setViewMode, getSuggestedResumeTask, resumeTask])

  // Local window keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Alt + Space
      if (e.ctrlKey && e.altKey && e.code === 'Space') {
        e.preventDefault()
        setQuickCaptureOpen(true)
      }
      // Ctrl + Alt + P
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setQuickCaptureOpen(true)
      }
      // Ctrl + Alt + D
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        setViewMode(currentView === 'dock' ? 'workspace' : 'dock')
      }
      // Ctrl + Alt + W
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        setViewMode('workspace')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentView, setQuickCaptureOpen, setViewMode])

  // Dedicated spotlight window if hash is #capture
  if (hash === '#capture') {
    return (
      <div className="h-screen w-screen bg-transparent">
        <QuickCaptureModal />
      </div>
    )
  }

  // Floating dock mode
  if (currentView === 'dock') {
    return (
      <div className="h-screen w-screen flex flex-col bg-slate-950/20">
        <Header />
        <main className="flex-1 overflow-hidden">
          <FloatingDock />
        </main>
        <QuickCaptureModal />
      </div>
    )
  }

  // Default Full Workspace mode
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden">
        <ResumeMapWorkspace />
      </main>
      <QuickCaptureModal />
    </div>
  )
}

export default App
