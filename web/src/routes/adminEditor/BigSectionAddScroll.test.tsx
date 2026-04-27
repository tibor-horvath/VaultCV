import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExperienceSection } from './ExperienceSection'
import { EducationSection } from './EducationSection'
import { ProjectsSection } from './ProjectsSection'
import type { EducationRow, ExperienceRow, ProjectRow, PublicEducationFlags, PublicExperienceFlags, PublicProjectFlags } from './types'

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

let scrollIntoViewOriginalDesc: PropertyDescriptor | undefined
let scrollIntoViewPatched = false

function setupScrollAndUuid(id = 'id-1') {
  // JSDOM doesn't implement scrollIntoView in some setups.
  // Patch once per file load; restore in afterEach.
  if (!scrollIntoViewPatched) {
    scrollIntoViewOriginalDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView')
    if (!scrollIntoViewOriginalDesc) {
      Object.defineProperty(Element.prototype, 'scrollIntoView', {
        value: () => {},
        writable: true,
        configurable: true,
      })
    }
    scrollIntoViewPatched = true
  }
  vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})

  const baseCrypto = globalThis.crypto ?? ({} as Crypto)
  vi.stubGlobal(
    'crypto',
    Object.assign({}, baseCrypto, {
      randomUUID: vi.fn(() => id),
    }) as Crypto,
  )
}

afterEach(() => {
  if (mountedRoot && mountedContainer) {
    act(() => {
      mountedRoot!.unmount()
    })
    mountedContainer.remove()
  }
  mountedRoot = null
  mountedContainer = null
  vi.unstubAllGlobals()
  vi.restoreAllMocks()

  if (scrollIntoViewPatched) {
    if (scrollIntoViewOriginalDesc) {
      Object.defineProperty(Element.prototype, 'scrollIntoView', scrollIntoViewOriginalDesc)
    } else {
      delete (Element.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView
    }
    scrollIntoViewPatched = false
    scrollIntoViewOriginalDesc = undefined
  }
})

describe('Admin big sections: Add scroll + focus', () => {
  it('Experience: clicking Add scrolls to new row and focuses company input', () => {
    setupScrollAndUuid('exp-1')

    function Harness() {
      const [experience, setExperience] = useState<ExperienceRow[]>([])
      const [publicExperience, setPublicExperience] = useState<PublicExperienceFlags[]>([])
      return (
        <ExperienceSection
          experience={experience}
          setExperience={(updater) => setExperience(updater)}
          publicExperience={publicExperience}
          setPublicExperience={(updater) => setPublicExperience(updater)}
          isMobile
        />
      )
    }

    mountedContainer = document.createElement('div')
    document.body.appendChild(mountedContainer)
    mountedRoot = createRoot(mountedContainer)
    act(() => {
      mountedRoot!.render(<Harness />)
    })

    const addButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('adminAdd')) as HTMLButtonElement
    expect(addButton).toBeTruthy()

    act(() => {
      addButton.click()
    })

    const input = document.getElementById('experience-company-exp-1') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(document.activeElement).toBe(input)
    expect((Element.prototype.scrollIntoView as unknown as { mock: { calls: unknown[][] } }).mock.calls.length).toBeGreaterThan(0)
  })

  it('Education: clicking Add scrolls to new row and focuses school input', () => {
    setupScrollAndUuid('edu-1')

    function Harness() {
      const [education, setEducation] = useState<EducationRow[]>([])
      const [publicEducation, setPublicEducation] = useState<PublicEducationFlags[]>([])
      return (
        <EducationSection
          education={education}
          setEducation={(updater) => setEducation(updater)}
          publicEducation={publicEducation}
          setPublicEducation={(updater) => setPublicEducation(updater)}
          isMobile
        />
      )
    }

    mountedContainer = document.createElement('div')
    document.body.appendChild(mountedContainer)
    mountedRoot = createRoot(mountedContainer)
    act(() => {
      mountedRoot!.render(<Harness />)
    })

    const addButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('adminAdd')) as HTMLButtonElement
    expect(addButton).toBeTruthy()

    act(() => {
      addButton.click()
    })

    const input = document.getElementById('education-school-edu-1') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(document.activeElement).toBe(input)
    expect((Element.prototype.scrollIntoView as unknown as { mock: { calls: unknown[][] } }).mock.calls.length).toBeGreaterThan(0)
  })

  it('Projects: clicking Add scrolls to new row and focuses name input', () => {
    setupScrollAndUuid('proj-1')

    function Harness() {
      const [projects, setProjects] = useState<ProjectRow[]>([])
      const [publicProjects, setPublicProjects] = useState<PublicProjectFlags[]>([])
      return (
        <ProjectsSection
          projects={projects}
          setProjects={(updater) => setProjects(updater)}
          publicProjects={publicProjects}
          setPublicProjects={(updater) => setPublicProjects(updater)}
          isMobile
        />
      )
    }

    mountedContainer = document.createElement('div')
    document.body.appendChild(mountedContainer)
    mountedRoot = createRoot(mountedContainer)
    act(() => {
      mountedRoot!.render(<Harness />)
    })

    const addButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('adminAdd')) as HTMLButtonElement
    expect(addButton).toBeTruthy()

    act(() => {
      addButton.click()
    })

    const input = document.getElementById('project-name-proj-1') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(document.activeElement).toBe(input)
    expect((Element.prototype.scrollIntoView as unknown as { mock: { calls: unknown[][] } }).mock.calls.length).toBeGreaterThan(0)
  })
})

