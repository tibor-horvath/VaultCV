import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExternalLink, KeyRound, LoaderCircle, Save, Shield } from 'lucide-react'

type ClientPrincipal = {
  userDetails?: string
  userRoles?: string[]
}

type ProfileKind = 'public' | 'private'

async function fetchAuthMe(): Promise<ClientPrincipal | null> {
  try {
    const res = await fetch('/.auth/me', { credentials: 'same-origin' })
    if (!res.ok) return null
    const data = (await res.json()) as { clientPrincipal?: ClientPrincipal }
    return data.clientPrincipal ?? null
  } catch {
    return null
  }
}

function safeJsonParse<T>(text: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) as T }
  } catch {
    return { ok: false, error: 'Invalid JSON returned by server.' }
  }
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((x) => typeof x === 'string') : []
}

function asObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function textAreaLinesToStringArray(text: string) {
  return text
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
}

function stringArrayToTextAreaLines(arr: string[]) {
  return arr.join('\n')
}

export function AdminEditorRoute() {
  const { kind } = useParams()
  const profileKind = (kind === 'public' || kind === 'private' ? kind : null) as ProfileKind | null

  const [me, setMe] = useState<ClientPrincipal | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const isAdmin = useMemo(() => (me?.userRoles ?? []).includes('admin'), [me])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null)

  // Hand-crafted form state (covers the full schema by section).
  const [basicsName, setBasicsName] = useState('')
  const [basicsHeadline, setBasicsHeadline] = useState('')
  const [basicsEmail, setBasicsEmail] = useState('')
  const [basicsMobile, setBasicsMobile] = useState('')
  const [basicsLocation, setBasicsLocation] = useState('')
  const [basicsSummary, setBasicsSummary] = useState('')
  const [basicsPhotoAlt, setBasicsPhotoAlt] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [languagesText, setLanguagesText] = useState('')

  const [links, setLinks] = useState<Array<{ label: string; url: string }>>([])
  const [credentials, setCredentials] = useState<
    Array<{ issuer: string; label: string; url: string; dateEarned?: string; dateExpires?: string }>
  >([])
  const [experience, setExperience] = useState<
    Array<{
      company: string
      companyUrl?: string
      companyLinkedInUrl?: string
      role: string
      start: string
      end: string
      location?: string
      skills?: string[]
      highlights?: string[]
    }>
  >([])
  const [education, setEducation] = useState<
    Array<{
      school: string
      schoolUrl?: string
      degree?: string
      field?: string
      program?: string
      start?: string
      end?: string
      location?: string
      gpa?: string
      highlights?: string[]
    }>
  >([])
  const [projects, setProjects] = useState<Array<{ name: string; description: string; tags?: string[]; links?: Array<{ label: string; url: string }> }>>(
    [],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const principal = await fetchAuthMe()
      if (cancelled) return
      setMe(principal)
      setMeLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function load() {
    if (!profileKind) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/profile/${profileKind}`, { credentials: 'same-origin' })
      const body = (await res.json()) as { json?: string; error?: string }
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
      const jsonText = body.json ?? ''
      const parsed = safeJsonParse<Record<string, unknown>>(jsonText)
      if (!parsed.ok) throw new Error(parsed.error)
      setRaw(parsed.value)

      const basics = asObject(parsed.value.basics)
      setBasicsName(asString(basics.name))
      setBasicsHeadline(asString(basics.headline))
      setBasicsEmail(asString(basics.email))
      setBasicsMobile(asString(basics.mobile))
      setBasicsLocation(asString(basics.location))
      setBasicsSummary(asString(basics.summary))
      setBasicsPhotoAlt(asString(basics.photoAlt))

      setSkillsText(stringArrayToTextAreaLines(asStringArray(parsed.value.skills)))
      setLanguagesText(stringArrayToTextAreaLines(asStringArray(parsed.value.languages)))

      setLinks(
        asArray(parsed.value.links).map((x) => {
          const o = asObject(x)
          return { label: asString(o.label), url: asString(o.url) }
        }),
      )

      setCredentials(
        asArray(parsed.value.credentials).map((x) => {
          const o = asObject(x)
          return {
            issuer: asString(o.issuer),
            label: asString(o.label),
            url: asString(o.url),
            dateEarned: asString(o.dateEarned) || undefined,
            dateExpires: asString(o.dateExpires) || undefined,
          }
        }),
      )

      setExperience(
        asArray(parsed.value.experience).map((x) => {
          const o = asObject(x)
          return {
            company: asString(o.company),
            companyUrl: asString(o.companyUrl) || undefined,
            companyLinkedInUrl: asString(o.companyLinkedInUrl) || undefined,
            role: asString(o.role),
            start: asString(o.start),
            end: asString(o.end),
            location: asString(o.location) || undefined,
            skills: asStringArray(o.skills),
            highlights: asStringArray(o.highlights),
          }
        }),
      )

      setEducation(
        asArray(parsed.value.education).map((x) => {
          const o = asObject(x)
          return {
            school: asString(o.school),
            schoolUrl: asString(o.schoolUrl) || undefined,
            degree: asString(o.degree) || undefined,
            field: asString(o.field) || undefined,
            program: asString(o.program) || undefined,
            start: asString(o.start) || undefined,
            end: asString(o.end) || undefined,
            location: asString(o.location) || undefined,
            gpa: asString(o.gpa) || undefined,
            highlights: asStringArray(o.highlights),
          }
        }),
      )

      setProjects(
        asArray(parsed.value.projects).map((x) => {
          const o = asObject(x)
          return {
            name: asString(o.name),
            description: asString(o.description),
            tags: asStringArray(o.tags),
            links: asArray(o.links).map((l) => {
              const lo = asObject(l)
              return { label: asString(lo.label), url: asString(lo.url) }
            }),
          }
        }),
      )
    } catch (e: any) {
      setError(e?.message ?? 'Failed loading profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!meLoading && isAdmin) {
      void load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meLoading, isAdmin, profileKind])

  async function save() {
    if (!profileKind) return
    setLoading(true)
    setError(null)
    try {
      const next: Record<string, unknown> = { ...(raw ?? {}) }
      next.basics = {
        ...(asObject(next.basics) ?? {}),
        name: basicsName.trim(),
        headline: basicsHeadline.trim(),
        email: basicsEmail.trim() || undefined,
        mobile: basicsMobile.trim() || undefined,
        location: basicsLocation.trim() || undefined,
        summary: basicsSummary.trim() || undefined,
        photoAlt: basicsPhotoAlt.trim() || undefined,
      }
      next.skills = textAreaLinesToStringArray(skillsText)
      next.languages = textAreaLinesToStringArray(languagesText)
      next.links = links.filter((l) => l.label.trim() && l.url.trim())
      next.credentials = credentials.filter((c) => c.issuer.trim() && c.label.trim() && c.url.trim())
      next.experience = experience
        .filter((e) => e.company.trim() && e.role.trim())
        .map((e) => ({
          ...e,
          skills: (e.skills ?? []).filter(Boolean),
          highlights: (e.highlights ?? []).filter(Boolean),
        }))
      next.education = education
        .filter((e) => e.school.trim())
        .map((e) => ({
          ...e,
          highlights: (e.highlights ?? []).filter(Boolean),
        }))
      next.projects = projects
        .filter((p) => p.name.trim())
        .map((p) => ({
          ...p,
          tags: (p.tags ?? []).filter(Boolean),
          links: (p.links ?? []).filter((l) => l.label.trim() && l.url.trim()),
        }))

      const json = JSON.stringify(next, null, 2)
      const res = await fetch(`/api/admin/profile/${profileKind}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ json }),
      })
      const body = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Failed saving profile.')
    } finally {
      setLoading(false)
    }
  }

  if (!profileKind) {
    return (
      <div className="w-full space-y-4 py-10 text-sm text-slate-700 dark:text-slate-300">
        Unknown editor route.
      </div>
    )
  }

  if (meLoading) {
    return (
      <div className="w-full space-y-4 py-10">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Checking admin session…
        </div>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="w-full space-y-6 py-10">
        <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Shield className="h-5 w-5" />
            <div className="text-lg font-semibold">Admin editor</div>
          </div>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            Sign in with Entra ID to edit your {profileKind === 'public' ? 'public profile' : 'private CV'}.
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              href="/.auth/login/aad"
            >
              <KeyRound className="h-4 w-4" /> Sign in <ExternalLink className="h-4 w-4 opacity-80" />
            </a>
            <Link className="text-xs font-medium text-slate-600 underline underline-offset-4 dark:text-slate-300" to="/">
              Back to site
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="w-full space-y-4 py-10">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <Shield className="h-5 w-5" />
          <div className="text-lg font-semibold">Admin editor</div>
        </div>
        <div className="text-sm text-slate-700 dark:text-slate-300">
          Signed in as <span className="font-mono">{me.userDetails ?? 'unknown'}</span>, but you don’t have the{' '}
          <span className="font-mono">admin</span> role.
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            Editor: {profileKind === 'public' ? 'Public profile' : 'Private CV'}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            This writes JSON to Blob Storage via <span className="font-mono">/api/admin/profile/{profileKind}</span>.
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link className="text-xs font-medium text-slate-600 underline dark:text-slate-300" to="/admin">
            Back to admin
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={() => void save()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </div>

      <div className="flex gap-3 text-xs">
        <Link
          to="/admin/editor/public"
          className={`rounded-lg border px-3 py-1.5 ${profileKind === 'public' ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white' : 'border-slate-300/70 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60'}`}
        >
          Public
        </Link>
        <Link
          to="/admin/editor/private"
          className={`rounded-lg border px-3 py-1.5 ${profileKind === 'private' ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white' : 'border-slate-300/70 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60'}`}
        >
          Private
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Basics</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Name
              <input
                value={basicsName}
                onChange={(e) => setBasicsName(e.target.value)}
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Headline
              <input
                value={basicsHeadline}
                onChange={(e) => setBasicsHeadline(e.target.value)}
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Email
              <input
                value={basicsEmail}
                onChange={(e) => setBasicsEmail(e.target.value)}
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Mobile
              <input
                value={basicsMobile}
                onChange={(e) => setBasicsMobile(e.target.value)}
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
              Location
              <input
                value={basicsLocation}
                onChange={(e) => setBasicsLocation(e.target.value)}
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
              Summary
              <textarea
                rows={5}
                value={basicsSummary}
                onChange={(e) => setBasicsSummary(e.target.value)}
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
              Photo alt
              <input
                value={basicsPhotoAlt}
                onChange={(e) => setBasicsPhotoAlt(e.target.value)}
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Skills & languages</div>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Skills (one per line)
            <textarea
              rows={6}
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 font-mono text-[12px] text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Languages (one per line)
            <textarea
              rows={6}
              value={languagesText}
              onChange={(e) => setLanguagesText(e.target.value)}
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 font-mono text-[12px] text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Links</div>
          <button
            type="button"
            onClick={() => setLinks((cur) => [...cur, { label: '', url: '' }])}
            className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            Add
          </button>
        </div>
        <div className="space-y-2">
          {links.map((l, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <input
                value={l.label}
                onChange={(e) =>
                  setLinks((cur) => cur.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                }
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="Label"
              />
              <input
                value={l.url}
                onChange={(e) => setLinks((cur) => cur.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))}
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white md:col-span-2"
                placeholder="https://..."
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Credentials</div>
          <button
            type="button"
            onClick={() => setCredentials((cur) => [...cur, { issuer: '', label: '', url: '' }])}
            className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            Add
          </button>
        </div>
        <div className="space-y-2">
          {credentials.map((c, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-6">
              <input
                value={c.issuer}
                onChange={(e) => setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, issuer: e.target.value } : x)))}
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="issuer"
              />
              <input
                value={c.label}
                onChange={(e) => setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white md:col-span-2"
                placeholder="label"
              />
              <input
                value={c.url}
                onChange={(e) => setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))}
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white md:col-span-2"
                placeholder="https://..."
              />
              <input
                value={c.dateEarned ?? ''}
                onChange={(e) =>
                  setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, dateEarned: e.target.value || undefined } : x)))
                }
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="earned (YYYY-MM)"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Experience</div>
          <button
            type="button"
            onClick={() =>
              setExperience((cur) => [
                ...cur,
                { company: '', role: '', start: '', end: '', skills: [], highlights: [] },
              ])
            }
            className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            Add
          </button>
        </div>
        <div className="space-y-4">
          {experience.map((e, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200/60 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input
                  value={e.company}
                  onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, company: ev.target.value } : x)))}
                  className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Company"
                />
                <input
                  value={e.role}
                  onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, role: ev.target.value } : x)))}
                  className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Role"
                />
                <input
                  value={e.start}
                  onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, start: ev.target.value } : x)))}
                  className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Start"
                />
                <input
                  value={e.end}
                  onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, end: ev.target.value } : x)))}
                  className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="End"
                />
                <input
                  value={e.location ?? ''}
                  onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, location: ev.target.value || undefined } : x)))}
                  className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white md:col-span-2"
                  placeholder="Location (optional)"
                />
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
                  Skills (one per line)
                  <textarea
                    rows={3}
                    value={stringArrayToTextAreaLines(e.skills ?? [])}
                    onChange={(ev) =>
                      setExperience((cur) =>
                        cur.map((x, i) => (i === idx ? { ...x, skills: textAreaLinesToStringArray(ev.target.value) } : x)),
                      )
                    }
                    className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 font-mono text-[12px] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
                  Highlights (one per line)
                  <textarea
                    rows={4}
                    value={stringArrayToTextAreaLines(e.highlights ?? [])}
                    onChange={(ev) =>
                      setExperience((cur) =>
                        cur.map((x, i) => (i === idx ? { ...x, highlights: textAreaLinesToStringArray(ev.target.value) } : x)),
                      )
                    }
                    className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 font-mono text-[12px] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Education</div>
          <button
            type="button"
            onClick={() => setEducation((cur) => [...cur, { school: '', program: '' }])}
            className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            Add
          </button>
        </div>
        <div className="space-y-2">
          {education.map((e, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <input
                value={e.school}
                onChange={(ev) => setEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, school: ev.target.value } : x)))}
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="School"
              />
              <input
                value={e.program ?? ''}
                onChange={(ev) =>
                  setEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, program: ev.target.value || undefined } : x)))
                }
                className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white md:col-span-2"
                placeholder="Program"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Projects</div>
          <button
            type="button"
            onClick={() => setProjects((cur) => [...cur, { name: '', description: '', tags: [], links: [] }])}
            className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            Add
          </button>
        </div>
        <div className="space-y-4">
          {projects.map((p, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200/60 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input
                  value={p.name}
                  onChange={(ev) => setProjects((cur) => cur.map((x, i) => (i === idx ? { ...x, name: ev.target.value } : x)))}
                  className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Name"
                />
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Tags (one per line)
                  <textarea
                    rows={3}
                    value={stringArrayToTextAreaLines(p.tags ?? [])}
                    onChange={(ev) =>
                      setProjects((cur) =>
                        cur.map((x, i) => (i === idx ? { ...x, tags: textAreaLinesToStringArray(ev.target.value) } : x)),
                      )
                    }
                    className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 font-mono text-[12px] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
                  Description
                  <textarea
                    rows={4}
                    value={p.description}
                    onChange={(ev) =>
                      setProjects((cur) => cur.map((x, i) => (i === idx ? { ...x, description: ev.target.value } : x)))
                    }
                    className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

