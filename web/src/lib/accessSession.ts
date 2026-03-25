const ACCESS_CODE_KEY = 'cv.accessCode'
const ACCESS_TOKEN_KEY = 'cv.accessToken'

function safeGet(key: string) {
  try {
    return window.sessionStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function safeSet(key: string, value: string) {
  try {
    if (value) window.sessionStorage.setItem(key, value)
    else window.sessionStorage.removeItem(key)
  } catch {
    // ignore storage failures (privacy mode, disabled storage, etc.)
  }
}

let accessCode = safeGet(ACCESS_CODE_KEY)
let accessToken = safeGet(ACCESS_TOKEN_KEY)

export function setStoredAccessCode(code: string) {
  accessCode = code.trim()
  safeSet(ACCESS_CODE_KEY, accessCode)
}

export function getStoredAccessCode() {
  return accessCode
}

export function clearStoredAccessCode() {
  accessCode = ''
  safeSet(ACCESS_CODE_KEY, '')
}

export function setStoredAccessToken(token: string) {
  accessToken = token.trim()
  safeSet(ACCESS_TOKEN_KEY, accessToken)
}

export function getStoredAccessToken() {
  return accessToken
}

export function clearStoredAccessToken() {
  accessToken = ''
  safeSet(ACCESS_TOKEN_KEY, '')
}
