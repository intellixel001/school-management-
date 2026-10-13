import 'server-only'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE, verifySession, SESSION_SECONDS } from './security'

export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/admin', maxAge: SESSION_SECONDS }
export async function isAdmin() { return verifySession((await cookies()).get(ADMIN_COOKIE)?.value) }
