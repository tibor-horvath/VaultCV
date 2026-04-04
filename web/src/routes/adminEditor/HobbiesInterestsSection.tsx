import { ToggleButton } from './ToggleButton'
import { TentTree } from 'lucide-react'
import type { PublicSectionsFlags } from './types'
import { ChipListEditor } from './ChipListEditor'
import { useI18n } from '../../lib/i18n'

export function HobbiesInterestsSection(props: {
  hobbiesInterests: string[]
  setHobbiesInterests: (v: string[]) => void
  publicSections: PublicSectionsFlags
  setPublicSections: React.Dispatch<React.SetStateAction<PublicSectionsFlags>>
  sectionErrors?: Partial<Record<keyof PublicSectionsFlags, string>>
}) {
  const { t } = useI18n()
  const { hobbiesInterests, setHobbiesInterests, publicSections, setPublicSections, sectionErrors } = props
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <TentTree className="h-4 w-4 shrink-0" /> {t('adminHobbiesAndInterests')}
        </div>
        <ToggleButton
          label={t('adminPublic')}
          pressed={publicSections.hobbiesInterests}
          onClick={() => setPublicSections((cur) => ({ ...cur, hobbiesInterests: !cur.hobbiesInterests }))}
        />
      </div>
      <ChipListEditor
        items={hobbiesInterests}
        onChange={setHobbiesInterests}
        placeholder={t('adminAddHobbyOrInterest')}
        inputId="hobbies-interests-input"
        error={sectionErrors?.hobbiesInterests}
        errorId="hobbies-interests-error"
      />
    </section>
  )
}
