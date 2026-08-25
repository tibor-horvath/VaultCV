import { ToggleButton } from './ToggleButton'
import { Award, Plus, Trash2 } from 'lucide-react'
import type { AwardRow, PublicSectionsFlags } from './types'
import { ConfirmButton } from './ConfirmButton'
import { useI18n } from '../../lib/i18n'

export function HonorsAwardsSection(props: {
  awards: AwardRow[]
  setAwards: (updater: (cur: AwardRow[]) => AwardRow[]) => void
  publicSections: PublicSectionsFlags
  setPublicSections: React.Dispatch<React.SetStateAction<PublicSectionsFlags>>
  isMobile: boolean
  rowErrors?: string[]
  sectionErrors?: Partial<Record<keyof PublicSectionsFlags, string>>
}) {
  const { t } = useI18n()
  const { awards, setAwards, publicSections, setPublicSections, isMobile, rowErrors, sectionErrors } = props

  function addAwardRow() {
    setAwards((cur) => [...cur, { _id: crypto.randomUUID(), title: '', issuer: '', year: '' }])
  }

  return (
    <section className="space-y-4 rounded-card border border-line bg-surface p-5">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-line bg-surface px-5 py-2 backdrop-blur md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <Award className="h-4 w-4 shrink-0" /> {t('adminHonorsAndAwards')}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addAwardRow}
            className="inline-flex items-center gap-1 rounded-field border border-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-muted"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" /> {t('adminAddAward')}
          </button>
          <ToggleButton
            label={t('adminPublic')}
            pressed={publicSections.honorsAwards}
            onClick={() => setPublicSections((cur) => ({ ...cur, honorsAwards: !cur.honorsAwards }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        {sectionErrors?.honorsAwards ? (
          <p className="text-xs text-critical" role="alert">
            {sectionErrors.honorsAwards}
          </p>
        ) : null}
        {awards.map((a, idx) => (
          <div key={a._id} className="group flex items-start gap-1">
            <details open={!isMobile} className="min-w-0 flex-1 rounded-field border border-line bg-surface p-3">
              <summary className="cursor-pointer list-none text-xs font-semibold text-ink-muted md:hidden">
                <span className="mr-2 inline-block w-3 text-center transition-transform group-open:rotate-90">{'>'}</span>
                {t('adminAwardTitle')} {idx + 1}: {(a.title || a.issuer || a.year || t('adminUntitled')).slice(0, 60)}
              </summary>
              <div className="mt-2 space-y-2 md:mt-0">
                <div className="flex justify-end">
                  <ConfirmButton
                    label={t('adminRemoveAward')}
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    className="inline-flex items-center gap-1 rounded-field border border-red-300/70 px-2 py-1 text-[11px] font-medium text-critical-soft-ink hover:bg-critical-soft"
                    confirmTitle={t('adminRemoveAward')}
                    confirmDescription={t('adminRemoveEntryConfirmDescription')}
                    confirmLabel={t('adminRemove')}
                    onConfirm={() => {
                      setAwards((cur) => cur.filter((_, i) => i !== idx))
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor={`award-title-${idx}`}>
                    {t('adminAwardTitle')}
                  </label>
                  <input
                    id={`award-title-${idx}`}
                    type="text"
                    value={a.title}
                    onChange={(e) => {
                      const v = e.target.value
                      setAwards((cur) => cur.map((row, i) => (i === idx ? { ...row, title: v } : row)))
                    }}
                    className="w-full vc-field outline-none"
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor={`award-issuer-${idx}`}>
                      {t('adminAwardIssuer')}
                    </label>
                    <input
                      id={`award-issuer-${idx}`}
                      type="text"
                      value={a.issuer ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        setAwards((cur) => cur.map((row, i) => (i === idx ? { ...row, issuer: v } : row)))
                      }}
                      className="w-full vc-field outline-none"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor={`award-year-${idx}`}>
                      {t('adminAwardYear')}
                    </label>
                    <input
                      id={`award-year-${idx}`}
                      type="text"
                      value={a.year ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        setAwards((cur) => cur.map((row, i) => (i === idx ? { ...row, year: v } : row)))
                      }}
                      className="w-full vc-field outline-none"
                      autoComplete="off"
                    />
                  </div>
                </div>
                {rowErrors?.[idx] ? (
                  <p id={`award-error-${idx}`} className="text-xs text-critical" role="alert">
                    {rowErrors[idx]}
                  </p>
                ) : null}
              </div>
            </details>
          </div>
        ))}
      </div>
    </section>
  )
}
