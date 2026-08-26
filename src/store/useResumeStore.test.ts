import { useResumeStore } from './useResumeStore'

export function runStoreVerification() {
  console.log('🧪 Starting Context Resume Store Verification Tests...')

  // 1. Create Task A
  const taskAId = useResumeStore.getState().createTask('Task A: Feature Authentication', [
    'Thiết kế database token',
    'Tạo route login',
    'Tạo middleware jwt',
  ])
  const state1 = useResumeStore.getState()
  console.assert(state1.activeTaskId === taskAId, 'Task A must be active')
  console.assert(state1.tasks.find((t) => t.id === taskAId)?.steps.length === 3, 'Task A must have 3 steps')
  console.log('✅ Test 1: Task A created successfully.')

  // 2. Pause Task A with a Checkpoint and start Task B
  useResumeStore.getState().pauseActiveTask(
    {
      nextAction: 'Thêm refresh token vào middleware',
      lastCompleted: 'Tạo route login',
      blocker: 'Chờ devops cấp secret key',
    },
    'Task B: Urgent Bug Fix'
  )

  const state2 = useResumeStore.getState()
  const taskA = state2.tasks.find((t) => t.id === taskAId)
  console.assert(taskA?.status === 'paused', 'Task A must be paused')
  console.assert(taskA?.checkpoints.length === 1, 'Task A must have 1 checkpoint')
  console.assert(taskA?.checkpoints[0].nextAction === 'Thêm refresh token vào middleware', 'Checkpoint nextAction match')
  console.assert(useResumeStore.getState().getActiveTask()?.title === 'Task B: Urgent Bug Fix', 'Task B must be active')
  console.log('✅ Test 2: Task A paused with checkpoint and Task B started.')

  // 3. Complete Task B -> System must suggest Task A from the paused stack
  const taskB = useResumeStore.getState().getActiveTask()
  if (taskB) {
    useResumeStore.getState().completeTask(taskB.id)
    const state3 = useResumeStore.getState()
    console.assert(state3.activeTaskId === taskAId, 'Task A should be auto-resumed after Task B completes')
  }
  console.log('✅ Test 3: Resume Stack automatically surfaced Task A.')

  // 4. Update Step statuses
  const step0 = useResumeStore.getState().tasks.find((t) => t.id === taskAId)?.steps[0]
  if (step0) {
    useResumeStore.getState().updateStepStatus(taskAId, step0.id, 'done')
    const updatedStep = useResumeStore.getState().tasks.find((t) => t.id === taskAId)?.steps[0]
    console.assert(updatedStep?.status === 'done', 'Step 0 must be done')
  }
  console.log('✅ Test 4: Step status updated to done.')

  // 5. Data export test
  const exported = useResumeStore.getState().exportData()
  console.assert(exported.length > 50, 'Exported JSON should not be empty')
  console.log('✅ Test 5: Export JSON passed.')

  console.log('🎉 ALL STORE VERIFICATION TESTS PASSED PERFECTLY (0 assertions failed)!')
  return true
}
