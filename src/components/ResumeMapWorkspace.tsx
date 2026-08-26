import React, { useState } from 'react'
import { useResumeStore } from '../store/useResumeStore'
import { NoteSidebar } from './workspace/NoteSidebar'
import { NoteList } from './workspace/NoteList'
import { NoteEditor } from './workspace/NoteEditor'
import { useRealtimeClock } from '../utils/time'
import { ChevronLeft, Menu, FileText } from 'lucide-react'

export const ResumeMapWorkspace: React.FC = () => {
  const { notes, selectedNoteId } = useResumeStore()
  const nowTimestamp = useRealtimeClock(30000)

  // Responsive mobile active view: 'sidebar' | 'list' | 'editor'
  const [mobileView, setMobileView] = useState<'sidebar' | 'list' | 'editor'>('list')

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* MOBILE TOP BAR (Hidden on desktop md:) */}
      <div className="flex md:hidden items-center justify-between border-b border-slate-800 bg-slate-900 px-3 py-2 text-xs">
        {mobileView === 'editor' ? (
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className="flex items-center gap-1 text-slate-300 hover:text-cyan-300 font-medium py-1"
          >
            <ChevronLeft size={15} /> Danh sách
          </button>
        ) : mobileView === 'list' ? (
          <button
            type="button"
            onClick={() => setMobileView('sidebar')}
            className="flex items-center gap-1 text-slate-300 hover:text-cyan-300 font-medium py-1"
          >
            <Menu size={15} /> Danh mục
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className="flex items-center gap-1 text-slate-300 hover:text-cyan-300 font-medium py-1"
          >
            <FileText size={14} /> Xem danh sách
          </button>
        )}

        <span className="text-xs font-bold text-slate-200 truncate max-w-[180px]">
          {mobileView === 'editor'
            ? selectedNote?.title || 'Soạn thảo'
            : mobileView === 'sidebar'
            ? 'Danh mục'
            : 'Danh sách ghi chú'}
        </span>

        {mobileView !== 'editor' && selectedNote && (
          <button
            type="button"
            onClick={() => setMobileView('editor')}
            className="text-xs font-semibold text-cyan-400"
          >
            Mở Note
          </button>
        )}
      </div>

      {/* 3-COLUMN DESKTOP RESPONSIVE WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* Column 1: Navigation Sidebar */}
        <div
          className={`h-full ${
            mobileView === 'sidebar' ? 'flex w-full' : 'hidden md:flex'
          }`}
        >
          <NoteSidebar onSelectFilterMobile={() => setMobileView('list')} />
        </div>

        {/* Column 2: Notes List */}
        <div
          className={`h-full ${
            mobileView === 'list' ? 'flex w-full' : 'hidden md:flex'
          }`}
        >
          <NoteList
            nowTimestamp={nowTimestamp}
            onSelectNoteMobile={() => setMobileView('editor')}
          />
        </div>

        {/* Column 3: Main Note Editor & Context Map */}
        <div
          className={`h-full flex-1 overflow-hidden ${
            mobileView === 'editor' ? 'flex w-full' : 'hidden md:flex'
          }`}
        >
          <NoteEditor note={selectedNote} nowTimestamp={nowTimestamp} />
        </div>
      </div>
    </div>
  )
}
