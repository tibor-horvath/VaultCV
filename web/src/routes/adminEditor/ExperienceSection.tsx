import { ToggleButton } from './ToggleButton'
import type { ExperienceRow, PublicExperienceFlags } from './types'
import { stringArrayToTextAreaLines, textAreaLinesToStringArray } from './utils'

export function ExperienceSection(props: {
  experience: ExperienceRow[]
  setExperience: (updater: (cur: ExperienceRow[]) => ExperienceRow[]) => void
  publicExperience: PublicExperienceFlags[]
  setPublicExperience: (updater: (cur: PublicExperienceFlags[]) => PublicExperienceFlags[]) => void
  isMobile: boolean
}) {
  const { experience, setExperience, publicExperience, setPublicExperience, isMobile } = props
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">Experience</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setExperience((cur) => [...cur, { company: '', role: '', start: '', end: '', skills: [], highlights: [] }])
              setPublicExperience((cur) => [
                ...cur,
                {
                  company: false,
                  companyUrl: false,
                  companyLinkedInUrl: false,
                  role: false,
                  start: false,
                  end: false,
                  location: false,
                  skills: false,
                  highlights: false,
                },
              ])
            }}
            className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {experience.map((e, idx) => (
          <details key={idx} open={!isMobile} className="group rounded-xl border border-slate-200/60 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
            <summary className="cursor-pointer list-none text-xs font-semibold text-slate-700 dark:text-slate-300 md:hidden">
              <span className="mr-2 inline-block w-3 text-center transition-transform group-open:rotate-90">{'>'}</span>
              Experience {idx + 1}: {(e.company || e.role || 'Untitled').slice(0, 60)}
            </summary>
            <div className="mt-2 space-y-2 md:mt-0">
              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Company
                  <input
                    value={e.company}
                    onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, company: ev.target.value } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Company"
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicExperience[idx]?.company)}
                    onClick={() => setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, company: !x.company } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Role
                  <input
                    value={e.role}
                    onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, role: ev.target.value } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Role"
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicExperience[idx]?.role)}
                    onClick={() => setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, role: !x.role } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Start
                  <input
                    value={e.start}
                    onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, start: ev.target.value } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Start"
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicExperience[idx]?.start)}
                    onClick={() => setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, start: !x.start } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  End
                  <input
                    value={e.end}
                    onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, end: ev.target.value } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="End"
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicExperience[idx]?.end)}
                    onClick={() => setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, end: !x.end } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Location (optional)
                  <input
                    value={e.location ?? ''}
                    onChange={(ev) => setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, location: ev.target.value || undefined } : x)))}
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Location"
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicExperience[idx]?.location)}
                    onClick={() => setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, location: !x.location } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Skills (one per line)
                  <textarea
                    rows={3}
                    value={stringArrayToTextAreaLines(e.skills ?? [])}
                    onChange={(ev) =>
                      setExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, skills: textAreaLinesToStringArray(ev.target.value) } : x)))
                    }
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 font-mono text-[12px] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicExperience[idx]?.skills)}
                    onClick={() => setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, skills: !x.skills } : x)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <label className="flex w-full flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  Highlights (one per line)
                  <textarea
                    rows={4}
                    value={stringArrayToTextAreaLines(e.highlights ?? [])}
                    onChange={(ev) =>
                      setExperience((cur) =>
                        cur.map((x, i) => (i === idx ? { ...x, highlights: textAreaLinesToStringArray(ev.target.value) } : x)),
                      )
                    }
                    className="w-full rounded-lg border border-slate-300/70 bg-white px-3 py-2 font-mono text-[12px] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <div className="pt-5">
                  <ToggleButton
                    pressed={Boolean(publicExperience[idx]?.highlights)}
                    onClick={() =>
                      setPublicExperience((cur) => cur.map((x, i) => (i === idx ? { ...x, highlights: !x.highlights } : x)))
                    }
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

