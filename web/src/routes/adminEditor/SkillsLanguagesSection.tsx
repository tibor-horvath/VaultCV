import { ToggleButton } from './ToggleButton'
import { Languages, Wrench } from 'lucide-react'
import type { PublicSectionsFlags } from './types'
import { StringListEditor } from './StringListEditor'
import { stringArrayToTextAreaLines, textAreaLinesToStringArray } from './utils'

export function SkillsLanguagesSection(props: {
  skillsText: string
  setSkillsText: (v: string) => void
  languagesText: string
  setLanguagesText: (v: string) => void
  publicSections: PublicSectionsFlags
  setPublicSections: (updater: (cur: PublicSectionsFlags) => PublicSectionsFlags) => void
  sectionErrors?: Partial<Record<keyof PublicSectionsFlags, string>>
}) {
  const { skillsText, setSkillsText, languagesText, setLanguagesText, publicSections, setPublicSections, sectionErrors } = props
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Wrench className="h-4 w-4 shrink-0" /> Skills & languages
        </div>
        <div className="flex items-center gap-2">
          <ToggleButton
            label="Skills"
            pressed={publicSections.skills}
            onClick={() => setPublicSections((cur) => ({ ...cur, skills: !cur.skills }))}
          />
          <ToggleButton
            label="Languages"
            pressed={publicSections.languages}
            onClick={() => setPublicSections((cur) => ({ ...cur, languages: !cur.languages }))}
          />
        </div>
      </div>
      <StringListEditor
        label="Skills"
        inputId="skills-text"
        items={textAreaLinesToStringArray(skillsText)}
        setItems={(items) => setSkillsText(stringArrayToTextAreaLines(items))}
        placeholder="Add a skill"
        desktopColumns={3}
        error={sectionErrors?.skills}
        errorId="skills-error"
      />
      <div>
        <div className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
          <Languages className="h-3.5 w-3.5 shrink-0" /> Languages
        </div>
        <StringListEditor
          label="Languages"
          inputId="languages-text"
          items={textAreaLinesToStringArray(languagesText)}
          setItems={(items) => setLanguagesText(stringArrayToTextAreaLines(items))}
          placeholder="Add a language"
          error={sectionErrors?.languages}
          errorId="languages-error"
        />
      </div>
    </section>
  )
}

