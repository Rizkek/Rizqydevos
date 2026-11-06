import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TwoFactorCard } from './two-factor-card'

const mocks = vi.hoisted(() => ({
  enable: vi.fn(),
  disable: vi.fn(),
  generateBackupCodes: vi.fn(),
  verifyTotp: vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({ twoFactor: mocks }))

const SETUP = {
  data: {
    method: 'totp',
    totpURI: 'otpauth://totp/DevOS:owner%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=DevOS',
    backupCodes: ['aaaaa-11111', 'bbbbb-22222'],
  },
  error: null,
}

describe('TwoFactorCard', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset())
  })

  it('shows the status and offers to turn it on when it is off', () => {
    render(<TwoFactorCard enabled={false} />)
    expect(screen.getByText('Status: Off')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Turn on' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Turn off' })).not.toBeInTheDocument()
  })

  it('sets up in two steps: password first, then a code from the authenticator app', async () => {
    mocks.enable.mockResolvedValue(SETUP)
    mocks.verifyTotp.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    render(<TwoFactorCard enabled={false} />)

    await user.click(screen.getByRole('button', { name: 'Turn on' }))
    await user.type(screen.getByLabelText('Password'), 'owner-password')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(mocks.enable).toHaveBeenCalledWith({ password: 'owner-password' })
    expect(await screen.findByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open in authenticator app' })).toHaveAttribute('href', SETUP.data.totpURI)
    expect(screen.getByText('aaaaa-11111')).toBeInTheDocument()
    expect(screen.getByText('bbbbb-22222')).toBeInTheDocument()
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Authenticator code'), '123 456')
    await user.click(screen.getByRole('button', { name: 'Turn on' }))

    expect(mocks.verifyTotp).toHaveBeenCalledWith({ code: '123456' })
    expect(await screen.findByText(/Two-factor sign-in is on/)).toBeInTheDocument()
  })

  it('keeps the setup open and explains a wrong code', async () => {
    mocks.enable.mockResolvedValue(SETUP)
    mocks.verifyTotp.mockResolvedValue({ error: { status: 400, message: 'Invalid code' } })
    const user = userEvent.setup()
    render(<TwoFactorCard enabled={false} />)

    await user.click(screen.getByRole('button', { name: 'Turn on' }))
    await user.type(screen.getByLabelText('Password'), 'owner-password')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.type(await screen.findByLabelText('Authenticator code'), '000000')
    await user.click(screen.getByRole('button', { name: 'Turn on' }))

    expect(await screen.findByText(/not right/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Authenticator code')).toHaveValue('000000')
    expect(screen.getByText('aaaaa-11111')).toBeInTheDocument()
  })

  it('says so when the password is wrong and does not show a secret', async () => {
    mocks.enable.mockResolvedValue({ data: null, error: { status: 400, message: 'Invalid password' } })
    const user = userEvent.setup()
    render(<TwoFactorCard enabled={false} />)

    await user.click(screen.getByRole('button', { name: 'Turn on' }))
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText(/Check your password/)).toBeInTheDocument()
    expect(screen.queryByText('JBSWY3DPEHPK3PXP')).not.toBeInTheDocument()
  })

  it('does not call the server without a password', async () => {
    const user = userEvent.setup()
    render(<TwoFactorCard enabled={false} />)
    await user.click(screen.getByRole('button', { name: 'Turn on' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    expect(mocks.enable).not.toHaveBeenCalled()
  })

  it('turns two-factor off after the password is confirmed', async () => {
    mocks.disable.mockResolvedValue({ data: { status: true }, error: null })
    const user = userEvent.setup()
    render(<TwoFactorCard enabled />)

    expect(screen.getByText('Status: On')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Turn off' }))
    await user.type(screen.getByLabelText('Password'), 'owner-password')
    await user.click(screen.getByRole('button', { name: 'Turn off' }))

    expect(mocks.disable).toHaveBeenCalledWith({ password: 'owner-password' })
    expect(await screen.findByText('Two-factor sign-in is off.')).toBeInTheDocument()
  })

  it('shows new backup codes once after the password is confirmed', async () => {
    mocks.generateBackupCodes.mockResolvedValue({ data: { status: true, backupCodes: ['ccccc-33333'] }, error: null })
    const user = userEvent.setup()
    render(<TwoFactorCard enabled />)

    await user.click(screen.getByRole('button', { name: 'New backup codes' }))
    await user.type(screen.getByLabelText('Password'), 'owner-password')
    await user.click(screen.getByRole('button', { name: 'Create codes' }))

    expect(await screen.findByText('ccccc-33333')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByText('ccccc-33333')).not.toBeInTheDocument()
  })

  it('leaves everything unchanged when the setup is cancelled', async () => {
    const user = userEvent.setup()
    render(<TwoFactorCard enabled={false} />)
    await user.click(screen.getByRole('button', { name: 'Turn on' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mocks.enable).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Turn on' })).toBeInTheDocument()
  })
})
