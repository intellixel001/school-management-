# Admin dashboard

Independent Next.js admin login uses server-only ADMIN_USERNAME and ADMIN_PASSWORD. Optional ADMIN_SESSION_SECRET adds signing entropy. Credentials are never shipped to browser code or sent to Railway.

Account management is frontend-ready using explicitly labelled fictitious records. Approve/reject, level changes, student/teacher suspension and restoration, recovery previews, teacher editing and invitation previews update React state only. Changes survive navigation but reset on refresh. No emails are sent.

There is no teacher login, backend connection screen, Railway request, or privileged API proxy. The only server endpoints are /admin/api/login, /admin/api/session and /admin/api/logout.

Platform overview and client directory lead to /admin/colleges/nelson, with students, teachers, kiosks, settings and activity subpages. Individual accounts have profile/access/activity pages; teachers also have permissions and assigned-student pages. Teacher invitations can be previewed, resent or cancelled. Session revocation is a preview request only. Features and capacity/session limits are editable locally, not enforced on existing portals.

One college and one manually counted kiosk. Customization is deferred. Existing portals are unaffected. Endpoint proposals and shared configuration types are in lib/admin/contracts.ts.

Backend developer: see ../../docs/admin-backend-handover.md for the independent admin access requirement, proposed endpoints, fields and business rules. Backend implementation belongs to that developer.

Checks: npx eslint app/admin lib/admin; node --experimental-strip-types --test tests/admin-security.test.mjs tests/admin-preview.test.mjs; npm run build.
