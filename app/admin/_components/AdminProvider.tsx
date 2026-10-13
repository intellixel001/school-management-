'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { PREVIEW_STUDENTS, PREVIEW_TEACHERS, updatePreviewStudent, type StudentAction, type TeacherAction, type AdminTeacher, type Activity } from '@/lib/admin/preview'
import { DEFAULT_SETTINGS, DEFAULT_PERMISSIONS, type CollegeSettings, type TeacherPermissions } from '@/lib/admin/contracts'
export { COLLEGE_NAME, KIOSK_COUNT } from '@/lib/admin/preview'
export type { AdminStudent, AdminTeacher } from '@/lib/admin/preview'

// Authentication only. All account operations below stay in this React provider.
export async function adminRequest<T>(path: 'session' | 'logout', body?: unknown): Promise<T> {
  const response = await fetch(`/admin/api/${path}`, { method: body === undefined ? 'GET' : 'POST', cache: 'no-store', credentials: 'same-origin', ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) })
  const data = await response.json()
  if (response.status === 401) { window.location.replace('/admin/login'); throw new Error('Your admin session expired.') }
  if (!response.ok) throw new Error(data.error ?? 'Request failed.')
  return data as T
}
function useAdminState() {
  const [students, setStudents] = useState(PREVIEW_STUDENTS)
  const [teachers, setTeachers] = useState(PREVIEW_TEACHERS)
  const [notice, setNotice] = useState('')
  const [activity, setActivity] = useState<Activity[]>([])
  const [settings, setSettings] = useState<CollegeSettings>(DEFAULT_SETTINGS)
  const [permissions, setPermissions] = useState<Record<string, TeacherPermissions>>({})
  const [assignments, setAssignments] = useState<Record<string, string[]>>({ 'preview-teacher-1': PREVIEW_STUDENTS.slice(2,8).map(s=>s.id), 'preview-teacher-2': PREVIEW_STUDENTS.slice(8).map(s=>s.id) })
  useEffect(() => {
    const check = () => { if (document.visibilityState === 'visible') void adminRequest('session').catch(() => {}) }
    check()
    const timer = window.setInterval(check, 60000)
    document.addEventListener('visibilitychange', check)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', check) }
  }, [])
  function record(action: string, target: string, reason: string, targetId?: string) {
    setActivity(old => [{ id: crypto.randomUUID(), time: new Date().toLocaleString('en-GB'), action, target, targetId, reason }, ...old].slice(0,200))
    setNotice(`Preview saved: ${action.toLowerCase()} — ${target}. Backend integration pending.`)
  }
  function changeStudent(id: string, action: StudentAction, reason: string, level?: string) {
    if (!reason.trim()) throw new Error('Enter a reason for this action.')
    const current = students.find(s => s.id === id)
    if (!current) throw new Error('Account not found.')
    const updated = updatePreviewStudent(current, action, level)
    setStudents(old => old.map(s => s.id === id ? updated : s))
    record({approve:'Registration approved',reject:'Registration rejected',level:'Level changed',suspend:'Access suspended',reactivate:'Access restored',recovery:'Access recovery previewed'}[action], current.name, reason.trim(), id)
  }
  function changeTeacher(id: string, action: TeacherAction, reason: string, values?: { name: string; email: string }) {
    if (!reason.trim()) throw new Error('Enter a reason for this action.')
    const current = teachers.find(t => t.id === id)
    if (!current) throw new Error('Teacher not found.')
    if (action === 'edit' && (!values?.name.trim() || !values.email.trim())) throw new Error('Name and email are required.')
    if (action !== 'edit' && current.status !== 'active') throw new Error('This action requires an active teacher account.')
    if (values && teachers.some(t => t.id !== id && t.email.toLowerCase() === values.email.toLowerCase())) throw new Error('This email already belongs to another teacher.')
    setTeachers(old => old.map(t => t.id !== id ? t : { ...t, ...(action === 'edit' ? values : {}), ...(action === 'suspend' ? { accessEnabled: false } : action === 'reactivate' ? { accessEnabled: true } : {}) }))
    record({edit:'Teacher profile updated',suspend:'Teacher access suspended',reactivate:'Teacher access restored',recovery:'Teacher recovery previewed'}[action], current.name, reason.trim(), id)
  }
  function inviteTeacher(name: string, email: string) {
    if (!name.trim() || !email.trim()) throw new Error('Name and email are required.')
    if (teachers.some(t => t.email.toLowerCase() === email.trim().toLowerCase())) throw new Error('This email is already in the teacher directory.')
    if (teachers.length >= settings.teacherLimit) throw new Error('Teacher seat limit reached. Update the college limits first.')
    const teacher: AdminTeacher = { id: crypto.randomUUID(), name: name.trim(), email: email.trim(), status:'invited', accessEnabled:false, assignedStudentCount:0, lastActive:'' }
    setTeachers(old => [...old, teacher]); record('Teacher invitation previewed', teacher.name, 'New teacher invitation', teacher.id)
  }
  function saveSettings(value: CollegeSettings, reason: string) {
    if (!reason.trim()) throw new Error('Enter a reason for this change.')
    for (const key of ['studentLimit','teacherLimit','aiMinutes','sessionMinutes','kioskIdleMinutes'] as const) {
      if (!Number.isInteger(value[key]) || value[key] < (key === 'sessionMinutes' || key === 'kioskIdleMinutes' ? 1 : 0) || value[key] > 1000000) throw new Error('Enter valid whole-number limits.')
    }
    if(value.studentLimit < students.filter(s=>s.status!=='rejected').length || value.teacherLimit < teachers.length) throw new Error('Seat limits cannot be below existing account counts.')
    setSettings(value); record('College configuration updated','Nelson College London',reason)
  }
  function savePermissions(id:string, value:TeacherPermissions, reason:string) {
    const teacher=teachers.find(t=>t.id===id)
    if(!teacher || !reason.trim()) throw new Error('Select a teacher and enter a reason.')
    setPermissions(old=>({...old,[id]:value})); record('Teacher permissions updated',teacher.name,reason,id)
  }
  function saveAssignments(id:string, ids:string[], reason:string) {
    const teacher=teachers.find(t=>t.id===id)
    if(!teacher || !reason.trim()) throw new Error('Select a teacher and enter a reason.')
    if(ids.some(id=>!students.some(s=>s.id===id && s.status==='active'))) throw new Error('Only approved student accounts can be assigned.')
    const unique=[...new Set(ids)]
    setAssignments(old=>({...old,[id]:unique}));setTeachers(old=>old.map(t=>t.id===id?{...t,assignedStudentCount:unique.length}:t))
    record('Student assignments updated',teacher.name,reason,id)
  }
  function accountOperation(role:'students'|'teachers',id:string,action:'revoke-sessions'|'resend-invitation'|'cancel-invitation',reason:string) {
    const account=(role==='students'?students:teachers).find(a=>a.id===id)
    if(!account || !reason.trim()) throw new Error('Account and reason are required.')
    if(action!=='revoke-sessions' && (role!=='teachers' || account.status!=='invited')) throw new Error('Only pending teacher invitations can be changed.')
    if(action==='cancel-invitation')setTeachers(old=>old.map(t=>t.id===id?{...t,status:'cancelled',accessEnabled:false}:t))
    record({'revoke-sessions':'Session revocation requested','resend-invitation':'Invitation resend requested','cancel-invitation':'Invitation cancelled'}[action],account.name,reason,id)
  }
  return { students, teachers, notice, setNotice, activity, changeStudent, changeTeacher, inviteTeacher, settings, saveSettings, permissions, savePermissions, assignments, saveAssignments, accountOperation, defaultPermissions:DEFAULT_PERMISSIONS }
}
const Context = createContext<ReturnType<typeof useAdminState> | null>(null)
export function AdminProvider({ children }: { children: ReactNode }) { const value = useAdminState(); return <Context.Provider value={value}>{children}</Context.Provider> }
export function useAdmin() { const value = useContext(Context); if (!value) throw new Error('AdminProvider is required'); return value }
