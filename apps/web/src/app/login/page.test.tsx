import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './page'

const { mockPush, mockSignInEmail, mockSignUpEmail, mockVerifyTotp, mockVerifyBackupCode } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockVerifyTotp: vi.fn(),
  mockVerifyBackupCode: vi.fn(),
  mockSignInEmail: vi.fn(),
  mockSignUpEmail: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/auth-client', () => ({
  signIn: { email: mockSignInEmail },
  signUp: { email: mockSignUpEmail },
  requestPasswordReset: vi.fn(),
  twoFactor: { verifyTotp: mockVerifyTotp, verifyBackupCode: mockVerifyBackupCode },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const visit = (search: string) => window.history.pushState({}, '', `/login${search}`)

describe('LoginPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockSignInEmail.mockReset()
    mockSignUpEmail.mockReset()
    mockVerifyTotp.mockReset()
    mockVerifyBackupCode.mockReset()
    visit('')
  })

  it('keeps the password visibility toggle anchored to the field and toggles the input type', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const toggle = screen.getByRole('button', { name: /show password/i })
    const field = screen.getByLabelText('Password')

    expect(toggle.parentElement).toHaveClass('relative')
    expect(field).toHaveAttribute('type', 'password')

    await user.click(toggle)

    expect(field).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument()
  })

  it('associates every sign-in field with a visible label', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  describe('after signing in', () => {
    const signIn = async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      await user.type(screen.getByLabelText('Email'), 'ada@example.com')
      await user.type(screen.getByLabelText('Password'), 'Passw0rd1')
      await user.click(screen.getByRole('button', { name: 'Sign in' }))
    }

    beforeEach(() => {
      mockSignInEmail.mockResolvedValue({ error: null })
    })

    it('returns to the page the proxy interrupted', async () => {
      visit('?redirectTo=%2Fprojects%3Ftab%3Da')
      await signIn()
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/projects?tab=a'))
    })

    it('goes to the dashboard when there is no redirectTo', async () => {
      await signIn()
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
    })

    it.each(['https%3A%2F%2Fevil.example', '%2F%2Fevil.example', '%2F%5Cevil.example'])(
      'ignores an external redirectTo (%s) so the login cannot be used as an open redirect',
      async (value) => {
        visit(`?redirectTo=${value}`)
        await signIn()
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
      },
    )

    it('does not navigate when sign-in fails', async () => {
      mockSignInEmail.mockResolvedValue({ error: { message: 'Invalid email or password' } })
      await signIn()
      await waitFor(() => expect(mockSignInEmail).toHaveBeenCalled())
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('with two-factor sign-in on', () => {
    const passwordStep = async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      await user.type(screen.getByLabelText('Email'), 'ada@example.com')
      await user.type(screen.getByLabelText('Password'), 'Passw0rd1')
      await user.click(screen.getByRole('button', { name: 'Sign in' }))
      await screen.findByLabelText('Authenticator code')
      return user
    }

    beforeEach(() => {
      mockSignInEmail.mockResolvedValue({ data: { twoFactorRedirect: true, twoFactorMethods: ['totp'] }, error: null })
    })

    it('asks for a code after the password and does not sign in yet', async () => {
      await passwordStep()
      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('finishes the sign-in with the code and returns to the interrupted page', async () => {
      visit('?redirectTo=%2Fsecurity')
      mockVerifyTotp.mockResolvedValue({ error: null })
      const user = await passwordStep()
      await user.type(screen.getByLabelText('Authenticator code'), '123 456')
      await user.click(screen.getByRole('button', { name: 'Verify' }))
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/security'))
      expect(mockVerifyTotp).toHaveBeenCalledWith({ code: '123456' })
    })

    it('keeps the code on screen and explains a wrong code', async () => {
      mockVerifyTotp.mockResolvedValue({ error: { status: 401, message: 'Invalid code' } })
      const user = await passwordStep()
      await user.type(screen.getByLabelText('Authenticator code'), '000000')
      await user.click(screen.getByRole('button', { name: 'Verify' }))
      expect(await screen.findByText(/not right/i)).toBeInTheDocument()
      expect(screen.getByLabelText('Authenticator code')).toHaveValue('000000')
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('accepts a backup code instead', async () => {
      mockVerifyBackupCode.mockResolvedValue({ error: null })
      const user = await passwordStep()
      await user.click(screen.getByRole('button', { name: 'Use a backup code instead' }))
      await user.type(screen.getByLabelText('Backup code'), 'abcde-fghij')
      await user.click(screen.getByRole('button', { name: 'Verify' }))
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
      expect(mockVerifyBackupCode).toHaveBeenCalledWith({ code: 'abcde-fghij' })
    })

    it('goes back to the password step without leaving a typed password behind', async () => {
      const user = await passwordStep()
      await user.click(screen.getByRole('button', { name: 'Back to sign in' }))
      expect(screen.getByLabelText('Password')).toHaveValue('')
    })
  })

  describe('registration', () => {
    it('is not offered: there is no way to create an account from the sign-in screen', () => {
      render(<LoginPage />)
      expect(screen.queryByRole('button', { name: /create account/i })).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
      expect(mockSignUpEmail).not.toHaveBeenCalled()
    })
  })

  describe('forgot password', () => {
    it('offers a way back to sign in', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
      expect(screen.getByRole('heading', { name: 'Reset password' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Back to sign in' }))
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    })
  })
})
