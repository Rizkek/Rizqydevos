import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Topbar } from './topbar'

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

  it('exposes accessible controls for command palette, notifications, and sign out', async () => {
    const user = userEvent.setup()

    render(<Topbar />)

    const commandButton = screen.getByRole('button', { name: /open command palette/i })
    const notificationsButton = screen.getByRole('button', { name: /notifications/i })
    const signOutButton = screen.getByRole('button', { name: /sign out/i })

    expect(commandButton).toBeInTheDocument()
    expect(notificationsButton).toBeInTheDocument()
    expect(signOutButton).toBeInTheDocument()

    await user.click(signOutButton)
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})
