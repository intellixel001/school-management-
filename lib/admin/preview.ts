// Fictitious UI fixtures only. Never imported by existing college portals.
export type AdminStudent = { id: string; name: string; email: string; status: string; accessEnabled: boolean; level: string; enrolledDate: string; lastActive: string }
export type AdminTeacher = { id: string; name: string; email: string; status: string; accessEnabled: boolean; assignedStudentCount: number; lastActive: string }
export type StudentAction = 'approve' | 'reject' | 'level' | 'suspend' | 'reactivate' | 'recovery'
export type TeacherAction = 'edit' | 'suspend' | 'reactivate' | 'recovery'
export type Activity = { id: string; time: string; action: string; target: string; targetId?: string; reason: string }
export const COLLEGE_NAME = 'Nelson College London'
export const KIOSK_COUNT = 1
export const PREVIEW_STUDENTS: AdminStudent[] = ['Alex Morgan', 'Maya Patel', 'Sam Taylor', 'Amina Rahman', 'Leo Evans', 'Grace Wilson', 'Oliver Reed', 'Sara Bennett', 'Noah Clarke', 'Ella Brooks'].map((name, i) => ({ id: `preview-student-${i + 1}`, name, email: `student${i + 1}@example.test`, status: i < 2 ? 'pending' : 'active', accessEnabled: i >= 2 && i !== 4, level: ['entry-1','entry-2','entry-3','level-1'][i % 4], enrolledDate: '2026-10-01', lastActive: i < 2 ? '' : '2026-10-03' }))
export const PREVIEW_TEACHERS: AdminTeacher[] = [{ id: 'preview-teacher-1', name: 'Helen Parker', email: 'teacher1@example.test', status: 'active', accessEnabled: true, assignedStudentCount: 6, lastActive: '2026-10-03' }, { id: 'preview-teacher-2', name: 'James Wilson', email: 'teacher2@example.test', status: 'active', accessEnabled: false, assignedStudentCount: 2, lastActive: '2026-09-28' }]

export function updatePreviewStudent(student: AdminStudent, action: StudentAction, level?: string): AdminStudent {
  if ((action === 'approve' || action === 'reject') && student.status !== 'pending') throw new Error('Only pending registrations can be approved or rejected.')
  if (action === 'level' && student.status !== 'active') throw new Error('Approve this student before changing their level.')
  if ((action === 'approve' || action === 'level') && !['entry-1','entry-2','entry-3','level-1'].includes(level ?? '')) throw new Error('Select a valid learning level.')
  if (['suspend','reactivate','recovery'].includes(action) && student.status !== 'active') throw new Error('This action requires an approved account.')
  switch (action) {
    case 'approve': return { ...student, status: 'active', accessEnabled: true, level: level! }
    case 'reject': return { ...student, status: 'rejected', accessEnabled: false }
    case 'level': return { ...student, level: level! }
    case 'suspend': return { ...student, accessEnabled: false }
    case 'reactivate': return { ...student, accessEnabled: true }
    default: return student
  }
}
