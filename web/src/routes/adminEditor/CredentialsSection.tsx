import { ToggleButton } from './ToggleButton'
import type { CredentialRow, PublicCredentialFlags } from './types'

export function CredentialsSection(props: {
  credentials: CredentialRow[]
  setCredentials: (updater: (cur: CredentialRow[]) => CredentialRow[]) => void
  publicCredentials: PublicCredentialFlags[]
  setPublicCredentials: (updater: (cur: PublicCredentialFlags[]) => PublicCredentialFlags[]) => void
  isMobile: boolean
}) {
  const { credentials, setCredentials, publicCredentials, setPublicCredentials, isMobile } = props
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">Credentials</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCredentials((cur) => [...cur, { issuer: '', label: '', url: '' }])
              setPublicCredentials((cur) => [...cur, { issuer: false, label: false, url: false, dateEarned: false, dateExpires: false }])
            }}
            className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            Add
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {credentials.map((c, idx) => (
          <details key={idx} open={!isMobile} className="group rounded-xl border border-slate-200/60 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-950/20">
            <summary className="cursor-pointer list-none text-xs font-semibold text-slate-700 dark:text-slate-300 md:hidden">
              <span className="mr-2 inline-block w-3 text-center transition-transform group-open:rotate-90">{'>'}</span>
              Credential {idx + 1}: {(c.label || c.issuer || 'Untitled').slice(0, 60)}
            </summary>
            <div className="mt-2 space-y-2 md:mt-0">
              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Issuer
                  <input
                    value={c.issuer}
                    onChange={(e) => setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, issuer: e.target.value } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="microsoft | aws | google | ..."
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicCredentials[idx]?.issuer)}
                    onClick={() => setPublicCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, issuer: !x.issuer } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Label
                  <input
                    value={c.label}
                    onChange={(e) => setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Microsoft Certified: ..."
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicCredentials[idx]?.label)}
                    onClick={() => setPublicCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, label: !x.label } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  URL
                  <input
                    value={c.url}
                    onChange={(e) => setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="https://..."
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicCredentials[idx]?.url)}
                    onClick={() => setPublicCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, url: !x.url } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Earned (YYYY-MM)
                  <input
                    value={c.dateEarned ?? ''}
                    onChange={(e) =>
                      setCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, dateEarned: e.target.value || undefined } : x)))
                    }
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="2025-01"
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicCredentials[idx]?.dateEarned)}
                    onClick={() => setPublicCredentials((cur) => cur.map((x, i) => (i === idx ? { ...x, dateEarned: !x.dateEarned } : x)))}
                  />
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

