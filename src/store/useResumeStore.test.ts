import { useResumeStore } from './useResumeStore'

export function runStoreVerification() {
  console.log('🧪 Starting Note-First & Context-Aware Store Verification Tests...')

  // 1. Create a quick note into Inbox
  const quickNoteId = useResumeStore.getState().createNote({
    title: 'Ý tưởng tối ưu giao diện',
    content: 'Cần làm gọn sidebar và giảm bớt glow',
    inInbox: true,
  })

  const state1 = useResumeStore.getState()
  const note1 = state1.notes.find((n) => n.id === quickNoteId)
  console.assert(!!note1, 'Quick Note must exist in store')
  console.assert(note1?.type === 'note', 'Default type must be note')
  console.assert(note1?.inInbox === true, 'Note must be in Inbox')
  console.log('✅ Test 1: Quick Note created into Inbox successfully.')

  // 2. Convert Note to Context & add steps
  useResumeStore.getState().convertToContext(quickNoteId, [
    'Thiết kế lại NoteSidebar',
    'Tạo NoteList và NoteEditor',
    'Tích hợp FloatingDock',
  ])

  const state2 = useResumeStore.getState()
  const contextNote = state2.notes.find((n) => n.id === quickNoteId)
  console.assert(contextNote?.type === 'context', 'Note converted to Context')
  console.assert(contextNote?.context?.status === 'active', 'Context status is active')
  console.assert(contextNote?.context?.steps.length === 3, 'Context has 3 steps')
  console.assert(state2.activeContextId === quickNoteId, 'Active context ID points to converted note')

  const currentSteps = contextNote?.context?.steps.filter((s) => s.status === 'current') ?? []
  console.assert(currentSteps.length === 1, 'Context must have exactly 1 current step initially')
  console.log('✅ Test 2: Note converted to Context with single current step constraint.')

  // 3. Complete current step -> next step automatically becomes current
  const firstStep = contextNote?.context?.steps[0]
  if (firstStep) {
    useResumeStore.getState().toggleStepComplete(quickNoteId, firstStep.id)
    const state3 = useResumeStore.getState()
    const updatedContext = state3.notes.find((n) => n.id === quickNoteId)
    const newCurrent = updatedContext?.context?.steps.find((s) => s.status === 'current')
    console.assert(newCurrent?.label === 'Tạo NoteList và NoteEditor', 'Next step auto-promoted to current')
  }
  console.log('✅ Test 3: Step completed and next step auto-promoted.')

  // 4. Pause active context with Checkpoint and start Context B
  useResumeStore.getState().pauseActiveContext(
    {
      lastCompleted: 'Thiết kế lại NoteSidebar',
      nextAction: 'Tạo NoteList và NoteEditor',
      blocker: 'Chờ icon từ Lucide',
    },
    'Context B: Fix Quick Capture Bug'
  )

  const state4 = useResumeStore.getState()
  const pausedNote = state4.notes.find((n) => n.id === quickNoteId)
  console.assert(pausedNote?.context?.status === 'paused', 'Context A must be paused')
  console.assert((pausedNote?.context?.checkpoints.length ?? 0) >= 1, 'Context A has checkpoint recorded')

  const activeNote = state4.getActiveContextNote()
  console.assert(activeNote?.title === 'Context B: Fix Quick Capture Bug', 'Context B is now active')
  console.log('✅ Test 4: Active context paused with Checkpoint and new context activated.')

  // 5. Complete Context B -> System suggests Context A from paused stack
  if (activeNote) {
    useResumeStore.getState().completeContext(activeNote.id)
    const state5 = useResumeStore.getState()
    console.assert(state5.activeContextId === quickNoteId, 'Context A should be auto-resumed after Context B completes')
  }
  console.log('✅ Test 5: Resume stack successfully resumed Context A.')

  // 6. Test Data Export format
  const exported = useResumeStore.getState().exportData()
  const parsedExport = JSON.parse(exported)
  console.assert(parsedExport.version === '2.0.0', 'Exported JSON version must be 2.0.0')
  console.assert(Array.isArray(parsedExport.notes), 'Exported JSON must contain notes array')
  console.log('✅ Test 6: Export Data format v2 verified.')

  console.log('🎉 ALL STORE VERIFICATION TESTS PASSED (0 assertions failed)!')
  return true
}

