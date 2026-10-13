import { redirect } from 'next/navigation'
// Old bookmarks return to the independent admin dashboard.
export default function RemovedConnectionPage() { redirect('/admin') }
