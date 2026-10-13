import type { Teacher } from '@/types/platform'

export const DUMMY_TEACHER: Teacher & { password: string } = {
  id: 'tch-001',
  name: 'Korani Begum',
  email: 'k.begum@nelsoncollege.ac.uk',
  password: '123456',
  avatar: 'KB',
  assignedStudents: [
    'stu-001', 'stu-002', 'stu-003', 'stu-004', 'stu-005',
    'stu-006', 'stu-007', 'stu-008', 'stu-009', 'stu-010',
    'stu-011', 'stu-012',
  ],
  pendingReviews: 4,
}
