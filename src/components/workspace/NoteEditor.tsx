import React, { useState } from 'react'
import type { Note } from '../../types'
import { useResumeStore } from '../../store/useResumeStore'
import { ContextPanel } from './ContextPanel'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { formatRelativeTime } from '../../utils/time'
import {
  Pin,
  Archive,
  Trash2,
  Download,
  Layers,
  FileText,
  Tag,
  X,
  Plus,
  Clock,
  Sparkles,
} from 'lucide-react'

interface NoteEditorProps {
  note: Note | null
  nowTimestamp?: number
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, nowTimestamp }) => {
  const {
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    convertToContext,
    convertToNote,
    createNote,
  } = useResumeStore()

  const [newTagInput, setNewTagInput] = useState('')
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3 p-8">
        <FileText size={42} className="text-slate-700" />
        <p className="text-sm font-medium text-slate-400">Chưa có ghi chú nào được chọn</p>
        <p className="text-xs text-slate-600 max-w-sm text-center">
          Chọn một ghi chú ở danh sách bên trái hoặc tạo ghi chú mới để bắt đầu.
        </p>
        <button
          type="button"
          onClick={() => createNote()}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-colors flex items-center gap-1.5"
        >
          <Plus size={14} />
          Tạo Ghi Chú Mới
        </button>
      </div>
    )
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNote(note.id, { title: e.target.value })
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNote(note.id, { content: e.target.value })
  }

  const handleAddTag = (e: React.KeyboardEvent | React.FocusEvent) => {
    if ('key' in e && e.key !== 'Enter') return
    const tag = newTagInput.trim().toLowerCase().replace(/^#/, '')
    if (tag && !note.tags.includes(tag)) {
      updateNote(note.id, { tags: [...note.tags, tag] })
    }
    setNewTagInput('')
    setIsAddingTag(false)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    updateNote(note.id, {
      tags: note.tags.filter((t) => t !== tagToRemove),
    })
  }

  const handleExportMarkdown = () => {
    let md = `# ${note.title}\n\n`
    if (note.tags.length > 0) {
      md += `Tags: ${note.tags.map((t) => `#${t}`).join(', ')}\n\n`
    }
    md += `Loại: ${note.type === 'context' ? 'Context' : 'Note'}\n`
    md += `Cập nhật: ${new Date(note.updatedAt).toLocaleString()}\n\n---\n\n`
    md += `${note.content}\n\n`

    if (note.type === 'context' && note.context) {
      md += `## Các bước tiến trình:\n`
      md += note.context.steps
        .map(
          (s) =>
            `- [${s.status === 'done' ? 'x' : ' '}] (${s.status.toUpperCase()}) ${s.label}${
              s.note ? ` (${s.note})` : ''
            }`
        )
        .join('\n')

      if (note.context.checkpoints.length > 0) {
        md += `\n\n## Lịch sử Checkpoint:\n`
        md += note.context.checkpoints
          .map(
            (cp) =>
              `### ${new Date(cp.createdAt).toLocaleString()}\n- Vừa xong: ${
                cp.lastCompleted || 'N/A'
              }\n- Tiếp theo: ${cp.nextAction}\n- Blocker: ${cp.blocker || 'Không có'}\n`
          )
          .join('\n')
      }
    }

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title.replace(/[^\w\d-_]/g, '_') || 'note'}.md`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const isContext = note.type === 'context'

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-5">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Note Metadata & Type Badge */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
          <span
            className={`px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
              isContext
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {isContext ? <Layers size={11} /> : <FileText size={11} />}
            {isContext ? 'Context' : 'Note'}
          </span>

          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock size={11} />
            Sửa: {formatRelativeTime(note.updatedAt, nowTimestamp)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Convert type button */}
          {isContext ? (
            <button
              type="button"
              onClick={() => convertToNote(note.id)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Chuyển sang ghi chú thông thường"
            >
              <FileText size={13} />
              Về Note
            </button>
          ) : (
            <button
              type="button"
              onClick={() => convertToContext(note.id)}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Chuyển thành Context để track tiến trình & checkpoint"
            >
              <Sparkles size={13} />
              Chuyển thành Context
            </button>
          )}

          {/* Pin */}
          <button
            type="button"
            onClick={() => togglePin(note.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              note.pinned
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={note.pinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
          >
            <Pin size={14} className={note.pinned ? 'fill-amber-300' : ''} />
          </button>

          {/* Archive */}
          <button
            type="button"
            onClick={() => toggleArchive(note.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              note.archived
                ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={note.archived ? 'Bỏ lưu trữ' : 'Lưu trữ'}
          >
            <Archive size={14} />
          </button>

          {/* Export */}
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Xuất file Markdown"
          >
            <Download size={14} />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="Xóa ghi chú"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Title Input */}
      <input
        type="text"
        value={note.title}
        onChange={handleTitleChange}
        placeholder="Tiêu đề ghi chú..."
        className="w-full text-2xl sm:text-3xl font-bold text-slate-100 bg-transparent border-none focus:outline-none placeholder:text-slate-600"
      />

      {/* Tags Row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Tag size={13} className="text-slate-500 shrink-0" />
        {note.tags.map((t) => (
          <span
            key={t}
            className="px-2 py-0.5 rounded-md bg-slate-800/80 text-cyan-300 text-xs font-medium flex items-center gap-1 group border border-slate-700/60"
          >
            #{t}
            <button
              type="button"
              onClick={() => handleRemoveTag(t)}
              className="text-slate-400 hover:text-rose-400 ml-0.5"
              title="Xóa tag"
            >
              <X size={11} />
            </button>
          </span>
        ))}

        {isAddingTag ? (
          <input
            type="text"
            placeholder="Tên tag..."
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            onBlur={handleAddTag}
            autoFocus
            className="px-2 py-0.5 rounded-md bg-slate-900 border border-cyan-500 text-xs text-slate-200 focus:outline-none w-24"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingTag(true)}
            className="px-2 py-0.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-slate-300 text-xs font-medium flex items-center gap-0.5 transition-colors border border-dashed border-slate-800"
          >
            <Plus size={11} /> Tag
          </button>
        )}
      </div>

      {/* Content Textarea */}
      <div className="space-y-1.5">
        <textarea
          rows={6}
          placeholder="Nội dung ghi chú tự do (hỗ trợ Markdown, ý tưởng, checklist)..."
          value={note.content || ''}
          onChange={handleContentChange}
          className="w-full px-4 py-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 leading-relaxed resize-y font-sans transition-colors min-h-[140px]"
        />
      </div>

      {/* Context Panel (If type is Context) */}
      {isContext && <ContextPanel note={note} nowTimestamp={nowTimestamp} />}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title={`Xóa ${isContext ? 'Context' : 'Ghi chú'}`}
        itemName={note.title}
        itemType={isContext ? 'context' : 'ghi chú'}
        onConfirm={() => {
          deleteNote(note.id)
          setIsDeleteModalOpen(false)
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  )
}
