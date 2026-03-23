let accessCode = ''
let accessToken = ''

export function setStoredAccessCode(code: string) {
  accessCode = code.trim()
}

export function getStoredAccessCode() {
  return accessCode
}

export function clearStoredAccessCode() {
  accessCode = ''
}

export function setStoredAccessToken(token: string) {
  accessToken = token.trim()
}

export function getStoredAccessToken() {
  return accessToken
}

export function clearStoredAccessToken() {
  accessToken = ''
}
