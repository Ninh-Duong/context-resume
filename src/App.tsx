import React, { useEffect, useState } from 'react'
import { useResumeStore } from './store/useResumeStore'
import { Header } from './components/Header'
import { FloatingDock } from './components/FloatingDock'
import { QuickCaptureModal } from './components/QuickCaptureModal'
import { ResumeMapWorkspace } from './components/ResumeMapWorkspace'

export const App: React.FC = () => {
  const {
    syncFromRemote,
    getSuggestedResumeNote,
    activateContext,
    setQuickCaptureOpen,
    setQuickCaptureMode,
  } = useResumeStore()

  // Track window route from hash (#dock | #capture | #workspace)
  const [windowRoute, setWindowRoute] = useState<string>(() => window.location.hash || '#workspace')

  useEffect(() => {
    const handleHashChange = () => {
      setWindowRoute(window.location.hash || '#workspace')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Dedicated capture window listener
  useEffect(() => {
    if (windowRoute === '#capture') {
      setQuickCaptureOpen(true)
    }
  }, [windowRoute, setQuickCaptureOpen])

  // Listen to IPC sync events across multi-windows
  useEffect(() => {
    if ((window as any).electronAPI?.onDataSync) {
      const unsubscribe = (window as any).electronAPI.onDataSync((data: any) => {
        if (data) {
          syncFromRemote(data)
        }
      })
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe()
      }
    }
  }, [syncFromRemote])

  // Listen to global hotkey triggers
  useEffect(() => {
    if ((window as any).electronAPI?.onGlobalHotkeyTriggered) {
      const unsubscribe = (window as any).electronAPI.onGlobalHotkeyTriggered((action: string) => {
        if (action === 'quick-capture') {
          setQuickCaptureMode('note')
          setQuickCaptureOpen(true)
        } else if (action === 'pause-checkpoint') {
          setQuickCaptureMode('checkpoint')
          setQuickCaptureOpen(true)
        } else if (action === 'quick-resume') {
          const suggested = getSuggestedResumeNote()
          if (suggested) {
            activateContext(suggested.id)
          }
        }
      })
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe()
      }
    }
  }, [getSuggestedResumeNote, activateContext, setQuickCaptureOpen, setQuickCaptureMode])

  // Local keyboard shortcut listeners within focused window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Alt + Space: Open Quick Note
      if (e.ctrlKey && e.altKey && e.code === 'Space') {
        e.preventDefault()
        setQuickCaptureMode('note')
        window.electronAPI?.openQuickCapture?.()
      }
      // Ctrl + Alt + P: Open Checkpoint
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setQuickCaptureMode('checkpoint')
        window.electronAPI?.openQuickCapture?.()
      }
      // Ctrl + Alt + D: Open / Toggle Dock
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        window.electronAPI?.openDock?.()
      }
      // Ctrl + Alt + W: Open / Toggle Workspace
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        window.electronAPI?.openWorkspace?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setQuickCaptureMode])

  // 1. DEDICATED DOCK WINDOW VIEW (#dock)
  if (windowRoute === '#dock') {
    return (
      <div className="h-screen w-screen bg-transparent overflow-visible select-none">
        <FloatingDock />
      </div>
    )
  }

  // 2. DEDICATED QUICK CAPTURE SPOTLIGHT VIEW (#capture)
  if (windowRoute === '#capture') {
    return (
      <div className="h-screen w-screen bg-transparent overflow-visible select-none">
        <QuickCaptureModal />
      </div>
    )
  }

  // 3. DEDICATED FULL WORKSPACE VIEW (#workspace or default)
  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950 shadow-2xl select-none">
      <Header />
      <main className="relative flex-1 overflow-hidden">
        <ResumeMapWorkspace />
      </main>
      <QuickCaptureModal />
    </div>
  )
}

export default App
