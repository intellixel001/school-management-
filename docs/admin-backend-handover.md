# Independent admin dashboard — backend handover

## Goal

Provide platform-administrator access, independent of teacher accounts. The operator signs in once at /admin with ADMIN_USERNAME and ADMIN_PASSWORD, verified privately by Next.js. Do not require a teacher login or reuse teacher/student portal sessions.

Frontend is ready with labelled sample accounts. It makes NO Railway requests. All account actions currently update browser memory and reset on refresh. Existing college portals remain unchanged.

## Authentication agreement — implement first

Django must authorize a dedicated platform-admin identity with college-wide permissions. Agree a secure server-to-server credential or admin token exchange with the frontend developer. Keep credentials server-side in Next.js; never expose a privileged token in browser JavaScript. Do not simply trust an admin role/header or browser-supplied ID.

The existing environment login authenticates the operator to Next.js only. It does not bypass Django security. Once backend admin access is available, the frontend developer will replace the local preview handlers with authenticated API calls. No second login screen should be needed.

## Proposed API contract

These are proposed endpoints, not endpoints claimed to exist today.

| Method / path | Purpose | Input |
|---|---|---|
| GET /api/admin/overview | Real student/teacher/pending/suspended counts | None |
| GET /api/admin/colleges/{collegeId} | Client details and allocations | None |
| GET /api/admin/colleges/{collegeId}/students | College student accounts | search, status, access, page |
| GET /api/admin/students/{id} | Account tracking details | None |
| POST /api/admin/students/{id}/approve | Approve pending registration | level, reason |
| POST /api/admin/students/{id}/reject | Reject pending registration | reason |
| PATCH /api/admin/students/{id}/level | Change approved student's level | level, reason |
| PATCH /api/admin/students/{id}/access | Suspend or restore access | enabled, reason |
| POST /api/admin/students/{id}/recovery | Send verified-email access recovery | reason |
| GET /api/admin/colleges/{collegeId}/teachers | Teacher directory | search, status, page |
| POST /api/admin/colleges/{collegeId}/teachers | Invite teacher by email | name, email |
| GET /api/admin/teachers/{id} | Teacher profile | None |
| PATCH /api/admin/teachers/{id} | Edit name/email | name, email, reason |
| PATCH /api/admin/teachers/{id}/access | Suspend or restore teacher access | enabled, reason |
| POST /api/admin/teachers/{id}/recovery | Send teacher recovery | reason |
| GET/PATCH /api/admin/colleges/{collegeId}/settings | Read/update features and limits | Settings fields below; reason for writes |
| GET/PUT /api/admin/teachers/{id}/permissions | Read/replace teacher permissions | Five booleans below; reason for writes |
| GET/PUT /api/admin/teachers/{id}/students | Read/replace student assignments | studentIds, reason for writes |
| POST /api/admin/teachers/{id}/invitation | Resend/cancel pending invitation | action: resend or cancel, reason |
| POST /api/admin/{students or teachers}/{id}/sessions/revoke | Sign out all devices | reason |
| GET /api/admin/audit | Permanent admin activity | collegeId, targetId, search, page |

Existing teacher APIs already describe student listing, approve/reject and level changes. Reuse their business logic behind proper administrator authorization; do not require the operator to log in as a teacher.

## Response fields

Student: id, name, email, status (pending/active/rejected), accessEnabled, level, enrolledDate, lastActive.
Teacher: id, name, email, status (invited/active/cancelled), accessEnabled, assignedStudentCount, lastActive.
List responses: results, count, next. Audit entry: id, timestamp, authenticated actor, collegeId, action, targetId, target label, reason, before/after values. Track by stable IDs, not mutable names.
Overview: studentCount, teacherCount, pendingCount, suspendedStudentCount.

Never return passwords, PINs or tokens in account responses. Placement levels: entry-1, entry-2, entry-3, level-1.
Use 401 for missing authentication, 403 for insufficient permission, 400 for validation, 409 for conflicting state and 429 for rate limits. Return a useful error message; successful mutations return the updated account where applicable.

## Rules to confirm and implement

Settings: practice, voice, mocks, registration, approvalRequired (booleans); studentLimit, teacherLimit, aiMinutes (non-negative integers); sessionMinutes, kioskIdleMinutes (positive integers). Current frontend defaults are illustrative, not agreed commercial entitlements. Define monthly AI quota reset/timezone and actual metering with the product owner. Enforce allowances atomically on the backend; reject lowering seats below occupied capacity. Count cancelled invitations consistently when agreeing seat rules.

Teacher permissions: approveStudents, manageLevels, reviewMocks, giveFeedback, viewReports. Enforce on every corresponding teacher API, not just by hiding buttons. Default permissions are in lib/admin/contracts.ts and need product approval. Assignments may contain approved students from the same college only; return canonical IDs/counts. Decide whether multiple teachers can share a student (the preview allows it).

Revocation must invalidate existing sessions/tokens; cancelling an invitation must invalidate its acceptance link. Resends should be rate-limited and idempotent. Feature changes must be delivered to existing portals through a documented configuration API; this revision deliberately does not modify those portals.

- Approval is pending-only and sets the initial level. Prevent duplicate side effects.
- Preview rejection keeps a rejected record. The older teacher contract describes permanent deletion: agree and document final semantics before connecting the admin button. Do not silently bind a reversible-looking UI to destructive deletion.
- Keep accessEnabled separate from learning/registration status. Suspension blocks new logins and revokes existing access across relevant portals. Restoration must not revive revoked sessions.
- Recovery and invitations use expiring links/codes sent to verified email. Never display credentials to the administrator.
- Validate changed teacher email addresses. Prevent duplicate accounts and preserve administrator access when suspending staff.
- Persist audit events in Django with real backend actor attribution. The frontend's session activity feed is only a preview.
- Add permission, validation and duplicate-request tests. Use disposable accounts for acceptance testing.

## Out of scope now

Kiosk count is manually fixed at 1. No device registration or online tracking needed.
One college only. Customization, tenancy, billing, results, points and feedback administration are deferred.

## Frontend connection points

- Navigation: /admin → Client accounts → /admin/colleges/nelson → students, teachers, kiosks, settings, activity. Student detail has profile/access/activity; teacher detail additionally has permissions/assignments. Map the frontend college slug to the backend's actual college ID.
- lib/admin/contracts.ts: proposed endpoint builders and settings/permission shapes. These URLs are a handover contract, not live calls.

- lib/admin/preview.ts: typed account shapes and fixtures.
- app/admin/_components/AdminProvider.tsx: changeStudent, changeTeacher, inviteTeacher, saveSettings, savePermissions, saveAssignments, accountOperation; replace local mutations with agreed APIs, loading/error handling and server-confirmed state. Keep backend failures visible; never silently fall back to fixtures in production.
- Existing /admin/api routes handle only Next.js login/session/logout. Backend API forwarding will be added after the dedicated admin contract is available.
- Admin sessions use separate HttpOnly cookies, four-hour expiry and environment credentials. No teacher-connection screen or backend teacher credentials remain.

Before deployment, configure distributed login rate limiting in Vercel; the local throttle is per instance. Verify Django authorization and database backups. No Railway settings or data were changed for this frontend revision.
