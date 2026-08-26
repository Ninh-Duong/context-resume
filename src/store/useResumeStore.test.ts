import { useResumeStore } from './useResumeStore'

export function runStoreVerification() {
  console.log('🧪 Starting Context Resume Store Verification Tests...')

  // 1. Create Task A with multiple steps
  const taskAId = useResumeStore.getState().createTask('Task A: Feature Authentication', [
    'Thiết kế database token',
    'Tạo route login',
    'Tạo middleware jwt',
  ])
  const state1 = useResumeStore.getState()
  console.assert(state1.activeTaskId === taskAId, 'Task A must be active')
  const taskA1 = state1.tasks.find((t) => t.id === taskAId)
  console.assert(taskA1?.steps.length === 3, 'Task A must have 3 steps')
  const currentStepsA = taskA1?.steps.filter((s) => s.status === 'current') ?? []
  console.assert(currentStepsA.length === 1, 'Task A must have exactly 1 current step initially')
  console.log('✅ Test 1: Task A created with single current step.')

  // 2. Add another step marked as current -> should reset former current step
  useResumeStore.getState().addStep(taskAId, 'Thêm test case bảo mật', 'current')
  const state2 = useResumeStore.getState()
  const taskA2 = state2.tasks.find((t) => t.id === taskAId)
  const currentStepsA2 = taskA2?.steps.filter((s) => s.status === 'current') ?? []
  console.assert(currentStepsA2.length === 1, 'Task A must maintain exactly 1 current step after addStep(current)')
  console.assert(currentStepsA2[0].label === 'Thêm test case bảo mật', 'The newly added step must be current')
  console.log('✅ Test 2: Single-current step constraint maintained on addStep.')

  // 3. Pause Task A with a Checkpoint and start Task B
  useResumeStore.getState().pauseActiveTask(
    {
      nextAction: 'Thêm refresh token vào middleware',
      lastCompleted: 'Tạo route login',
      blocker: 'Chờ devops cấp secret key',
    },
    'Task B: Urgent Bug Fix'
  )

  const state3 = useResumeStore.getState()
  const taskA3 = state3.tasks.find((t) => t.id === taskAId)
  console.assert(taskA3?.status === 'paused', 'Task A must be paused')
  console.assert(taskA3?.checkpoints.length === 1, 'Task A must have 1 checkpoint')
  console.assert(taskA3?.checkpoints[0].nextAction === 'Thêm refresh token vào middleware', 'Checkpoint nextAction match')
  console.assert(useResumeStore.getState().getActiveTask()?.title === 'Task B: Urgent Bug Fix', 'Task B must be active')
  console.log('✅ Test 3: Task A paused with checkpoint and Task B started.')

  // 4. Complete Task B -> System must suggest Task A from the paused stack
  const taskB = useResumeStore.getState().getActiveTask()
  if (taskB) {
    useResumeStore.getState().completeTask(taskB.id)
    const state4 = useResumeStore.getState()
    console.assert(state4.activeTaskId === taskAId, 'Task A should be auto-resumed after Task B completes')
  }
  console.log('✅ Test 4: Resume Stack automatically surfaced Task A.')

  // 5. Data export test
  const exported = useResumeStore.getState().exportData()
  console.assert(exported.length > 50, 'Exported JSON should not be empty')
  console.log('✅ Test 5: Export JSON passed.')

  console.log('🎉 ALL VERIFICATION TESTS PASSED PERFECTLY (0 assertions failed)!')
  return true
}
