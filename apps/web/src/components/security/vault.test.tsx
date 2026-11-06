import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithQuery } from '@/test/render'
import { ApiError } from '@/lib/api'
import SecurityPage from '@/app/(app)/security/page'
import { VISIBLE_MS } from './secret-row'

const mocks = vi.hoisted(() => ({ fetchApi: vi.fn(), signInEmail: vi.fn(), verifyTotp: vi.fn(), twoFactorEnabled: false, search: '' }))

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(mocks.search) }))

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  fetchApi: mocks.fetchApi,
}))

vi.mock('@/lib/auth-client', () => ({
  signIn: { email: mocks.signInEmail },
  twoFactor: { verifyTotp: mocks.verifyTotp, verifyBackupCode: vi.fn() },
  useSession: () => ({ data: { user: { email: 'owner@example.com', twoFactorEnabled: mocks.twoFactorEnabled } } }),
}))

const reauthError = () => new ApiError(403, 'Confirm your password to continue.', 'REAUTH_REQUIRED')

function respond({ revealFails = 0 }: { revealFails?: number } = {}) {
  let failures = revealFails
  mocks.fetchApi.mockImplementation((endpoint: string, options?: RequestInit) => {
    if (endpoint === '/secrets') {
      if (options?.method === 'POST') return Promise.reject(new ApiError(409, 'exists', 'CONFLICT'))
      return Promise.resolve([{ id: 's1', name: 'GitHub token', key: 'GITHUB_TOKEN', category: 'api-key' }])
    }
    if (endpoint === '/audit-log') return Promise.resolve([])
    if (endpoint === '/secrets/s1/reveal') {
      if (failures > 0) { failures--; return Promise.reject(reauthError()) }
      return Promise.resolve({ value: 'test-token' })
    }
    if (endpoint === '/secrets/restore') return Promise.reject(new ApiError(400, 'Wrong passphrase, or the backup file was changed.', 'INVALID_BACKUP'))
    return Promise.reject(new Error(`unexpected ${endpoint}`))
  })
}

