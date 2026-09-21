import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './page'

const { mockPush, mockSignInEmail } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSignInEmail: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/auth-client', () => ({
  signIn: { email: mockSignInEmail },
  signUp: { email: vi.fn() },
  requestPasswordReset: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('LoginPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockSignInEmail.mockReset()
  })

  it('keeps the password visibility toggle anchored to the field and toggles the input type', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const toggle = screen.getByRole('button', { name: /show password/i })
    const field = screen.getByPlaceholderText('••••••••••••')

    expect(toggle.parentElement).toHaveClass('relative')
    expect(field).toHaveAttribute('type', 'password')

    await user.click(toggle)

    expect(field).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument()
  })
})
