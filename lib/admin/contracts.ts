// Proposed backend contract. These paths are NOT called in frontend preview mode.
export const COLLEGE_ID = 'nelson'
export const collegePath = `/admin/colleges/${COLLEGE_ID}`
export const adminEndpoints = {
  overview: '/api/admin/overview',
  college: (id: string) => `/api/admin/colleges/${encodeURIComponent(id)}`,
  settings: (id: string) => `/api/admin/colleges/${encodeURIComponent(id)}/settings`,
  students: (id: string) => `/api/admin/colleges/${encodeURIComponent(id)}/students`,
  teachers: (id: string) => `/api/admin/colleges/${encodeURIComponent(id)}/teachers`,
  teacherPermissions: (id: string) => `/api/admin/teachers/${encodeURIComponent(id)}/permissions`,
  teacherAssignments: (id: string) => `/api/admin/teachers/${encodeURIComponent(id)}/students`,
  revokeSessions: (role: 'students' | 'teachers', id: string) => `/api/admin/${role}/${encodeURIComponent(id)}/sessions/revoke`,
  invitation: (id: string) => `/api/admin/teachers/${encodeURIComponent(id)}/invitation`,
  audit: '/api/admin/audit',
} as const
export type TeacherPermissions = { approveStudents: boolean; manageLevels: boolean; reviewMocks: boolean; giveFeedback: boolean; viewReports: boolean }
export const DEFAULT_PERMISSIONS: TeacherPermissions = { approveStudents: false, manageLevels: false, reviewMocks: true, giveFeedback: true, viewReports: false }
export type CollegeSettings = { practice: boolean; voice: boolean; mocks: boolean; registration: boolean; studentLimit: number; teacherLimit: number; aiMinutes: number; sessionMinutes: number; approvalRequired: boolean; kioskIdleMinutes: number }
export const DEFAULT_SETTINGS: CollegeSettings = { practice:true, voice:true, mocks:true, registration:true, studentLimit:250, teacherLimit:20, aiMinutes:2000, sessionMinutes:30, approvalRequired:true, kioskIdleMinutes:5 }
