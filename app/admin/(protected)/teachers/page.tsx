import { redirect } from 'next/navigation'
import { collegePath } from '@/lib/admin/contracts'
export default function LegacyPage(){redirect(collegePath+'/teachers')}
