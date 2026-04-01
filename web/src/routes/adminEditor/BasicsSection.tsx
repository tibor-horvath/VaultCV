import { ToggleButton } from './ToggleButton'
import { IdCard } from 'lucide-react'
import type { PublicBasicsFlags } from './types'
import { ProfileImageUpload } from './ProfileImageUpload'

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
  hasProfileImage: boolean
  onProfileImageChange: (hasImage: boolean) => void
  publicBasics: PublicBasicsFlags
  setPublicBasics: (updater: (cur: PublicBasicsFlags) => PublicBasicsFlags) => void
  publicBasicsErrors?: Partial<Record<keyof PublicBasicsFlags, string>>
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
    hasProfileImage,
    onProfileImageChange,
    publicBasics,
    setPublicBasics,
    publicBasicsErrors,
  } = props

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <IdCard className="h-4 w-4 shrink-0" /> Basics
        </div>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">Per-field public toggle</div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div className="grid grid-cols-[1fr_auto] items-start gap-2">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Name
            <input
              id="basics-name"
              value={basicsName}
              onChange={(e) => setBasicsName(e.target.value)}
              aria-invalid={Boolean(publicBasicsErrors?.name)}
              className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            {publicBasicsErrors?.name ? (
              <div className="text-[11px] text-red-700 dark:text-red-300">{publicBasicsErrors.name}</div>
            ) : null}
          </label>
          <div className="pt-5">
            <ToggleButton pressed={publicBasics.name} onClick={() => setPublicBasics((cur) => ({ ...cur, name: !cur.name }))} />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-start gap-2">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Headline
            <input
              id="basics-headline"
              value={basicsHeadline}
              onChange={(e) => setBasicsHeadline(e.target.value)}
              aria-invalid={Boolean(publicBasicsErrors?.headline)}
              className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            {publicBasicsErrors?.headline ? (
              <div className="text-[11px] text-red-700 dark:text-red-300">{publicBasicsErrors.headline}</div>
            ) : null}
          </label>
          <div className="pt-5">
            <ToggleButton
              pressed={publicBasics.headline}
              onClick={() => setPublicBasics((cur) => ({ ...cur, headline: !cur.headline }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-2">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Email
            <input
              id="basics-email"
              value={basicsEmail}
              onChange={(e) => setBasicsEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 items-start gap-2">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Mobile
            <input
              id="basics-mobile"
              value={basicsMobile}
              onChange={(e) => setBasicsMobile(e.target.value)}
              className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-start gap-2">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Location
            <input
              id="basics-location"
              value={basicsLocation}
              onChange={(e) => setBasicsLocation(e.target.value)}
              aria-invalid={Boolean(publicBasicsErrors?.location)}
              className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            {publicBasicsErrors?.location ? (
              <div className="text-[11px] text-red-700 dark:text-red-300">{publicBasicsErrors.location}</div>
            ) : null}
          </label>
          <div className="pt-5">
            <ToggleButton
              pressed={publicBasics.location}
              onClick={() => setPublicBasics((cur) => ({ ...cur, location: !cur.location }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-start gap-2">
          <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Summary
            <textarea
              id="basics-summary"
              rows={5}
              value={basicsSummary}
              onChange={(e) => setBasicsSummary(e.target.value)}
              aria-invalid={Boolean(publicBasicsErrors?.summary)}
              className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            {publicBasicsErrors?.summary ? (
              <div className="text-[11px] text-red-700 dark:text-red-300">{publicBasicsErrors.summary}</div>
            ) : null}
          </label>
          <div className="pt-5">
            <ToggleButton
              pressed={publicBasics.summary}
              onClick={() => setPublicBasics((cur) => ({ ...cur, summary: !cur.summary }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-start gap-2">
          <div className="flex flex-col gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            Profile photo
            <ProfileImageUpload hasProfileImage={hasProfileImage} onChange={onProfileImageChange} />
            <label className="flex flex-col gap-1">
              Photo alt text
              <input
                id="basics-photo-alt"
                value={basicsPhotoAlt}
                onChange={(e) => setBasicsPhotoAlt(e.target.value)}
                aria-invalid={Boolean(publicBasicsErrors?.photo)}
                placeholder="e.g. John Doe headshot"
                className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              {publicBasicsErrors?.photo ? (
                <div className="text-[11px] text-red-700 dark:text-red-300">{publicBasicsErrors.photo}</div>
              ) : null}
            </label>
          </div>
          <div className="pt-5">
            <ToggleButton
              pressed={publicBasics.photo}
              onClick={() => setPublicBasics((cur) => ({ ...cur, photo: !cur.photo }))}
              title="Show photo on public profile"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

