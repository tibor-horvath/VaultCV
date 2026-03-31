import { ToggleButton } from './ToggleButton'
import type { PublicSectionsFlags } from './types'

export function SkillsLanguagesSection(props: {
  skillsText: string
  setSkillsText: (v: string) => void
  languagesText: string
  setLanguagesText: (v: string) => void
  publicSections: PublicSectionsFlags
  setPublicSections: (updater: (cur: PublicSectionsFlags) => PublicSectionsFlags) => void
}) {
  const { skillsText, setSkillsText, languagesText, setLanguagesText, publicSections, setPublicSections } = props
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">Skills & languages</div>
        <div className="flex items-center gap-2">
          <ToggleButton pressed={publicSections.skills} onClick={() => setPublicSections((cur) => ({ ...cur, skills: !cur.skills }))} />
          <ToggleButton
            pressed={publicSections.languages}
            onClick={() => setPublicSections((cur) => ({ ...cur, languages: !cur.languages }))}
          />
        </div>
      </div>
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
  )
}

