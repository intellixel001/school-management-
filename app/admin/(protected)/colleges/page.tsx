'use client'
import Link from 'next/link'
import { useAdmin, COLLEGE_NAME } from '../../_components/AdminProvider'
import { Heading, Badge } from '../../_components/Shared'
import { collegePath } from '@/lib/admin/contracts'
export default function Clients() {
 const {students,teachers,settings}=useAdmin()
 return <><Heading title="Client accounts" description="Open a client account to administer users, services and access."/><section className="ad-panel"><div className="ad-panel-head"><h2>Client directory</h2><span className="ad-muted">1 client</span></div><div className="ad-table-wrap"><table><thead><tr><th>CLIENT</th><th>STATUS</th><th>STUDENT SEATS</th><th>TEACHER SEATS</th><th>KIOSKS</th><th/></tr></thead><tbody><tr><td><Link className="ad-record-name" href={collegePath}>{COLLEGE_NAME}</Link><small className="ad-subtext">NCL-001</small></td><td><Badge value="Active"/></td><td>{students.filter(s=>s.status!=='rejected').length} / {settings.studentLimit}</td><td>{teachers.length} / {settings.teacherLimit}</td><td>1</td><td><Link className="ad-btn primary" href={collegePath}>Open account</Link></td></tr></tbody></table></div></section></>
}
