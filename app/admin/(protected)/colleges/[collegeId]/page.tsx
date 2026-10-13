import { notFound } from 'next/navigation'
import CollegeWorkspace from '../../../_components/CollegeWorkspace'
import { COLLEGE_ID } from '@/lib/admin/contracts'
export default async function CollegePage({params}:{params:Promise<{collegeId:string}>}) {
 const {collegeId}=await params
 if(collegeId!==COLLEGE_ID) notFound()
 return <CollegeWorkspace/>
}
