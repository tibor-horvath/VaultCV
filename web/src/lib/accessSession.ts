// Intentionally in-memory only: the access code is a bearer secret and real auth is enforced via
// the HttpOnly `cv_session` cookie set by `/api/auth` (cookie-only sessions).
let accessCode = ''

export function setStoredAccessCode(code: string) {
  accessCode = code.trim()
}

export function getStoredAccessCode() {
  return accessCode
}

export function clearStoredAccessCode() {
  accessCode = ''
}
