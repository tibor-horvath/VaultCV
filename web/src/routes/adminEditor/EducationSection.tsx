import { ToggleButton } from './ToggleButton'
import type { EducationRow, PublicEducationFlags } from './types'

export function EducationSection(props: {
  education: EducationRow[]
  setEducation: (updater: (cur: EducationRow[]) => EducationRow[]) => void
  publicEducation: PublicEducationFlags[]
  setPublicEducation: (updater: (cur: PublicEducationFlags[]) => PublicEducationFlags[]) => void
  isMobile: boolean
}) {
  const { education, setEducation, publicEducation, setPublicEducation, isMobile } = props
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">Education</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEducation((cur) => [...cur, { school: '', program: '' }])
              setPublicEducation((cur) => [
                ...cur,
                {
                  school: true,
                  schoolUrl: true,
                  degree: true,
                  field: true,
                  program: true,
                  start: true,
                  end: true,
                  location: true,
                  gpa: true,
                  highlights: true,
                },
              ])
            }}
            className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            Add
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {education.map((e, idx) => (
          <details key={idx} open={!isMobile} className="group rounded-xl border border-slate-200/60 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-950/20">
            <summary className="cursor-pointer list-none text-xs font-semibold text-slate-700 dark:text-slate-300 md:hidden">
              <span className="mr-2 inline-block w-3 text-center transition-transform group-open:rotate-90">{'>'}</span>
              Education {idx + 1}: {(e.school || e.program || 'Untitled').slice(0, 60)}
            </summary>
            <div className="mt-2 grid grid-cols-1 gap-2 md:mt-0 md:grid-cols-3">
              <div className="flex items-start gap-2">
                <input
                  value={e.school}
                  onChange={(ev) => setEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, school: ev.target.value } : x)))}
                  className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="School"
                />
                <ToggleButton
                  pressed={Boolean(publicEducation[idx]?.school)}
                  onClick={() => setPublicEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, school: !x.school } : x)))}
                />
              </div>
              <div className="flex items-start gap-2 md:col-span-2">
                <input
                  value={e.program ?? ''}
                  onChange={(ev) =>
                    setEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, program: ev.target.value || undefined } : x)))
                  }
                  className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Program"
                />
                <ToggleButton
                  pressed={Boolean(publicEducation[idx]?.program)}
                  onClick={() => setPublicEducation((cur) => cur.map((x, i) => (i === idx ? { ...x, program: !x.program } : x)))}
                />
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

