import { describe, expect, it } from 'vitest'
import { hasRole, readClientPrincipal, requireAdmin } from './swaAuth'

function encodePrincipal(data: object) {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

describe('readClientPrincipal', () => {
  it('returns null when headers is undefined', () => {
    expect(readClientPrincipal(undefined)).toBeNull()
  })

  it('returns null when the header is absent', () => {
    expect(readClientPrincipal({})).toBeNull()
  })

  it('returns null when header value is empty', () => {
    expect(readClientPrincipal({ 'x-ms-client-principal': '' })).toBeNull()
  })

  it('returns null when header value is whitespace only', () => {
    expect(readClientPrincipal({ 'x-ms-client-principal': '   ' })).toBeNull()
  })

  it('returns null for invalid base64 that produces non-JSON', () => {
    expect(readClientPrincipal({ 'x-ms-client-principal': 'bm90anNvbg==' })).toBeNull()
  })

  it('parses a valid base64-encoded principal', () => {
    const principal = {
      identityProvider: 'aad',
      userId: 'user-123',
      userDetails: 'user@example.com',
      userRoles: ['admin', 'anonymous'],
    }
    const encoded = encodePrincipal(principal)
    expect(readClientPrincipal({ 'x-ms-client-principal': encoded })).toMatchObject(principal)
  })

  it('is case-insensitive for the header name', () => {
    const principal = { userId: 'u1', userRoles: ['admin'] }
    const encoded = encodePrincipal(principal)
    expect(readClientPrincipal({ 'X-MS-Client-Principal': encoded })).toMatchObject(principal)
  })
})

describe('hasRole', () => {
  it('returns false for null principal', () => {
    expect(hasRole(null, 'admin')).toBe(false)
  })

  it('returns false when userRoles is empty', () => {
    expect(hasRole({ userRoles: [] }, 'admin')).toBe(false)
  })

  it('returns true when role is in userRoles', () => {
    expect(hasRole({ userRoles: ['admin'] }, 'admin')).toBe(true)
  })

  it('returns true when role is in roles property', () => {
    expect(hasRole({ roles: ['admin'] }, 'admin')).toBe(true)
  })

  it('is case-insensitive for role matching in userRoles', () => {
    expect(hasRole({ userRoles: ['Admin', 'USER'] }, 'admin')).toBe(true)
  })

  it('returns false when role is not present', () => {
    expect(hasRole({ userRoles: ['user', 'editor'] }, 'admin')).toBe(false)
  })

  it('checks role claims with typ "role"', () => {
    const principal = { claims: [{ typ: 'role', val: 'admin' }] }
    expect(hasRole(principal, 'admin')).toBe(true)
  })

  it('checks role claims with typ "roles"', () => {
    const principal = { claims: [{ typ: 'roles', val: 'editor' }] }
    expect(hasRole(principal, 'editor')).toBe(true)
  })

  it('checks role claims with full MS claim type URI', () => {
    const principal = {
      claims: [{ typ: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role', val: 'admin' }],
    }
    expect(hasRole(principal, 'admin')).toBe(true)
  })

  it('handles comma-separated values in a single claim', () => {
    const principal = { claims: [{ typ: 'roles', val: 'user, admin, editor' }] }
    expect(hasRole(principal, 'admin')).toBe(true)
    expect(hasRole(principal, 'user')).toBe(true)
    expect(hasRole(principal, 'superadmin')).toBe(false)
  })

  it('returns false for unrelated claim types', () => {
    const principal = { claims: [{ typ: 'email', val: 'admin' }] }
    expect(hasRole(principal, 'admin')).toBe(false)
  })
})

describe('requireAdmin', () => {
  it('returns 401 when no client principal header is present', () => {
    expect(requireAdmin({})).toMatchObject({ ok: false, status: 401, error: 'Unauthorized' })
  })

  it('returns 401 when headers is undefined', () => {
    expect(requireAdmin(undefined)).toMatchObject({ ok: false, status: 401 })
  })

  it('returns 403 when principal exists but lacks admin role', () => {
    const principal = { userId: 'u1', userRoles: ['anonymous', 'authenticated'] }
    const result = requireAdmin({ 'x-ms-client-principal': encodePrincipal(principal) })
    expect(result).toMatchObject({ ok: false, status: 403, error: 'Forbidden' })
  })

  it('returns ok: true with principal when admin role is present', () => {
    const principal = { userId: 'u1', userRoles: ['admin', 'authenticated'] }
    const result = requireAdmin({ 'x-ms-client-principal': encodePrincipal(principal) })
    expect(result).toMatchObject({ ok: true })
    if (result.ok) {
      expect(result.principal).toMatchObject(principal)
    }
  })
})
