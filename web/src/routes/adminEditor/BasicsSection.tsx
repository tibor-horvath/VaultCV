import { ToggleButton } from './ToggleButton'
import type { PublicBasicsFlags } from './types'

export function BasicsSection(props: {
  basicsName: string
  setBasicsName: (v: string) => void
  basicsHeadline: string
  setBasicsHeadline: (v: string) => void
  basicsEmail: string
  setBasicsEmail: (v: string) => void
  basicsMobile: string
  setBasicsMobile: (v: string) => void
  basicsLocation: string
  setBasicsLocation: (v: string) => void
  basicsSummary: string
  setBasicsSummary: (v: string) => void
  basicsPhotoAlt: string
  setBasicsPhotoAlt: (v: string) => void
  publicBasics: PublicBasicsFlags
  setPublicBasics: (updater: (cur: PublicBasicsFlags) => PublicBasicsFlags) => void
}) {
  const {
    basicsName,
    setBasicsName,
    basicsHeadline,
    setBasicsHeadline,
    basicsEmail,
    setBasicsEmail,
    basicsMobile,
    setBasicsMobile,
    basicsLocation,
    setBasicsLocation,
    basicsSummary,
    setBasicsSummary,
    basicsPhotoAlt,
    setBasicsPhotoAlt,
    publicBasics,
    setPublicBasics,
  } = props

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">Basics</div>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">Per-field public toggle</div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex items-start justify-between gap-2">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Name
            <input
              value={basicsName}
              onChange={(e) => setBasicsName(e.target.value)}
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <div className="pt-5">
            <ToggleButton pressed={publicBasics.name} onClick={() => setPublicBasics((cur) => ({ ...cur, name: !cur.name }))} />
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Headline
            <input
              value={basicsHeadline}
              onChange={(e) => setBasicsHeadline(e.target.value)}
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <div className="pt-5">
            <ToggleButton
              pressed={publicBasics.headline}
              onClick={() => setPublicBasics((cur) => ({ ...cur, headline: !cur.headline }))}
            />
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Email
            <input
              value={basicsEmail}
              onChange={(e) => setBasicsEmail(e.target.value)}
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <div className="pt-5">
            <ToggleButton pressed={publicBasics.email} onClick={() => setPublicBasics((cur) => ({ ...cur, email: !cur.email }))} />
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Mobile
            <input
              value={basicsMobile}
              onChange={(e) => setBasicsMobile(e.target.value)}
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <div className="pt-5">
            <ToggleButton
              pressed={publicBasics.mobile}
              onClick={() => setPublicBasics((cur) => ({ ...cur, mobile: !cur.mobile }))}
            />
          </div>
        </div>

        <div className="flex items-start justify-between gap-2 md:col-span-2">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Location
            <input
              value={basicsLocation}
              onChange={(e) => setBasicsLocation(e.target.value)}
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <div className="pt-5">
            <ToggleButton
              pressed={publicBasics.location}
              onClick={() => setPublicBasics((cur) => ({ ...cur, location: !cur.location }))}
            />
          </div>
        </div>

        <div className="flex items-start justify-between gap-2 md:col-span-2">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Summary
            <textarea
              rows={5}
              value={basicsSummary}
              onChange={(e) => setBasicsSummary(e.target.value)}
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <div className="pt-5">
            <ToggleButton
              pressed={publicBasics.summary}
              onClick={() => setPublicBasics((cur) => ({ ...cur, summary: !cur.summary }))}
            />
          </div>
        </div>

        <div className="flex items-start justify-between gap-2 md:col-span-2">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Photo alt
            <input
              value={basicsPhotoAlt}
              onChange={(e) => setBasicsPhotoAlt(e.target.value)}
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <div className="pt-5">
            <ToggleButton
              pressed={publicBasics.photoAlt}
              onClick={() => setPublicBasics((cur) => ({ ...cur, photoAlt: !cur.photoAlt }))}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

