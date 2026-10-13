import { notFound } from 'next/navigation'
import CollegeWorkspace from '../../../../_components/CollegeWorkspace'
import { COLLEGE_ID } from '@/lib/admin/contracts'
export default async function CollegeSection({params}:{params:Promise<{collegeId:string;section:string[]}>}){const {collegeId,section}=await params;if(collegeId!==COLLEGE_ID)notFound();return <CollegeWorkspace segments={section}/>}
