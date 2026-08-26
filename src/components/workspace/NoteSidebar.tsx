import React, { useRef } from 'react'
import { useResumeStore } from '../../store/useResumeStore'
import type { SidebarFilter } from '../../types'
import {
  Inbox,
  FileText,
  Pin,
  Layers,
  Archive,
  Tag,
  Plus,
  Download,
  Upload,
  Sparkles,
} from 'lucide-react'

interface NoteSidebarProps {
  onSelectFilterMobile?: () => void
}

export const NoteSidebar: React.FC<NoteSidebarProps> = ({ onSelectFilterMobile }) => {
  const {
    notes,
    sidebarFilter,
    setSidebarFilter,
    createNote,
    selectNote,
    getAllTags,
    exportData,
    importData,
  } = useResumeStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const inboxCount = notes.filter((n) => n.inInbox && !n.archived).length
  const allCount = notes.filter((n) => !n.archived).length
  const pinnedCount = notes.filter((n) => n.pinned && !n.archived).length
  const activeContextCount = notes.filter(
    (n) => n.type === 'context' && n.context?.status === 'active' && !n.archived
  ).length
  const archivedCount = notes.filter((n) => n.archived).length
  const allTags = getAllTags()

  const handleFilterClick = (filter: SidebarFilter) => {
    setSidebarFilter(filter)
    onSelectFilterMobile?.()
  }

  const handleCreateNote = () => {
    const id = createNote({ type: 'note', inInbox: true })
    selectNote(id)
    onSelectFilterMobile?.()
  }

  const handleCreateContext = () => {
    const id = createNote({ type: 'context' })
    selectNote(id)
    onSelectFilterMobile?.()
  }

  const handleExport = () => {
    const jsonStr = exportData()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `context_resume_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        const success = importData(content)
        if (success) {
          alert('Nhập dữ liệu thành công!')
        } else {
          alert('Định dạng tệp không hợp lệ!')
        }
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const isFilterActive = (filter: SidebarFilter) => {
    if (typeof filter === 'string' && typeof sidebarFilter === 'string') {
      return filter === sidebarFilter
    }
    if (typeof filter === 'object' && typeof sidebarFilter === 'object') {
      return 'tag' in filter && 'tag' in sidebarFilter && filter.tag === sidebarFilter.tag
    }
    return false
  }

  return (
    <aside className="w-full md:w-56 lg:w-60 border-r border-slate-800/80 bg-slate-950/70 flex flex-col shrink-0 h-full overflow-hidden select-none">
      {/* Quick Action Buttons */}
      <div className="p-3 border-b border-slate-800/80 space-y-1.5">
        <button
          type="button"
          onClick={handleCreateNote}
          className="w-full px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-98"
        >
          <Plus size={14} />
          Ghi Chú Mới
        </button>

        <button
          type="button"
          onClick={handleCreateContext}
          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Sparkles size={13} />
          Tạo Context Mới
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto p-2 space-y-6">
        <div className="space-y-0.5">
          {/* Inbox */}
          <button
            type="button"
            onClick={() => handleFilterClick('inbox')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isFilterActive('inbox')
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'hover:bg-slate-900 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Inbox size={15} className={isFilterActive('inbox') ? 'text-cyan-400' : 'text-slate-400'} />
              <span>Inbox</span>
            </div>
            {inboxCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                {inboxCount}
              </span>
            )}
          </button>

          {/* All Notes */}
          <button
            type="button"
            onClick={() => handleFilterClick('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isFilterActive('all')
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'hover:bg-slate-900 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText size={15} className={isFilterActive('all') ? 'text-cyan-400' : 'text-slate-400'} />
              <span>Tất cả Ghi chú</span>
            </div>
            <span className="text-[11px] text-slate-500">{allCount}</span>
          </button>

          {/* Pinned */}
          <button
            type="button"
            onClick={() => handleFilterClick('pinned')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isFilterActive('pinned')
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'hover:bg-slate-900 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Pin size={15} className={isFilterActive('pinned') ? 'text-cyan-400' : 'text-amber-400'} />
              <span>Đã Ghim</span>
            </div>
            {pinnedCount > 0 && <span className="text-[11px] text-slate-500">{pinnedCount}</span>}
          </button>

          {/* Active Context */}
          <button
            type="button"
            onClick={() => handleFilterClick('active_context')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isFilterActive('active_context')
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'hover:bg-slate-900 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers size={15} className={isFilterActive('active_context') ? 'text-cyan-400' : 'text-indigo-400'} />
              <span>Active Context</span>
            </div>
            {activeContextCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-400 text-slate-950">
                {activeContextCount}
              </span>
            )}
          </button>

          {/* Archived */}
          <button
            type="button"
            onClick={() => handleFilterClick('archived')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isFilterActive('archived')
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'hover:bg-slate-900 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Archive size={15} className={isFilterActive('archived') ? 'text-cyan-400' : 'text-slate-400'} />
              <span>Lưu Trữ</span>
            </div>
            {archivedCount > 0 && <span className="text-[11px] text-slate-500">{archivedCount}</span>}
          </button>
        </div>

        {/* Tags Section */}
        {allTags.length > 0 && (
          <div className="space-y-1.5">
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Tag size={11} />
              Tags
            </div>

            <div className="space-y-0.5">
              {allTags.map((t) => {
                const isActiveTag = isFilterActive({ tag: t })
                const count = notes.filter((n) => n.tags.includes(t) && !n.archived).length

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleFilterClick({ tag: t })}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      isActiveTag
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">#{t}</span>
                    <span className="text-[10px] text-slate-500">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Backup / Storage */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[11px] text-slate-400">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
          title="Nhập dữ liệu từ file JSON"
        >
          <Upload size={12} />
          Nhập
        </button>

        <button
          type="button"
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
          title="Sao lưu toàn bộ dữ liệu ra file JSON"
        >
          <Download size={12} />
          Sao lưu
        </button>
      </div>
    </aside>
  )
}
