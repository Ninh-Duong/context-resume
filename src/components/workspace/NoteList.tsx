import React from 'react'
import { useResumeStore } from '../../store/useResumeStore'
import type { Note } from '../../types'
import { formatRelativeTime } from '../../utils/time'
import {
  Search,
  Plus,
  Pin,
  Layers,
  Inbox,
  X,
  Sparkles,
} from 'lucide-react'

interface NoteListProps {
  nowTimestamp?: number
  onSelectNoteMobile?: () => void
}

export const NoteList: React.FC<NoteListProps> = ({
  nowTimestamp,
  onSelectNoteMobile,
}) => {
  const {
    notes,
    selectedNoteId,
    selectNote,
    sidebarFilter,
    searchQuery,
    setSearchQuery,
    createNote,
  } = useResumeStore()

  // 1. Filter by category
  const categoryNotes = notes.filter((n) => {
    if (sidebarFilter === 'inbox') return n.inInbox && !n.archived
    if (sidebarFilter === 'all') return !n.archived
    if (sidebarFilter === 'pinned') return n.pinned && !n.archived
    if (sidebarFilter === 'active_context') return n.type === 'context' && n.context?.status === 'active' && !n.archived
    if (sidebarFilter === 'archived') return n.archived
    if (typeof sidebarFilter === 'object' && 'tag' in sidebarFilter) {
      return n.tags.includes(sidebarFilter.tag.toLowerCase()) && !n.archived
    }
    return true
  })

  // 2. Filter by search query
  const query = searchQuery.trim().toLowerCase()
  const filteredNotes = categoryNotes.filter((n) => {
    if (!query) return true
    const matchTitle = n.title.toLowerCase().includes(query)
    const matchContent = n.content.toLowerCase().includes(query)
    const matchTags = n.tags.some((t) => t.toLowerCase().includes(query))
    const matchSteps =
      n.type === 'context' &&
      n.context?.steps?.some((s) => s.label.toLowerCase().includes(query))
    return matchTitle || matchContent || matchTags || matchSteps
  })

  const getFilterTitle = () => {
    if (sidebarFilter === 'inbox') return 'Inbox'
    if (sidebarFilter === 'all') return 'Tất cả Ghi chú'
    if (sidebarFilter === 'pinned') return 'Đã Ghim'
    if (sidebarFilter === 'active_context') return 'Context Đang Làm'
    if (sidebarFilter === 'archived') return 'Lưu Trữ'
    if (typeof sidebarFilter === 'object' && 'tag' in sidebarFilter) {
      return `#${sidebarFilter.tag}`
    }
    return 'Ghi chú'
  }

  const handleSelectNote = (noteId: string) => {
    selectNote(noteId)
    onSelectNoteMobile?.()
  }

  const handleCreateNew = () => {
    const isContextView = sidebarFilter === 'active_context'
    const isInboxView = sidebarFilter === 'inbox'
    const newId = createNote({
      type: isContextView ? 'context' : 'note',
      inInbox: isInboxView,
      tags: typeof sidebarFilter === 'object' && 'tag' in sidebarFilter ? [sidebarFilter.tag] : [],
    })
    selectNote(newId)
    onSelectNoteMobile?.()
  }

  return (
    <div className="w-full md:w-72 lg:w-80 border-r border-slate-800/80 bg-slate-900/30 flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header & Search */}
      <div className="p-3.5 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {getFilterTitle()} ({filteredNotes.length})
          </h2>
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-sm shadow-cyan-500/20 transition-colors"
          >
            <Plus size={13} />
            Tạo mới
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm ghi chú, context, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Note Cards List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((n: Note) => {
            const isSelected = selectedNoteId === n.id
            const isContext = n.type === 'context'
            const isContextActive = isContext && n.context?.status === 'active'
            const isContextPaused = isContext && n.context?.status === 'paused'

            return (
              <button
                type="button"
                key={n.id}
                onClick={() => handleSelectNote(n.id)}
                className={`w-full p-3 rounded-xl cursor-pointer text-left transition-all relative ${
                  isSelected
                    ? 'bg-slate-800/90 border border-cyan-500/50 shadow-md shadow-cyan-500/5 ring-1 ring-cyan-500/20'
                    : 'hover:bg-slate-850 bg-slate-900/40 border border-slate-800/60 text-slate-300'
                }`}
              >
                {/* Top status bar */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Active/Paused/Context Indicator */}
                    {isContext ? (
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          isContextActive
                            ? 'bg-cyan-400 animate-pulse'
                            : isContextPaused
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        title={
                          isContextActive
                            ? 'Context đang chạy'
                            : isContextPaused
                            ? 'Context tạm dừng'
                            : 'Context đã xong'
                        }
                      />
                    ) : n.inInbox ? (
                      <Inbox size={12} className="text-cyan-400 shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
                    )}

                    <h4 className="text-xs font-bold text-slate-100 truncate flex-1">
                      {n.title}
                    </h4>
                  </div>

                  {n.pinned && (
                    <Pin size={11} className="text-amber-400 fill-amber-400 shrink-0" />
                  )}
                </div>

                {/* Content preview or Step current */}
                {isContext && n.context ? (
                  <p className="text-[11px] text-cyan-300/90 truncate font-medium flex items-center gap-1 my-0.5">
                    <Sparkles size={10} className="shrink-0" />
                    {n.context.steps.find((s) => s.status === 'current')?.label ||
                      `${n.context.steps.filter((s) => s.status === 'done').length}/${
                        n.context.steps.length
                      } bước xong`}
                  </p>
                ) : n.content ? (
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed my-0.5">
                    {n.content}
                  </p>
                ) : null}

                {/* Tags & Time footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 gap-2">
                  <div className="flex items-center gap-1 overflow-hidden truncate">
                    {isContext && (
                      <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-semibold shrink-0 flex items-center gap-0.5">
                        <Layers size={9} /> Context
                      </span>
                    )}
                    {n.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium truncate"
                      >
                        #{t}
                      </span>
                    ))}
                    {n.tags.length > 2 && (
                      <span className="text-slate-600">+{n.tags.length - 2}</span>
                    )}
                  </div>

                  <span className="shrink-0 text-slate-500">
                    {formatRelativeTime(n.updatedAt, nowTimestamp)}
                  </span>
                </div>
              </button>
            )
          })
        ) : (
          <div className="py-12 px-4 text-center space-y-2.5">
            {searchQuery ? (
              <>
                <Search size={28} className="mx-auto text-slate-600" />
                <p className="text-xs text-slate-400">Không tìm thấy ghi chú nào</p>
                <p className="text-[11px] text-slate-600">
                  Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc tìm kiếm.
                </p>
              </>
            ) : sidebarFilter === 'inbox' ? (
              <>
                <Inbox size={28} className="mx-auto text-slate-600" />
                <p className="text-xs text-slate-400">Inbox trống</p>
                <p className="text-[11px] text-slate-600">
                  Dùng Quick Note (Ctrl+Alt+Space) để ghi nhanh ý tưởng vào đây.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400">Chưa có ghi chú nào ở mục này</p>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-colors"
                >
                  + Tạo ghi chú mới
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
