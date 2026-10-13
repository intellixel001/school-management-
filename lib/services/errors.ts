// ── ServiceError ───────────────────────────────────────────────────────────────
// Thrown by all service functions on failure.
// Page-level error.tsx boundaries (Phase 9) catch these automatically.
// When the backend swaps in real endpoints, HTTP status codes map to these codes.

export type ServiceErrorCode =
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'
  | 'INVALID_INPUT'      // generic input validation failure
  | 'INVALID_EMAIL'      // email is not a valid email address (format check)
  | 'INVALID_PIN'        // email valid but PIN is wrong
  | 'UNAUTHORIZED'       // JWT missing / expired / refresh failed
  | 'ACCOUNT_PENDING'    // account exists but awaiting teacher approval
  | 'EMAIL_TAKEN'        // Arch-6: email already registered during registration
  | 'EMAIL_UNVERIFIED'   // login blocked because OTP not confirmed yet
  | 'BAD_REQUEST'        // backend 400 (business/logic error, incl. bad credentials)
  | 'VALIDATION_ERROR'   // backend 422 (serializer validation failed)
  | 'SERVICE_ERROR'      // backend 503 (external AI/email failure)
  | 'RATE_LIMITED'       // backend 429 (per-user or per-IP throttle)
  | 'FORBIDDEN'          // backend 403 (permission denied)
  | 'TURNSTILE_FAILED'   // Cloudflare Turnstile token missing / rejected server-side


export class ServiceError extends Error {
  readonly code: ServiceErrorCode

  constructor(message: string, code: ServiceErrorCode = 'UNKNOWN') {
    super(message)
    this.name  = 'ServiceError'
    this.code  = code
    // Restore prototype chain in transpiled environments
    Object.setPrototypeOf(this, ServiceError.prototype)
  }
}