describe('Security vault', () => {
  beforeEach(() => {
    mocks.fetchApi.mockReset()
    mocks.signInEmail.mockReset()
    mocks.verifyTotp.mockReset()
    mocks.twoFactorEnabled = false
    mocks.search = ''
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('asks for the password when the sign-in is too old, then reveals the value', async () => {
    respond({ revealFails: 1 })
    mocks.signInEmail.mockResolvedValue({ error: null })
    renderWithQuery(<SecurityPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Reveal value of GitHub token' }))
    const dialog = await screen.findByRole('dialog', { name: 'Confirm your password' })
    await userEvent.type(within(dialog).getByLabelText('Password'), 'owner-password')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }))

    expect(await screen.findByText('test-token')).toBeInTheDocument()
    expect(mocks.signInEmail).toHaveBeenCalledWith({ email: 'owner@example.com', password: 'owner-password' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('asks for an authenticator code after the password when two-factor sign-in is on', async () => {
    respond({ revealFails: 1 })
    mocks.signInEmail.mockResolvedValue({ data: { twoFactorRedirect: true, twoFactorMethods: ['totp'] }, error: null })
    mocks.verifyTotp.mockResolvedValue({ error: null })
    renderWithQuery(<SecurityPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Reveal value of GitHub token' }))
    const passwordDialog = await screen.findByRole('dialog', { name: 'Confirm your password' })
    await userEvent.type(within(passwordDialog).getByLabelText('Password'), 'owner-password')
    await userEvent.click(within(passwordDialog).getByRole('button', { name: 'Confirm' }))

    const codeDialog = await screen.findByRole('dialog', { name: 'Enter your code' })
    expect(screen.queryByText('test-token')).not.toBeInTheDocument()
    await userEvent.type(within(codeDialog).getByLabelText('Authenticator code'), '123456')
    await userEvent.click(within(codeDialog).getByRole('button', { name: 'Confirm' }))

    expect(await screen.findByText('test-token')).toBeInTheDocument()
    expect(mocks.verifyTotp).toHaveBeenCalledWith({ code: '123456' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the dialog open and says so when the password is wrong', async () => {
    respond({ revealFails: 1 })
    mocks.signInEmail.mockResolvedValue({ error: { message: 'Invalid' } })
    renderWithQuery(<SecurityPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Reveal value of GitHub token' }))
    const dialog = await screen.findByRole('dialog', { name: 'Confirm your password' })
    await userEvent.type(within(dialog).getByLabelText('Password'), 'nope')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }))

    expect(await within(dialog).findByText('Wrong password. Try again.')).toBeInTheDocument()
    expect(screen.queryByText('test-token')).not.toBeInTheDocument()
  })

  it('hides a revealed value again after 30 seconds', async () => {
    respond()
    // Fake timers must be on before the value is revealed, because that is when the hide timer is created.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithQuery(<SecurityPage />)
    await user.click(await screen.findByRole('button', { name: 'Reveal value of GitHub token' }))
    expect(await screen.findByText('test-token')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(VISIBLE_MS - 1000) })
    expect(screen.getByText('test-token')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.queryByText('test-token')).not.toBeInTheDocument()
  })

  it('keeps the form filled and explains a duplicate key', async () => {
    respond()
    renderWithQuery(<SecurityPage />)
    await userEvent.click(await screen.findByRole('button', { name: /add secret/i }))
    await userEvent.type(screen.getByLabelText('Name'), 'Again')
    await userEvent.type(screen.getByLabelText('Key'), 'GITHUB_TOKEN')
    await userEvent.type(screen.getByLabelText('Value'), 'v')
    await userEvent.click(screen.getByRole('button', { name: 'Save Encrypted' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('A secret with the key GITHUB_TOKEN already exists.')
    expect(screen.getByLabelText('Key')).toHaveValue('GITHUB_TOKEN')
  })

  it('checks the backup passphrase before sending anything', async () => {
    respond()
    renderWithQuery(<SecurityPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Backup and import' }))

    await userEvent.type(screen.getByLabelText('Passphrase'), 'short')
    await userEvent.click(screen.getByRole('button', { name: 'Export backup' }))
    expect(await screen.findByText('Use at least 12 characters.')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Passphrase'))
    await userEvent.type(screen.getByLabelText('Passphrase'), 'a long passphrase')
    await userEvent.type(screen.getByLabelText('Repeat passphrase'), 'another one here')
    await userEvent.click(screen.getByRole('button', { name: 'Export backup' }))
    expect(await screen.findByText('The two passphrases do not match.')).toBeInTheDocument()
    expect(mocks.fetchApi).not.toHaveBeenCalledWith('/secrets/backup', expect.anything())
  })

  it('shows the reason when a restore is refused', async () => {
    respond()
    renderWithQuery(<SecurityPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Backup and import' }))

    const file = new File([JSON.stringify({ format: 'devos-secrets-backup' })], 'backup.json', { type: 'application/json' })
    await userEvent.upload(screen.getByLabelText('Backup file'), file)
    await userEvent.type(screen.getByLabelText('Backup passphrase'), 'wrong passphrase')
    await userEvent.click(screen.getByRole('button', { name: 'Restore' }))

    await waitFor(() => expect(screen.getByText('Wrong passphrase, or the backup file was changed.')).toBeInTheDocument())
  })

  it('warns that two-factor sign-in is off, and stops warning once it is on', async () => {
    respond()
    const { unmount } = renderWithQuery(<SecurityPage />)
    expect(await screen.findByText(/Two-factor sign-in is off/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
    unmount()

    mocks.twoFactorEnabled = true
    renderWithQuery(<SecurityPage />)
    await screen.findByText('GitHub token')
    expect(screen.queryByText(/Two-factor sign-in is off/)).not.toBeInTheDocument()
  })

  it('saves a login with username, website, and tags', async () => {
    respond()
    const base = mocks.fetchApi.getMockImplementation()!
    mocks.fetchApi.mockImplementation((endpoint: string, options?: RequestInit) =>
      endpoint === '/secrets' && options?.method === 'POST' ? Promise.resolve({ id: 'new' }) : base(endpoint, options))
    renderWithQuery(<SecurityPage />)

    await userEvent.click(await screen.findByRole('button', { name: /add secret/i }))
    await userEvent.type(screen.getByLabelText('Name'), 'Work GitHub')
    await userEvent.type(screen.getByLabelText('Key'), 'github.com')
    await userEvent.type(screen.getByLabelText('Username'), 'ada')
    await userEvent.type(screen.getByLabelText('Website'), 'https://github.com/login')
    await userEvent.type(screen.getByLabelText('Value'), 'pw')
    await userEvent.type(screen.getByLabelText('Tags'), 'work, code, work')
    await userEvent.click(screen.getByRole('button', { name: 'Save Encrypted' }))

    await waitFor(() => expect(mocks.fetchApi).toHaveBeenCalledWith('/secrets', expect.objectContaining({ method: 'POST' })))
    const call = mocks.fetchApi.mock.calls.find(([endpoint, options]) => endpoint === '/secrets' && options?.method === 'POST')!
    expect(JSON.parse(call[1].body)).toEqual({
      name: 'Work GitHub', key: 'github.com', value: 'pw', category: 'password', username: 'ada', url: 'https://github.com/login', tags: ['work', 'code'],
    })
  })

  it('explains which username clashed when a login already exists', async () => {
    respond()
    renderWithQuery(<SecurityPage />)
    await userEvent.click(await screen.findByRole('button', { name: /add secret/i }))
    await userEvent.type(screen.getByLabelText('Name'), 'Again')
    await userEvent.type(screen.getByLabelText('Key'), 'github.com')
    await userEvent.type(screen.getByLabelText('Username'), 'ada')
    await userEvent.type(screen.getByLabelText('Value'), 'v')
    await userEvent.click(screen.getByRole('button', { name: 'Save Encrypted' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('A secret with the key github.com and the username ada already exists.')
  })

  describe('import from a password manager', () => {
    const csv = ['name,url,username,password', 'GitHub,https://github.com,ada,pw-one', 'Broken,https://broken.example,ada,'].join('\n')

    const openImport = async () => {
      respond()
      const base = mocks.fetchApi.getMockImplementation()!
      mocks.fetchApi.mockImplementation((endpoint: string, options?: RequestInit) => {
        if (endpoint !== '/secrets/import') return base(endpoint, options)
        return Promise.resolve({ created: 1, restored: 0, skipped: 0 })
      })
      renderWithQuery(<SecurityPage />)
      await userEvent.click(await screen.findByRole('button', { name: 'Backup and import' }))
    }

    const importCalls = () => mocks.fetchApi.mock.calls.filter(([endpoint]) => endpoint === '/secrets/import').map(([, options]) => JSON.parse(String(options.body)))

    it('shows a preview first and writes nothing until it is confirmed', async () => {
      await openImport()
      await userEvent.upload(screen.getByLabelText('CSV file'), new File([csv], 'passwords.csv', { type: 'text/csv' }))

      expect(await screen.findByText(/1 new, 0 already in the vault/)).toBeInTheDocument()
      expect(screen.getByText('No password: 1')).toBeInTheDocument()
      expect(importCalls()).toEqual([{ items: [{ name: 'GitHub', key: 'github.com', username: 'ada', url: 'https://github.com', value: 'pw-one' }], dryRun: true }])

      await userEvent.click(screen.getByRole('button', { name: 'Import 1' }))
      expect(await screen.findByText(/Imported 1 secrets/)).toBeInTheDocument()
      expect(importCalls().map((call) => call.dryRun)).toEqual([true, false])
      expect(screen.queryByRole('button', { name: 'Import 1' })).not.toBeInTheDocument()
    })

    it('drops the preview when it is cancelled and sends nothing for real', async () => {
      await openImport()
      await userEvent.upload(screen.getByLabelText('CSV file'), new File([csv], 'passwords.csv', { type: 'text/csv' }))
      await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
      expect(screen.queryByRole('button', { name: 'Import 1' })).not.toBeInTheDocument()
      expect(importCalls().map((call) => call.dryRun)).toEqual([true])
    })

    it('refuses a file that is not a password export without calling the API', async () => {
      await openImport()
      await userEvent.upload(screen.getByLabelText('CSV file'), new File(['hello,world\n1,2'], 'other.csv', { type: 'text/csv' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('does not look like a password export')
      expect(importCalls()).toEqual([])
    })
  })
})
