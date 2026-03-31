function currentRelativeUrl() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

export function redirectToLogin(returnTo: string = currentRelativeUrl()) {
  const target = returnTo?.trim() || '/admin'
  const loginUrl = `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(target)}`
  window.location.assign(loginUrl)
}
