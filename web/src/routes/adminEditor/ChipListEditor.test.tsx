import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { ChipListEditor } from './ChipListEditor'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | null = null
let mountedContainer: HTMLDivElement | null = null

function renderEditor(initialItems: string[]) {
  mountedContainer = document.createElement('div')
  document.body.appendChild(mountedContainer)
  mountedRoot = createRoot(mountedContainer)

  function Harness() {
    const [items, setItems] = useState(initialItems)
    return <ChipListEditor items={items} onChange={setItems} inputId="chip-input" />
  }

  act(() => {
    mountedRoot!.render(<Harness />)
  })
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
})

describe('ChipListEditor', () => {
  it('starts with add button disabled for empty input', () => {
    renderEditor(['TypeScript'])
    const addButton = Array.from(document.querySelectorAll('button')).find((node) => node.textContent?.trim() === 'Add') as HTMLButtonElement
    expect(addButton.disabled).toBe(true)
    expect(document.body.textContent).toContain('TypeScript')
  })

  it('removes an existing chip', () => {
    renderEditor(['TypeScript', 'React'])
    const removeButton = document.querySelector('button[aria-label="Remove TypeScript"]') as HTMLButtonElement
    expect(removeButton).toBeTruthy()
    act(() => {
      removeButton.click()
    })
    expect(document.body.textContent).not.toContain('TypeScript')
    expect(document.body.textContent).toContain('React')
  })
})
