import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Topbar } from './topbar'
import { useMobileNavStore } from '@/stores/mobile-nav.store'

const mockUseSession = vi.fn()
const mockSignOut = vi.fn()
const mockSetIsOpen = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/projects',
}))

vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
  signOut: () => mockSignOut(),
}))

vi.mock('@/stores/command.store', () => ({
  useCommandStore: {
    getState: () => ({ setIsOpen: mockSetIsOpen }),
  },
}))

describe('Topbar', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          image: '',
        },
      },
    })
    mockSetIsOpen.mockClear()
    mockSignOut.mockClear()
  })

  it('exposes accessible controls for command palette and sign out', async () => {
    const user = userEvent.setup()

    render(<Topbar />)

    const commandButton = screen.getByRole('button', { name: /open command palette/i })
    const signOutButton = screen.getByRole('button', { name: /sign out/i })

    expect(commandButton).toBeInTheDocument()
    expect(signOutButton).toBeInTheDocument()

    await user.click(commandButton)
    expect(mockSetIsOpen).toHaveBeenCalledWith(true)

    await user.click(signOutButton)
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('has no controls that do nothing', () => {
    render(<Topbar />)

    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /user menu/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Open navigation',
      'Open command palette',
      'Sign out',
    ])
  })

  it('opens the mobile navigation drawer', async () => {
    const user = userEvent.setup()
    render(<Topbar />)

    await user.click(screen.getByRole('button', { name: 'Open navigation' }))

    expect(useMobileNavStore.getState().isOpen).toBe(true)
    useMobileNavStore.setState({ isOpen: false })
  })

  it('names the signed-in user for assistive technology without making the avatar a button', () => {
    render(<Topbar />)
    expect(screen.getByRole('img', { name: 'Signed in as Ada Lovelace' })).toBeInTheDocument()
  })

  it('says when nobody is signed in', () => {
    mockUseSession.mockReturnValue({ data: null })
    render(<Topbar />)
    expect(screen.getByRole('img', { name: 'Not signed in' })).toBeInTheDocument()
  })
})
