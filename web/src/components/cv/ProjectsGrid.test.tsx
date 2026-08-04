import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { LocaleProvider } from '../../lib/i18n'
import type { CvProject } from '../../types/cv'
import { ProjectsGrid } from './ProjectsGrid'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  if (root && container) {
    const toUnmount = root
    const el = container
    act(() => {
      toUnmount.unmount()
    })
    el.remove()
  }
  root = null
  container = null
})

function renderProjects(items: CvProject[]) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(
      <LocaleProvider>
        <ProjectsGrid items={items} />
      </LocaleProvider>,
    )
  })
  return container
}

const project: CvProject = {
  name: 'GoalGuess',
  description: 'A social football prediction platform.',
  links: [
    { label: 'github', url: 'https://github.com/example/goalguess' },
    { label: 'App Promo Page', url: 'https://example.com/promo' },
  ],
  tags: ['.NET', 'React'],
}

describe('ProjectsGrid project links', () => {
  it('renders a custom-labelled link as a chip alongside the preset ones', () => {
    const el = renderProjects([project])
    const anchors = Array.from(el.querySelectorAll('article a'))
    expect(anchors).toHaveLength(2)

    const custom = anchors.find((a) => a.textContent === 'App Promo Page')
    const github = anchors.find((a) => a.textContent === 'GitHub')
    expect(custom).toBeTruthy()
    expect(github).toBeTruthy()

    // Same visual treatment and same position (the title row) as the preset chip.
    expect(custom!.className).toBe(github!.className)
    expect(custom!.parentElement).toBe(github!.parentElement)
    expect(custom!.getAttribute('href')).toBe('https://example.com/promo')
    expect(custom!.getAttribute('aria-label')).toBe('GoalGuess: App Promo Page (opens in new tab)')
  })

  it('no longer renders links outside the title row', () => {
    const el = renderProjects([project])
    const titleRow = el.querySelector('article > div')
    for (const a of el.querySelectorAll('article a')) {
      expect(a.parentElement).toBe(titleRow)
    }
  })

  it('falls back to the generic web label when a custom label is blank', () => {
    const el = renderProjects([{ ...project, links: [{ label: '  ', url: 'https://example.com' }] }])
    const anchor = el.querySelector('article a')
    expect(anchor?.textContent).toBe('Web')
  })
})
