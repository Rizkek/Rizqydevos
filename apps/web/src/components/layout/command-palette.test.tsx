import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommandPalette } from './command-palette'
import { useCommandStore } from '@/stores/command.store'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// cmdk measures the list and scrolls the active item into view; jsdom implements neither.
beforeEach(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Element.prototype.scrollIntoView ??= () => {}
})

afterEach(() => {
  useCommandStore.setState({ isOpen: false })
})

describe('CommandPalette', () => {
  it('renders nothing while closed', () => {
    const { container } = render(<CommandPalette />)
    expect(container).toBeEmptyDOMElement()
  })

  it('offers navigation and appearance commands', () => {
    useCommandStore.setState({ isOpen: true })
    render(<CommandPalette />)

    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('does not list actions that only write to the console', () => {
    useCommandStore.setState({ isOpen: true })
    render(<CommandPalette />)

    expect(screen.queryByText(/create task/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/create snippet/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/create project/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument()
  })
})
