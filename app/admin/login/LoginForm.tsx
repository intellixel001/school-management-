'use client'
import { useState, useRef, type FormEvent } from 'react'
import { BookOpen } from 'lucide-react'
export default function LoginForm() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const lock = useRef(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return
    const form = event.currentTarget; const fields = new FormData(form)
    lock.current = true; setBusy(true); setError('')
    try {
      const response = await fetch('/admin/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: fields.get('username'), password: fields.get('password') }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Sign-in failed.')
      form.reset(); window.location.replace('/admin')
    } catch (err) { setError(err instanceof Error ? err.message : 'Cannot reach the server.'); lock.current = false; setBusy(false) }
  }
  return <div className="ad-login"><div className="ad-login-brand"><BookOpen size={30}/><strong>ENGLISH CONNECT</strong><span>Platform administration</span></div><section className="ad-login-card"><h1>Administrator sign in</h1><p>Secure access to college account management.</p><form onSubmit={submit}>{error && <p className="ad-error" role="alert">{error}</p>}<label>Username<input name="username" autoComplete="username" required maxLength={256} disabled={busy}/></label><label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={1024} disabled={busy}/></label><button className="ad-btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form><div className="ad-login-note"><p>For authorized administrators only. Your session expires after four hours.</p></div></section><small>English Connect · Internal administration</small></div>
}
