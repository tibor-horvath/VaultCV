import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { redirectToLogin } from './authRedirect'

describe('redirectToLogin', () => {
  let assignSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    assignSpy = vi.fn()
    vi.stubGlobal('window', {
      location: {
        pathname: '/admin',
        search: '',
        hash: '',
        assign: assignSpy,
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('redirects to login with the current path as return URL', () => {
    redirectToLogin('/admin/dashboard')
    expect(assignSpy).toHaveBeenCalledWith(
      `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent('/admin/dashboard')}`,
    )
  })

  it('uses /admin as the fallback when returnTo is empty', () => {
    redirectToLogin('')
    expect(assignSpy).toHaveBeenCalledWith(
      `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent('/admin')}`,
    )
  })

  it('uses /admin as the fallback when returnTo is whitespace only', () => {
    redirectToLogin('   ')
    expect(assignSpy).toHaveBeenCalledWith(
      `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent('/admin')}`,
    )
  })

  it('uses current window.location when returnTo is not provided', () => {
    redirectToLogin()
    expect(assignSpy).toHaveBeenCalledWith(
      `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent('/admin')}`,
    )
  })

  it('encodes special characters in the returnTo URL', () => {
    redirectToLogin('/admin/search?q=hello world&page=1')
    expect(assignSpy).toHaveBeenCalledWith(
      `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent('/admin/search?q=hello world&page=1')}`,
    )
  })
})
