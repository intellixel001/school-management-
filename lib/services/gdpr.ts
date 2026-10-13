/**
 * @file lib/services/gdpr.ts
 * @description GDPR data export and account deletion for authenticated students.
 *
 * Endpoints:
 *   GET  /api/auth/me/gdpr-export  — Export all personal data as JSON
 *   POST /api/auth/me/gdpr-delete  — Permanently delete account and all data
 */

import { apiFetch } from '@/lib/api/client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GdprExportData {
  user: {
    username:  string
    email:     string
    firstName: string
    lastName:  string
  }
  profile: {
    level:        string
    status:       string
    enrolledDate: string | null
    lastActive:   string | null
  }
  totalPoints:       number
  streak:            number
  completedSessions: number
}

// ── gdprExport ────────────────────────────────────────────────────────────────

/**
 * Download all personal data for the currently authenticated student.
 *
 * GET /api/auth/me/gdpr-export
 * Requires: authenticated student JWT
 */
export async function gdprExport(): Promise<GdprExportData> {
  return apiFetch<GdprExportData>('/api/auth/me/gdpr-export')
}

// ── gdprDelete ────────────────────────────────────────────────────────────────

/**
 * Permanently delete the authenticated student's account and all associated data.
 * Cascades to profile, sessions, attempts, etc. Irreversible.
 *
 * POST /api/auth/me/gdpr-delete
 * Requires: authenticated student JWT
 */
export async function gdprDelete(): Promise<{ status: 'deleted' }> {
  return apiFetch<{ status: 'deleted' }>('/api/auth/me/gdpr-delete', { method: 'POST' })
}
